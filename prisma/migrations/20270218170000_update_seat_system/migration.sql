-- Migration: Update seat system to coordinate-based layout

-- Step 1: Add new columns to Hall table WITH DEFAULT VALUES
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "columns" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3);
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Update HallType enum - convert 'Regular' to 'STANDARD'
UPDATE "Hall" SET "hallType" = 'STANDARD' WHERE "hallType" = 'Regular';

-- Step 3: Add new columns to Seat table WITH DEFAULT VALUES
ALTER TABLE "Seat" ADD COLUMN IF NOT EXISTS "column" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Seat" ADD COLUMN IF NOT EXISTS "seatNumber" INTEGER;
ALTER TABLE "Seat" ADD COLUMN IF NOT EXISTS "linkedSeatId" TEXT;

-- Step 4: Update existing seats - convert number to column (0-based)
UPDATE "Seat" SET "column" = COALESCE("number" - 1, 0);

-- Step 5: Set seatNumber equal to number for existing data
UPDATE "Seat" SET "seatNumber" = "number";

-- Step 6: Create the new SeatStatus enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SeatStatus') THEN
        CREATE TYPE "SeatStatus" AS ENUM ('AVAILABLE', 'SELECTED', 'BOOKED', 'RESERVED', 'INACTIVE', 'BLOCKED');
    END IF;
END $$;

-- Step 7: Add status column with default
ALTER TABLE "Seat" ADD COLUMN IF NOT EXISTS "status" "SeatStatus" DEFAULT 'AVAILABLE';

-- Step 8: Update status based on isActive (only if column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'Seat' AND column_name = 'isActive') THEN
        UPDATE "Seat" SET "status" = CASE 
            WHEN "isActive" = true THEN 'AVAILABLE'::"SeatStatus"
            ELSE 'INACTIVE'::"SeatStatus"
        END;
    END IF;
END $$;

-- Step 9: Make status NOT NULL
ALTER TABLE "Seat" ALTER COLUMN "status" SET NOT NULL;

-- Step 10: Drop old unique constraint if exists
ALTER TABLE "Seat" DROP CONSTRAINT IF EXISTS "Seat_hallId_row_number_key";

-- Step 11: Create new unique constraint for coordinate system
DROP INDEX IF EXISTS "Seat_hallId_row_column_key";
CREATE UNIQUE INDEX "Seat_hallId_row_column_key" ON "Seat"("hallId", "row", "column");

-- Step 12: Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Seat_linkedSeatId_idx" ON "Seat"("linkedSeatId");
CREATE INDEX IF NOT EXISTS "Seat_hallId_status_idx" ON "Seat"("hallId", "status");

-- Step 13: Note about enum changes
-- The SeatType and HallType enum modifications will be handled by Prisma
-- when we regenerate the client and sync the schema
