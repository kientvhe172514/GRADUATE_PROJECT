-- ============================================
-- Face Recognition Database Schema
-- Run this script directly in pgAdmin
-- Database: zentry (public schema)
-- ============================================

-- Step 1: Clean up existing migration history (if any issues)
DROP TABLE IF EXISTS "__EFMigrationsHistory" CASCADE;

-- Step 2: Create FaceEmbeddings table
CREATE TABLE IF NOT EXISTS "FaceEmbeddings" (
    "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserId" INTEGER NOT NULL,
    "EncryptedEmbedding" BYTEA NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_FaceEmbeddings" PRIMARY KEY ("Id")
);

-- Index on UserId for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS "IX_FaceEmbeddings_UserId" 
    ON "FaceEmbeddings" ("UserId");

-- Add comments
COMMENT ON TABLE "FaceEmbeddings" IS 'Stores encrypted face embeddings for user authentication';
COMMENT ON COLUMN "FaceEmbeddings"."Id" IS 'Primary key (UUID)';
COMMENT ON COLUMN "FaceEmbeddings"."UserId" IS 'Reference to user ID (INTEGER from auth service)';
COMMENT ON COLUMN "FaceEmbeddings"."EncryptedEmbedding" IS 'AES-encrypted 512D face vector';
COMMENT ON COLUMN "FaceEmbeddings"."CreatedAt" IS 'Timestamp when embedding was first created';
COMMENT ON COLUMN "FaceEmbeddings"."UpdatedAt" IS 'Timestamp when embedding was last updated';

-- Step 3: Create FaceIdVerifyRequests table
CREATE TABLE IF NOT EXISTS "FaceIdVerifyRequests" (
    "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "UserId" INTEGER NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Pending',
    "SimilarityScore" DOUBLE PRECISION NULL,
    "VerifiedAt" TIMESTAMP WITH TIME ZONE NULL,
    "ExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "CreatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "UpdatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "PK_FaceIdVerifyRequests" PRIMARY KEY ("Id")
);

-- Indexes for query optimization
CREATE INDEX IF NOT EXISTS "IX_FaceIdVerifyRequests_UserId_Status" 
    ON "FaceIdVerifyRequests" ("UserId", "Status");

CREATE INDEX IF NOT EXISTS "IX_FaceIdVerifyRequests_ExpiresAt" 
    ON "FaceIdVerifyRequests" ("ExpiresAt");

CREATE INDEX IF NOT EXISTS "IX_FaceIdVerifyRequests_CreatedAt" 
    ON "FaceIdVerifyRequests" ("CreatedAt" DESC);

-- Add comments
COMMENT ON TABLE "FaceIdVerifyRequests" IS 'Tracks face verification requests and results';
COMMENT ON COLUMN "FaceIdVerifyRequests"."Id" IS 'Primary key (UUID)';
COMMENT ON COLUMN "FaceIdVerifyRequests"."UserId" IS 'User requesting verification';
COMMENT ON COLUMN "FaceIdVerifyRequests"."Status" IS 'Verification status: Pending, Verified, Failed, Expired';
COMMENT ON COLUMN "FaceIdVerifyRequests"."SimilarityScore" IS 'Cosine similarity score (0.0-1.0, threshold ~0.6)';
COMMENT ON COLUMN "FaceIdVerifyRequests"."VerifiedAt" IS 'Timestamp when verification completed';
COMMENT ON COLUMN "FaceIdVerifyRequests"."ExpiresAt" IS 'Request expiration time (typically 5 minutes)';

-- Step 4: Create migration history table
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- Step 5: Record applied migrations
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
    ('20250817095343_Initial', '8.0.0'),
    ('20251114180904_ConvertUserIdFromGuidToInt', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- Step 6: Verify tables created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('FaceEmbeddings', 'FaceIdVerifyRequests', '__EFMigrationsHistory')
ORDER BY table_name;

-- Step 7: Show migration history
SELECT * FROM "__EFMigrationsHistory" ORDER BY "MigrationId";

-- ============================================
-- ✅ Script completed successfully!
-- ============================================
-- You should see 3 tables:
-- 1. FaceEmbeddings (with IX_FaceEmbeddings_UserId index)
-- 2. FaceIdVerifyRequests (with 3 indexes)
-- 3. __EFMigrationsHistory (2 rows)
-- ============================================
