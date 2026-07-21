## Context

Timebase 目前是空專案（僅 README 與 UI 參考截圖，無程式碼）。本次是第一個實作變更，需要一併決定專案骨架與技術棧。產品願景參考 TickTick，長期會有清單/月曆/看板/習慣四大模組共用同一份 Task 資料，但本次 MVP 只做「任務清單」模組（含帳號系統與 RWD/PWA 外殼）。

技術棧已與使用者確認：
- Next.js（App Router，前後端同一專案，非分離前後端）
- TypeScript + SQLite + Prisma ORM
- Auth.js（Credentials Provider，帳密登入）
- Server Actions 作為資料存取層（不另建 REST API）

## Goals / Non-Goals

**Goals:**
- 使用者可註冊/登入/登出，未登入無法存取任務資料
- 使用者可管理清單（含資料夾分組）、任務、標籤，並使用智慧清單檢視任務
- 桌機與手機皆有可用、對應各自互動習慣的版面（RWD）
- 手機瀏覽器可將本站安裝為 PWA，並在離線時仍能開啟 App shell
- 資料模型為未來月曆/看板/習慣模組預留擴充空間（不需之後重構 schema）

**Non-Goals:**
- 不實作任務重複規則（recurrence，如「每日打卡」）
- 不實作月曆、看板、習慣三個視圖的 UI
- 不實作離線寫入與資料同步（PWA 僅快取靜態資源與 App shell）
- 不實作多裝置即時協作、分享清單、第三方登入（Google/Apple 等）

## Decisions

### 1. Next.js 全端單一專案（非前後端分離）
使用同一個 Next.js 專案同時處理頁面渲染與資料操作，避免前後端分離時的 CORS 與跨網域 Cookie 問題。Server Actions 直接呼叫 Prisma，省去自建 REST API 層。
- 替代方案：Vite SPA + 獨立後端 API（先前討論過，因需要處理跨網域驗證而放棄）。

### 2. Auth.js + Session Cookie（非 JWT）
同源架構下可直接用 Auth.js 預設的 Session（Database 或 JWT session 皆可，選用 JWT session strategy 搭配 Prisma Adapter 以減少 session 資料表查詢）。密碼以 bcrypt 雜湊儲存於 `User.passwordHash`。
- 替代方案：純手刻 JWT + Authorization header — 在同源架構下沒有必要，Auth.js 已覆蓋此情境。

### 3. Task 為核心實體，智慧清單為查詢條件而非資料表
「今天／最近7天／收集箱／已完成／已過期」不建立獨立資料表，而是對 Task 做條件查詢（見下方資料模型）。這確保未來月曆／看板視圖可以直接重用同一份 Task 資料做不同投影，不需資料同步。

資料模型：
```
User
 ├─ id, email(unique), passwordHash, name
 ├─ List[]
 └─ Tag[]

ListFolder
 ├─ id, userId, name, sortOrder
 └─ List[]

List
 ├─ id, userId, folderId(nullable), name, color, sortOrder

Task
 ├─ id, listId(nullable → 為 null 代表收集箱)
 ├─ title, note
 ├─ dueDate(nullable), dueTime(nullable)
 ├─ priority(enum: none/low/medium/high)
 ├─ status(enum: todo/done)   -- 為看板視圖預留，MVP 只用 todo/done 兩態
 ├─ completedAt(nullable)
 ├─ sortOrder
 └─ TaskTag[]

Tag
 ├─ id, userId, name, color

TaskTag (join table)
 ├─ taskId, tagId
```

智慧清單查詢邏輯（皆以「當前登入使用者」為前提）：
- 今天：`dueDate = today AND status = 'todo'`
- 最近 7 天：`dueDate BETWEEN today AND today+6 AND status = 'todo'`
- 收集箱：`listId IS NULL AND status = 'todo'`
- 已完成：`status = 'done'`
- 已過期：`dueDate < today AND status = 'todo'`；「順延」動作 = 將該任務 `dueDate` 更新為今天（純手動，非自動規則，不涉及 recurrence）

### 4. RWD 採單一 codebase + CSS breakpoint，不做裝置分流
沿用同一組元件，用 Tailwind（或等效 CSS-in-JS）breakpoint 切換版面骨架：
- `md` 以上：icon rail + 清單側欄 + 主內容 + 詳情面板（四欄，詳情面板可收合）
- `md` 以下：單欄主內容 + 底部導航列（今天/清單/收集箱/更多），清單側欄改為左滑抽屜，任務詳情改為推頁全螢幕視圖
- 不做 User-Agent 裝置偵測或分離的 mobile 路由，避免雙重維護成本

### 5. PWA 僅做 App Shell 快取，不做離線資料寫入
使用 next-pwa 或 Serwist 產生 Service Worker，快取範圍限定：靜態資源（JS/CSS/字型/圖示）、manifest.json、離線提示頁。任務相關的 Server Actions 呼叫在離線時會直接失敗並提示使用者「需要網路連線」，不做 IndexedDB 佇列或背景同步（列為 Non-Goal，避免與 Server Actions 直連 DB 的架構產生衝突）。

## Risks / Trade-offs

- [SQLite 併發寫入限制] → MVP 使用者量小可接受；若之後多使用者高併發寫入成為瓶頸，需評估遷移 PostgreSQL（Prisma 切換成本低，schema 相容性需另評估）
- [PWA 離線時任務操作會失敗] → UI 需明確顯示「離線中，部分功能無法使用」提示，避免使用者誤以為操作已儲存
- [Server Actions 耦合前後端於同一 Next.js 專案] → 若未來需要獨立手機 App 或第三方整合，需額外補一層 REST/GraphQL API；目前判斷 MVP 階段可接受
- [智慧清單以查詢條件實作，未來若規則變複雜（如自訂篩選器）] → 現行查詢邏輯集中在 Server Actions 層，之後可抽成獨立 query builder，重構風險低

## Migration Plan

全新專案，無既有資料或使用者，不需資料遷移。部署步驟：
1. 建立 Next.js 專案骨架 + Prisma schema + 初始 migration
2. 實作 Auth.js 登入/註冊
3. 實作 List/ListFolder/Task/Tag Server Actions 與對應 UI
4. 疊加 RWD 版面與 PWA 設定
5. 本地驗證後可部署（部署平台未定，非本次範圍）

## Open Questions

- SQLite 檔案的部署/備份策略（單機檔案 vs. 之後遷移雲端 DB）尚未決定，暫不影響本次 MVP 開發
- 是否需要 Email 驗證或僅單純帳密註冊即可用，目前假設不需要 Email 驗證（可在後續變更補上）
