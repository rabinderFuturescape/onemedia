-- Add indexes to frequently queried fields

-- User indexes
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User" ("organizationId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User" ("role");

-- Organization indexes
CREATE INDEX IF NOT EXISTS "Organization_createdAt_idx" ON "Organization" ("createdAt");
CREATE INDEX IF NOT EXISTS "Organization_updatedAt_idx" ON "Organization" ("updatedAt");

-- Post indexes
CREATE INDEX IF NOT EXISTS "Post_authorId_idx" ON "Post" ("authorId");
CREATE INDEX IF NOT EXISTS "Post_organizationId_idx" ON "Post" ("organizationId");
CREATE INDEX IF NOT EXISTS "Post_status_idx" ON "Post" ("status");
CREATE INDEX IF NOT EXISTS "Post_createdAt_idx" ON "Post" ("createdAt");
CREATE INDEX IF NOT EXISTS "Post_publishedAt_idx" ON "Post" ("publishedAt");

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "Post_organizationId_status_idx" ON "Post" ("organizationId", "status");
CREATE INDEX IF NOT EXISTS "Post_authorId_status_idx" ON "Post" ("authorId", "status");
CREATE INDEX IF NOT EXISTS "Post_organizationId_publishedAt_idx" ON "Post" ("organizationId", "publishedAt");

-- Channel indexes
CREATE INDEX IF NOT EXISTS "Channel_organizationId_idx" ON "Channel" ("organizationId");
CREATE INDEX IF NOT EXISTS "Channel_type_idx" ON "Channel" ("type");
CREATE INDEX IF NOT EXISTS "Channel_status_idx" ON "Channel" ("status");

-- Subscription indexes
CREATE INDEX IF NOT EXISTS "Subscription_organizationId_idx" ON "Subscription" ("organizationId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription" ("status");
CREATE INDEX IF NOT EXISTS "Subscription_expiresAt_idx" ON "Subscription" ("expiresAt");

-- Analytics indexes
CREATE INDEX IF NOT EXISTS "Analytics_postId_idx" ON "Analytics" ("postId");
CREATE INDEX IF NOT EXISTS "Analytics_channelId_idx" ON "Analytics" ("channelId");
CREATE INDEX IF NOT EXISTS "Analytics_date_idx" ON "Analytics" ("date");
CREATE INDEX IF NOT EXISTS "Analytics_organizationId_idx" ON "Analytics" ("organizationId");

-- Composite indexes for analytics queries
CREATE INDEX IF NOT EXISTS "Analytics_organizationId_date_idx" ON "Analytics" ("organizationId", "date");
CREATE INDEX IF NOT EXISTS "Analytics_postId_date_idx" ON "Analytics" ("postId", "date");
CREATE INDEX IF NOT EXISTS "Analytics_channelId_date_idx" ON "Analytics" ("channelId", "date");
