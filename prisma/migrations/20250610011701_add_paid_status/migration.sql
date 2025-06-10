-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "duration" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "totalPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "variableSymbol" TEXT,
    "rentedGear" TEXT,
    "gearPrice" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "FishingSpot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("createdAt", "customerEmail", "customerName", "customerPhone", "duration", "endDate", "gearPrice", "id", "rentedGear", "spotId", "startDate", "startTime", "status", "totalPrice", "updatedAt", "variableSymbol") SELECT "createdAt", "customerEmail", "customerName", "customerPhone", "duration", "endDate", "gearPrice", "id", "rentedGear", "spotId", "startDate", "startTime", "status", "totalPrice", "updatedAt", "variableSymbol" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
