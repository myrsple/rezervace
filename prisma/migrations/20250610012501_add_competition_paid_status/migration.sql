-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompetitionRegistration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "totalPrice" REAL NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "variableSymbol" TEXT,
    "rentedGear" TEXT,
    "gearPrice" REAL DEFAULT 0,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompetitionRegistration_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompetitionRegistration" ("competitionId", "createdAt", "customerEmail", "customerName", "customerPhone", "gearPrice", "id", "registeredAt", "rentedGear", "totalPrice", "updatedAt", "variableSymbol") SELECT "competitionId", "createdAt", "customerEmail", "customerName", "customerPhone", "gearPrice", "id", "registeredAt", "rentedGear", "totalPrice", "updatedAt", "variableSymbol" FROM "CompetitionRegistration";
DROP TABLE "CompetitionRegistration";
ALTER TABLE "new_CompetitionRegistration" RENAME TO "CompetitionRegistration";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
