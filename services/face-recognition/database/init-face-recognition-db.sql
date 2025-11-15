-- ============================================
-- 🔧 FACE RECOGNITION DATABASE SCHEMA
-- Database: zentry
-- Version: 2.0 (UserId changed from UUID to INTEGER)
-- ============================================

-- Connect to zentry database
-- \c zentry;

-- ============================================
-- 📦 TABLE: FaceEmbeddings
-- Store encrypted face embeddings for users
-- ============================================
CREATE TABLE IF NOT EXISTS "FaceEmbeddings" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "UserId" INTEGER NOT NULL,
    "EncryptedEmbedding" BYTEA NOT NULL,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookup by UserId (unique - one embedding per user)
CREATE UNIQUE INDEX IF NOT EXISTS "IX_FaceEmbeddings_UserId" 
ON "FaceEmbeddings" ("UserId");

COMMENT ON TABLE "FaceEmbeddings" IS 'Stores encrypted 512-D face embeddings (ArcFace) for biometric authentication';
COMMENT ON COLUMN "FaceEmbeddings"."UserId" IS 'References accounts.id from IAM database';
COMMENT ON COLUMN "FaceEmbeddings"."EncryptedEmbedding" IS 'AES-256-GCM encrypted face embedding (512 floats)';

-- ============================================
-- 📦 TABLE: FaceIdVerifyRequests
-- Track face verification requests for attendance
-- ============================================
CREATE TABLE IF NOT EXISTS "FaceIdVerifyRequests" (
    "Id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "RequestGroupId" UUID NOT NULL,
    "TargetUserId" INTEGER NOT NULL,
    "InitiatorUserId" INTEGER NULL,
    "SessionId" UUID NULL,
    "ClassSectionId" UUID NULL,
    "Threshold" REAL NOT NULL DEFAULT 0.7,
    "Status" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMPTZ NOT NULL,
    "CompletedAt" TIMESTAMPTZ NULL,
    "Matched" BOOLEAN NULL,
    "Similarity" REAL NULL,
    "NotificationId" VARCHAR(128) NULL,
    "MetadataJson" JSONB NULL
);

-- Status enum values:
-- 0 = Pending
-- 1 = Completed
-- 2 = Expired
-- 3 = Failed

-- Index for fast lookup by expiration time (cleanup expired requests)
CREATE INDEX IF NOT EXISTS "IX_FaceIdReq_ExpiresAt" 
ON "FaceIdVerifyRequests" ("ExpiresAt");

-- Composite index for attendance check queries
CREATE INDEX IF NOT EXISTS "IX_FaceIdReq_Group_Target_Status_Exp" 
ON "FaceIdVerifyRequests" ("RequestGroupId", "TargetUserId", "Status", "ExpiresAt");

-- Index for session-based queries
CREATE INDEX IF NOT EXISTS "IX_FaceIdReq_Session_Status" 
ON "FaceIdVerifyRequests" ("SessionId", "Status");

COMMENT ON TABLE "FaceIdVerifyRequests" IS 'Face verification requests for attendance check-in/check-out';
COMMENT ON COLUMN "FaceIdVerifyRequests"."TargetUserId" IS 'Employee ID to verify (from employee_db)';
COMMENT ON COLUMN "FaceIdVerifyRequests"."Threshold" IS 'Minimum similarity score (0.0-1.0) to consider match';
COMMENT ON COLUMN "FaceIdVerifyRequests"."Similarity" IS 'Actual cosine similarity score from verification';

-- ============================================
-- 📦 TABLE: __EFMigrationsHistory
-- EF Core migration tracking
-- ============================================
CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" VARCHAR(150) PRIMARY KEY,
    "ProductVersion" VARCHAR(32) NOT NULL
);

-- Insert migration history (marks schema as up-to-date)
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES 
    ('20250817095343_Initial', '8.0.0'),
    ('20251114180904_ConvertUserIdFromGuidToInt', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;

-- ============================================
-- ✅ VERIFICATION QUERIES
-- ============================================
SELECT 'FaceEmbeddings table' AS table_name, COUNT(*) AS row_count FROM "FaceEmbeddings"
UNION ALL
SELECT 'FaceIdVerifyRequests table', COUNT(*) FROM "FaceIdVerifyRequests"
UNION ALL
SELECT '__EFMigrationsHistory table', COUNT(*) FROM "__EFMigrationsHistory";

-- Show all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ============================================
-- 🎯 GRANT PERMISSIONS
-- ============================================
-- Grant permissions to postgres user (adjust if using different user)
GRANT ALL PRIVILEGES ON TABLE "FaceEmbeddings" TO postgres;
GRANT ALL PRIVILEGES ON TABLE "FaceIdVerifyRequests" TO postgres;
GRANT ALL PRIVILEGES ON TABLE "__EFMigrationsHistory" TO postgres;

-- ============================================
-- 📝 USAGE NOTES
-- ============================================
-- 1. Run this script on the 'zentry' database:
--    psql -U postgres -d zentry -f init-face-recognition-db.sql
--
-- 2. Or connect first then run:
--    \c zentry
--    \i init-face-recognition-db.sql
--
-- 3. Verify tables created:
--    \dt
--    SELECT * FROM "__EFMigrationsHistory";
--
-- 4. FaceEmbeddings stores ONE embedding per user (unique constraint)
--
-- 5. FaceIdVerifyRequests tracks verification attempts with:
--    - RequestGroupId: Group multiple users' verification (e.g., class attendance)
--    - Threshold: Configurable per-request (default 0.7)
--    - Status: 0=Pending, 1=Completed, 2=Expired, 3=Failed
--    - Similarity: Actual match score (0.0-1.0)
--
-- 6. To drop and recreate:
--    DROP TABLE IF EXISTS "FaceEmbeddings" CASCADE;
--    DROP TABLE IF EXISTS "FaceIdVerifyRequests" CASCADE;
--    DROP TABLE IF EXISTS "__EFMigrationsHistory" CASCADE;
