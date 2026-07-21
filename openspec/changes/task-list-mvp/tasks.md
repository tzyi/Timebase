## 1. 專案骨架

- [x] 1.1 建立 Next.js 專案（App Router + TypeScript）
- [x] 1.2 安裝並設定 Prisma，指向 SQLite（`dev.db`）
- [x] 1.3 安裝並設定 Auth.js（Credentials Provider）與 bcrypt
- [x] 1.4 設定 Tailwind（或等效方案）作為版面/breakpoint 實作基礎
- [x] 1.5 建立基礎專案目錄：`app/(auth)`、`app/(app)/tasks`、`actions/`、`prisma/`

## 2. 資料模型與 Migration

- [x] 2.1 撰寫 `prisma/schema.prisma`：User、ListFolder、List、Task、Tag、TaskTag
- [x] 2.2 執行初始 migration，確認 SQLite 檔案與資料表建立成功
- [x] 2.3 建立 Prisma client 單例（避免開發模式下重複連線）

## 3. 使用者驗證 (user-auth)

- [x] 3.1 實作註冊 Server Action：Email 唯一性檢查、bcrypt 雜湊密碼、建立 User
- [x] 3.2 實作註冊頁面 UI（`app/(auth)/register`）
- [x] 3.3 設定 Auth.js Credentials Provider，串接登入驗證邏輯
- [x] 3.4 實作登入頁面 UI（`app/(auth)/login`）
- [x] 3.5 實作登出動作（清除 session）
- [x] 3.6 建立中介層/守衛：未登入使用者存取 `app/(app)/*` 導向登入頁
- [x] 3.7 為所有任務/清單/標籤相關 Server Action 加上登入態檢查，未登入回傳未授權錯誤

## 4. 清單與資料夾管理 (task-management 之一)

- [x] 4.1 實作 List 的 Server Actions：建立/編輯/刪除/查詢（含未完成任務數量）
- [x] 4.2 實作刪除清單時任務移入收集箱（`listId` 設為 null）的邏輯
- [x] 4.3 實作 ListFolder 的 Server Actions：建立/編輯/刪除/查詢
- [x] 4.4 實作清單側欄 UI：顯示清單（含顏色圓點、未完成數量）、資料夾摺疊/展開

## 5. 任務管理 (task-management 之二)

- [x] 5.1 實作 Task 的 Server Actions：建立/編輯/刪除
- [x] 5.2 實作任務完成/取消完成 Server Action（含 `completedAt` 記錄）
- [x] 5.3 實作任務列表 UI（標題、到期日、優先級旗標顯示、勾選框）
- [x] 5.4 實作任務詳情面板 UI（桌機側邊面板）：編輯標題/備註/到期日/優先級/所屬清單/標籤

## 6. 標籤管理 (task-management 之三)

- [x] 6.1 實作 Tag 的 Server Actions：建立/編輯/刪除
- [x] 6.2 實作任務指派/移除標籤的 Server Action（TaskTag 關聯）
- [x] 6.3 實作側欄標籤篩選 UI 與依標籤篩選任務列表的查詢邏輯

## 7. 智慧清單與順延 (task-management 之四)

- [x] 7.1 實作「今天」查詢邏輯與頁面
- [x] 7.2 實作「最近 7 天」查詢邏輯與頁面
- [x] 7.3 實作「收集箱」查詢邏輯與頁面
- [x] 7.4 實作「已完成」查詢邏輯與頁面
- [x] 7.5 實作「已過期」查詢邏輯與分組顯示
- [x] 7.6 實作「順延」Server Action：將任務 `dueDate` 更新為今天

## 8. 響應式版面 (responsive-shell)

- [x] 8.1 實作桌機四欄版面骨架（icon rail + 側欄 + 主內容 + 詳情面板），側欄可收合
- [x] 8.2 實作手機單欄版面骨架 + 底部導航列
- [x] 8.3 實作手機版清單側欄抽屜（drawer）互動
- [x] 8.4 實作手機版任務詳情全螢幕頁面（取代側邊詳情面板）
- [ ] 8.5 跨常見斷點（手機/平板/桌機寬度）驗證版面切換正確、無版面錯亂 —— 已透過 build 與 HTTP 檢查、程式碼審查確認 Tailwind breakpoint 邏輯正確，尚未在真實瀏覽器/裝置實測，待人工驗收後勾選

## 9. PWA (pwa-shell)

- [x] 9.1 安裝並設定 next-pwa 或 Serwist（採用 Serwist）
- [x] 9.2 建立 `public/manifest.json`（App 名稱、圖示多尺寸、`start_url`、`display: standalone`）
- [x] 9.3 設定 Service Worker 快取範圍：靜態資源與 App shell HTML（採用 `@serwist/next` 的 `defaultCache`）
- [x] 9.4 實作離線提示：資料操作於離線狀態下顯示明確錯誤訊息，不假裝成功
- [ ] 9.5 於行動瀏覽器驗證安裝流程與離線開啟 App shell 是否成功 —— 已於本機以 production build 確認 manifest/icons/sw.js 皆可正常存取，但無法在此環境進行真實行動瀏覽器安裝與離線測試，待人工驗收

## 10. 驗收與整理

- [ ] 10.1 走過所有 specs 中的 Scenario，逐一手動驗證行為符合預期 —— 需人工於瀏覽器實際操作驗收
- [x] 10.2 確認未登入狀態下所有頁面與 Server Action 皆被正確保護（`(app)/layout.tsx` 的 `auth()` 檢查 + 各 Server Action 的 `requireAuth()` 已涵蓋）
- [ ] 10.3 確認桌機與手機版面皆可完整操作清單/任務/標籤 CRUD —— 需人工於瀏覽器實際操作驗收
- [ ] 10.4 執行 `openspec archive task-list-mvp`（實作完成、驗收通過後）—— 待 10.1/10.3 人工驗收通過後再執行
