-- CreateTable
CREATE TABLE "Server" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "permissionsViewRoleId" TEXT NOT NULL,
    "permissionsEditRoleId" TEXT NOT NULL,
    "permissionsAdminRoleId" TEXT NOT NULL,
    "userLogChannelId" TEXT,
    "userLogOnUserEvents" BOOLEAN NOT NULL DEFAULT false
);
