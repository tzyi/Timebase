-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "listId" INTEGER,
    "title" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "dueDate" DATETIME,
    "dueTime" TEXT,
    "endTime" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'none',
    "status" TEXT NOT NULL DEFAULT 'todo',
    "completedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completedAt", "createdAt", "dueDate", "dueTime", "id", "listId", "note", "priority", "sortOrder", "status", "title", "updatedAt", "userId") SELECT "completedAt", "createdAt", "dueDate", "dueTime", "id", "listId", "note", "priority", "sortOrder", "status", "title", "updatedAt", "userId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_userId_idx" ON "Task"("userId");
CREATE INDEX "Task_listId_idx" ON "Task"("listId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
