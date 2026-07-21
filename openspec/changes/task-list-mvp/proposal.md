## Why

Timebase 目前只有一份 README 與 UI 參考截圖，尚無任何可用功能。任務清單是整個產品（清單／月曆／看板／習慣）共用的核心資料實體，其他視圖之後都會投影自同一份 Task 資料。因此第一步先把「使用者帳號」與「任務清單」這個最小可用產品做出來，讓使用者能登入、建立清單、新增/管理任務，並在手機上以 PWA 形式安裝使用。

## What Changes

- 新增使用者註冊、登入、登出（Auth.js Credentials Provider + bcrypt 密碼雜湊）
- 新增清單（List）管理：建立/編輯/刪除、自訂顏色、顯示未完成任務數量、以資料夾（ListFolder）分組
- 新增任務（Task）管理：建立/編輯/刪除/勾選完成，欄位含標題、備註、到期日、優先級旗標、所屬清單、標籤
- 新增標籤（Tag）管理：建立/編輯/刪除、任務可掛多個標籤、依標籤篩選任務
- 新增智慧清單檢視：今天、最近 7 天、收集箱（未歸類任務）、已完成、已過期（含手動「順延」動作，將到期日調整為今天）
- 新增響應式版面（RWD）：桌機採四欄（icon rail + 清單側欄 + 主內容 + 詳情面板），手機採單欄主內容 + 底部導航列，側欄改為抽屜、詳情面板改為全螢幕頁
- 新增 PWA App shell：manifest.json、Service Worker 快取靜態資源，使用者可安裝到手機桌面；任務資料操作仍需連網（不做離線寫入與同步）
- Task 資料表預留 `dueDate`、`status` 欄位設計，為未來月曆／看板視圖鋪路，但本次不實作月曆／看板／習慣視圖與任務重複規則（recurrence）

## Capabilities

### New Capabilities
- `user-auth`: 使用者註冊、登入、登出，以及 Server Actions/頁面的登入態保護
- `task-management`: List／ListFolder／Task／Tag 的 CRUD，以及智慧清單（今天/最近7天/收集箱/已完成/已過期+順延）查詢邏輯
- `responsive-shell`: 桌機四欄與手機單欄+底部導航的響應式版面規則
- `pwa-shell`: PWA 可安裝性與靜態資源離線快取

### Modified Capabilities
（無，本專案目前無既有 specs）

## Impact

- 新增技術依賴：Next.js（App Router）、TypeScript、Prisma、SQLite、Auth.js、next-pwa 或 Serwist（Service Worker 產生工具）
- 新增資料庫 schema：User、List、ListFolder、Task、Tag、TaskTag
- 新增專案目錄結構：`app/(auth)`、`app/(app)/tasks`、`actions/`、`prisma/schema.prisma`、`public/manifest.json`
- 不影響現有程式碼（專案目前無既有實作）
