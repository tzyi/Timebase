# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 回覆語言

所有回覆、分析、說明、Commit Message、Code Review、文件、PR 說明、Debug 過程、問題分析，一律使用「繁體中文（台灣）」。

---

## 專案概述

**Timebase** 是一個時間管理軟體，提供清單、月曆和看板等功能。

- **技術棧**：Next.js 15 (App Router) + React 19 + TypeScript + Prisma + SQLite + NextAuth
- **樣式**：Tailwind CSS + PostCSS
- **資料庫**：SQLite，使用 Prisma 進行 ORM
- **認證**：NextAuth（Credentials Provider，使用 bcrypt 進行密碼驗證）

---

## 高層架構

### 路由結構（Next.js App Router）

```
src/app/
├── layout.tsx                      # 根層布局
├── page.tsx                        # 重定向至 /app/tasks
├── globals.css                     # 全域樣式
├── (auth)/                         # 認證相關路由（路由分組）
│   └── layout.tsx
├── (app)/                          # 應用主體路由（路由分組）
│   ├── layout.tsx
│   └── tasks/
│       └── page.tsx               # 任務清單頁面（MVP）
└── ...
```

**注意**：使用 Next.js [路由分組](https://nextjs.org/docs/app/building-your-application/routing/route-groups)（括號），允許在不影響 URL 結構的情況下組織相關路由。

### 資料模型

Prisma schema 定義了以下核心實體：

- **User**：用戶帳戶，與 lists、tags、tasks 相關聯
- **ListFolder**：清單資料夾，用戶擁有，可包含多個 lists
- **List**：清單，屬於用戶和資料夾（可選），包含 tasks
- **Task**：任務，屬於用戶和清單（可選），具有優先級、截止日期、狀態、標籤等
- **Tag**：標籤，屬於用戶
- **TaskTag**：任務和標籤之間的多對多關聯

**設計特點**：
- 所有資料都與用戶關聯（多租戶隔離）
- Task 和 List 使用 `sortOrder` 進行排序
- Task 有 `completedAt` 時間戳用於跟蹤完成時間
- 使用級聯刪除保持資料完整性

### 認證架構

`src/auth.ts` 使用 NextAuth：
- **Provider**：Credentials（用戶名/密碼）
- **密碼驗證**：bcrypt
- **Session 會話**：JWT，自訂 callback 注入 `user.id`
- **認證頁面**：`/login`

---

## 常見開發命令

### 開發環境

```bash
# 安裝依賴
npm install

# 啟動開發伺服器（localhost:3000）
npm run dev

# 運行 ESLint
npm run lint

# 構建應用
npm run build

# 啟動生產伺服器
npm start
```

### 資料庫

```bash
# 創建或遷移資料庫（執行 Prisma migrations）
npx prisma migrate dev --name <migration_name>

# 重設資料庫（清空所有資料並重新執行遷移）
npx prisma migrate reset

# 啟動 Prisma Studio（Web UI 瀏覽資料庫）
npx prisma studio

# 生成 Prisma Client（修改 schema 後執行）
npx prisma generate
```

### 環境變數

開發環境變數存儲在 `.env` 和 `.env.local` 中。

主要變數：
- `DATABASE_URL`：Prisma 資料庫連接字符串（預設使用 SQLite 本地檔案）

---

## 關鍵檔案和職責

| 檔案/目錄 | 職責 |
|---------|------|
| `prisma/schema.prisma` | Prisma 資料庫模型定義 |
| `src/auth.ts` | NextAuth 配置和認證邏輯 |
| `src/lib/prisma.ts` | Prisma Client 單例實例 |
| `src/app/` | Next.js App Router 頁面和布局 |
| `src/actions/` | Server Actions（目前為空，預留） |
| `openspec/` | OpenSpec 規範管理（specs、changes） |
| `docs/` | 專案文檔和筆記 |

---

## 開發注意事項

### TypeScript 配置

- **嚴格模式**：啟用 `strict: true`，包括 `noUnusedLocals` 和 `noUnusedParameters`
- **Path alias**：`@/*` 指向根目錄
- **JSX 模式**：`preserve`（由 Next.js 處理轉譯）

### Code Style

- 使用 ESLint（Next.js 預設配置）
- 使用 Tailwind CSS 進行樣式
- 語言設定為 `zh-TW`（繁體中文）

### 認證和授權

- 所有 `/app/*` 路由應受 NextAuth 保護（目前實現有限，需擴展）
- Session callback 已配置為將 `user.id` 注入 session
- 密碼應使用 bcrypt 雜湊存儲

### Prisma 最佳實踐

- 使用 `src/lib/prisma.ts` 中的 Prisma Client 單例
- 修改 schema 後執行 `npx prisma generate`
- 使用 Prisma Studio (`npx prisma studio`) 進行資料庫檢查
- 新增的資料庫遷移應包含在 git history 中

---

## 專案規範管理

專案使用 [OpenSpec](https://openspec.dev/) 進行規範版本控制：
- `openspec/specs/`：主規範檔案
- `openspec/changes/`：變更提案（delta specs）

使用相關技能（`/openspec-*`）來管理規範。

---

## 文檔

- `docs/ui/`：UI 設計和規範
- `docs/notes/`：開發筆記和想法
- `README.md`：簡要專案描述
