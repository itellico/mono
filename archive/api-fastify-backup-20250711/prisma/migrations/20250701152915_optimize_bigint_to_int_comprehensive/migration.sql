-- BigInt to Int Optimization Migration
-- Phase 1: Account.id (BigInt -> Int)
-- Phase 2: User.id and related foreign keys (BigInt -> Int)
-- Keep: AuditLog.id, UserActivityLog.id (high-growth tables remain BigInt)

-- Start transaction
BEGIN;

-- Step 1: Remove foreign key constraints that reference the tables we're modifying
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_accountId_fkey";
ALTER TABLE "UserRole" DROP CONSTRAINT IF EXISTS "UserRole_userId_fkey";
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_userId_fkey";
ALTER TABLE "user_activity_logs" DROP CONSTRAINT IF EXISTS "user_activity_logs_userId_fkey";
ALTER TABLE "record_locks" DROP CONSTRAINT IF EXISTS "record_locks_lockedBy_fkey";

-- Step 2: Convert Account.id from BigInt to Integer
-- First check data is within Int range (should be safe based on audit)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Account" WHERE id > 2147483647 OR id < -2147483648) THEN
        RAISE EXCEPTION 'Account.id values exceed Integer range. Aborting migration.';
    END IF;
END $$;

-- Convert Account.id
ALTER TABLE "Account" ALTER COLUMN "id" TYPE INTEGER;

-- Step 3: Convert User.id and User.accountId from BigInt to Integer
-- Check User.id is within Int range
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "User" WHERE id > 2147483647 OR id < -2147483648) THEN
        RAISE EXCEPTION 'User.id values exceed Integer range. Aborting migration.';
    END IF;
    IF EXISTS (SELECT 1 FROM "User" WHERE "accountId" > 2147483647 OR "accountId" < -2147483648) THEN
        RAISE EXCEPTION 'User.accountId values exceed Integer range. Aborting migration.';
    END IF;
END $$;

-- Convert User.id and User.accountId
ALTER TABLE "User" ALTER COLUMN "id" TYPE INTEGER;
ALTER TABLE "User" ALTER COLUMN "accountId" TYPE INTEGER;

-- Step 4: Convert foreign key references to User.id
-- UserRole.userId
ALTER TABLE "UserRole" ALTER COLUMN "userId" TYPE INTEGER;

-- AuditLog.userId (nullable)
ALTER TABLE "audit_logs" ALTER COLUMN "userId" TYPE INTEGER;

-- UserActivityLog.userId (nullable)  
ALTER TABLE "user_activity_logs" ALTER COLUMN "userId" TYPE INTEGER;

-- RecordLock.lockedBy
ALTER TABLE "record_locks" ALTER COLUMN "lockedBy" TYPE INTEGER;

-- Step 5: Re-add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_accountId_fkey" 
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "record_locks" ADD CONSTRAINT "record_locks_lockedBy_fkey" 
    FOREIGN KEY ("lockedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Commit transaction
COMMIT; 