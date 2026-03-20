#!/usr/bin/env ts-node
/**
 * Migration Script: Convert old seat system to coordinate-based system
 * 
 * This script:
 * 1. Backs up existing hall and seat data
 * 2. Converts old integer-based seats to (row, column) coordinate grid
 * 3. Preserves capacity constraints
 * 4. Generates optimal grid layout
 * 
 * Run with: npx ts-node scripts/migrate-to-coordinate-system.ts
 */

import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Convert 0-based index to row label (A-Z, AA, AB, AC...)
 */
function getRowLabel(index: number): string {
  if (index < 0) return '';
  
  let label = '';
  let n = index;
  
  do {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  
  return label;
}

async function migrate() {
  console.log('🎬 Starting Cinema Hall Seat Migration...\n');

  try {
    // Step 1: Backup existing data
    console.log('📦 Step 1: Creating backups...');
    
    // Check if backups already exist
    const backupExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'halls_backup'
      );
    `;
    
    if (!backupExists[0].exists) {
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS halls_backup AS SELECT * FROM halls`;
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS seats_backup AS SELECT * FROM seats`;
      console.log('   ✓ Backups created: halls_backup, seats_backup');
    } else {
      console.log('   ℹ Backups already exist, skipping...');
    }

    // Step 2: Get all halls
    console.log('\n🏛 Step 2: Analyzing existing halls...');
    const halls = await prisma.hall.findMany();

    console.log(`   Found ${halls.length} halls to migrate`);

    // Step 3: Migrate each hall
    console.log('\n🔄 Step 3: Migrating halls to coordinate system...');
    
    for (const hall of halls) {
      console.log(`\n   Processing: ${hall.name} (ID: ${hall.id})`);
      console.log(`   - Current capacity: ${hall.capacity}`);

      // Calculate optimal columns (aim for ~10 seats per row)
      const columns = Math.min(12, Math.max(8, Math.ceil(Math.sqrt(hall.capacity * 1.2))));
      const rows = Math.ceil(hall.capacity / columns);

      console.log(`   - New grid: ${rows} rows × ${columns} columns`);

      // Delete old seats
      const deletedCount = await prisma.seat.deleteMany({
        where: { hallId: hall.id }
      });
      console.log(`   - Deleted ${deletedCount} old seats`);

      // Generate new coordinate-based seats
      const newSeats: Array<{
        hallId: string;
        row: string;
        column: number;
        number: number;
        seatNumber: number | null;
        seatType: 'REGULAR' | 'VIP' | 'TWINSEAT';
        status: 'AVAILABLE' | 'SELECTED' | 'BOOKED' | 'RESERVED' | 'INACTIVE' | 'BLOCKED';
      }> = [];

      for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        const row = getRowLabel(rowIdx);
        const isLastRow = rowIdx === rows - 1;
        const seatsInLastRow = hall.capacity % columns || columns;

        for (let col = 0; col < columns; col++) {
          const isExcess = isLastRow && col >= seatsInLastRow;
          
          newSeats.push({
            hallId: hall.id,
            row,
            column: col,
            number: isExcess ? 0 : col + 1,
            seatNumber: isExcess ? null : col + 1,
            seatType: 'REGULAR',
            status: isExcess ? 'INACTIVE' : 'AVAILABLE'
          });
        }
      }

      // Bulk create new seats
      await prisma.seat.createMany({ data: newSeats });

      // Update hall with columns
      await prisma.hall.update({
        where: { id: hall.id },
        data: { 
          columns,
          isPublished: false, // Reset published status
          publishedAt: null,
          version: 1
        }
      });

      console.log(`   ✓ Created ${newSeats.length} new seats`);
      console.log(`   ✓ Updated hall configuration`);
    }

    // Step 4: Verify migration
    console.log('\n✅ Step 4: Verifying migration...');
    
    const totalHalls = await prisma.hall.count();
    const totalSeats = await prisma.seat.count();
    const publishedHalls = await prisma.hall.count({ where: { isPublished: true } });
    
    console.log(`   - Total halls: ${totalHalls}`);
    console.log(`   - Total seats: ${totalSeats}`);
    console.log(`   - Published halls: ${publishedHalls} (reset to draft)`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('  1. Review migrated halls in the admin panel');
    console.log('  2. Adjust seat configurations as needed');
    console.log('  3. Publish halls when ready\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.log('\nTo rollback:');
    console.log('  1. Restore from backups: halls_backup, seats_backup');
    console.log('  2. Or run: npx prisma migrate reset\n');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
