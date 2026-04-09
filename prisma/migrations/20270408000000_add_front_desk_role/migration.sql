-- Add FRONT_DESK role to Role enum

DO $$ BEGIN
    ALTER TYPE "Role" ADD VALUE 'FRONT_DESK';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;