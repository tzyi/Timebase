## ADDED Requirements

### Requirement: Installable PWA
系統 SHALL 提供有效的 Web App Manifest，讓行動裝置瀏覽器可將 Timebase 安裝為主畫面 App，具備 App 名稱、圖示與啟動畫面設定。

#### Scenario: Manifest available and valid
- **WHEN** 瀏覽器請求 `/manifest.json`
- **THEN** 系統回傳包含 App 名稱、圖示（多尺寸）、`start_url`、`display: standalone` 等必要欄位的合法 manifest

#### Scenario: Install prompt available on supported browsers
- **WHEN** 使用者以支援 PWA 安裝的行動瀏覽器（如 Chrome for Android）多次造訪本站
- **THEN** 瀏覽器 SHALL 能夠顯示「加入主畫面／安裝 App」的選項

### Requirement: Static Asset Offline Caching
系統 SHALL 透過 Service Worker 快取靜態資源（JS、CSS、字型、圖示、App shell HTML），使已安裝或已造訪過的使用者在離線狀態下仍可開啟 App shell。

#### Scenario: App shell loads offline after first visit
- **WHEN** 使用者曾在有網路狀態下造訪過本站，之後於離線狀態重新開啟本站
- **THEN** 系統 SHALL 顯示 App shell（版面骨架與導覽），而非瀏覽器離線錯誤頁

### Requirement: Offline Data Operations Are Disabled, Not Silently Queued
系統 SHALL 明確告知使用者離線狀態下無法執行任務資料的新增/編輯/刪除操作，不得讓操作看似成功但實際未儲存。

#### Scenario: Data mutation attempted while offline
- **WHEN** 使用者在離線狀態下嘗試新增或編輯任務
- **THEN** 系統顯示明確錯誤或提示（例如「目前離線，請連上網路後再試」），不將該操作視為已成功，也不將其寫入任何本地佇列等待日後同步
