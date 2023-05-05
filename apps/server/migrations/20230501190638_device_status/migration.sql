/*
  Warnings:

  - Added the required column `status` to the `Device` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Device" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "deviceID" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lotId" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Device_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Device" ("createdAt", "deviceID", "id", "lotId", "name", "updatedAt") SELECT "createdAt", "deviceID", "id", "lotId", "name", "updatedAt" FROM "Device";
DROP TABLE "Device";
ALTER TABLE "new_Device" RENAME TO "Device";
CREATE UNIQUE INDEX "Device_deviceID_key" ON "Device"("deviceID");
CREATE UNIQUE INDEX "Device_lotId_key" ON "Device"("lotId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
