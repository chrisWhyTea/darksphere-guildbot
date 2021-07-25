-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "permissionsViewRoleId" TEXT NOT NULL,
    "permissionsEditRoleId" TEXT NOT NULL,
    "permissionsAdminRoleId" TEXT NOT NULL,
    "userLogChannelId" TEXT,
    "userLogOnUserEvents" BOOLEAN NOT NULL DEFAULT false,
    "botLogChannelId" TEXT,
    "botLogActive" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'en'
);
INSERT INTO "new_Server" ("botLogActive", "botLogChannelId", "createdAt", "id", "permissionsAdminRoleId", "permissionsEditRoleId", "permissionsViewRoleId", "updatedAt", "userLogChannelId", "userLogOnUserEvents") SELECT "botLogActive", "botLogChannelId", "createdAt", "id", "permissionsAdminRoleId", "permissionsEditRoleId", "permissionsViewRoleId", "updatedAt", "userLogChannelId", "userLogOnUserEvents" FROM "Server";
DROP TABLE "Server";
ALTER TABLE "new_Server" RENAME TO "Server";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
