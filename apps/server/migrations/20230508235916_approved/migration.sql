-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT,
    "college" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("college", "createdAt", "id", "name", "password", "reference", "type", "updatedAt", "username") SELECT "college", "createdAt", "id", "name", "password", "reference", "type", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_reference_key" ON "User"("reference");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
