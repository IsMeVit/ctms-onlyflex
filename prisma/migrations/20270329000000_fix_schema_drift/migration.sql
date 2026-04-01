-- Fix schema drift: add missing columns and enums

-- 1. Create ScreenType enum (use DO block for IF NOT EXISTS)
DO $$ BEGIN
    CREATE TYPE "ScreenType" AS ENUM ('STANDARD_2D', 'THREE_D', 'SCREENX');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add missing columns to Hall
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "screenType" "ScreenType" NOT NULL DEFAULT 'STANDARD_2D';
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "rows" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "Hall" ADD COLUMN IF NOT EXISTS "row_configs" JSONB;

-- 3. Add missing columns to Showtime
ALTER TABLE "Showtime" ADD COLUMN IF NOT EXISTS "vipMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 1.5;
ALTER TABLE "Showtime" ADD COLUMN IF NOT EXISTS "twinseatMultiplier" DECIMAL(65,30) NOT NULL DEFAULT 1.5;

-- 4. Add TWINSEAT to SeatType enum (PostgreSQL requires separate check)
DO $$ BEGIN
    ALTER TYPE "SeatType" ADD VALUE 'TWINSEAT';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Drop old unique constraint on Seat if still present
ALTER TABLE "Seat" DROP CONSTRAINT IF EXISTS "Seat_hallId_row_number_key";
