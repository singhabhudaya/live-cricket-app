-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Commentary" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "innings" INTEGER NOT NULL DEFAULT 1,
    "over" INTEGER NOT NULL,
    "ball" INTEGER NOT NULL,
    "event" TEXT NOT NULL,
    "runsBat" INTEGER NOT NULL DEFAULT 0,
    "runsExtra" INTEGER NOT NULL DEFAULT 0,
    "wicket" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Commentary_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Commentary" ("ball", "createdAt", "event", "id", "matchId", "notes", "over", "runsBat", "runsExtra", "wicket") SELECT "ball", "createdAt", "event", "id", "matchId", "notes", "over", "runsBat", "runsExtra", "wicket" FROM "Commentary";
DROP TABLE "Commentary";
ALTER TABLE "new_Commentary" RENAME TO "Commentary";
CREATE INDEX "Commentary_matchId_innings_over_ball_idx" ON "Commentary"("matchId", "innings", "over", "ball");
CREATE TABLE "new_Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" INTEGER NOT NULL,
    "teamA" TEXT NOT NULL,
    "teamB" TEXT NOT NULL,
    "oversPerSide" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LIVE',
    "currentInnings" INTEGER NOT NULL DEFAULT 1,
    "winner" TEXT,
    "result" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Match" ("code", "createdAt", "id", "oversPerSide", "status", "teamA", "teamB", "updatedAt") SELECT "code", "createdAt", "id", "oversPerSide", "status", "teamA", "teamB", "updatedAt" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE UNIQUE INDEX "Match_code_key" ON "Match"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
