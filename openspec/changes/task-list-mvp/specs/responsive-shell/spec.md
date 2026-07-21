## ADDED Requirements

### Requirement: Desktop Four-Column Layout
在桌機寬度（`md` breakpoint 以上）下，系統 SHALL 以四欄版面呈現：icon rail、清單側欄、主內容區、任務詳情面板。

#### Scenario: Desktop layout renders four columns
- **WHEN** 使用者在桌機寬度瀏覽器開啟任務清單頁面
- **THEN** 畫面由左至右依序顯示 icon rail、清單側欄、主內容區；點選任務時右側顯示詳情面板

#### Scenario: Sidebar collapsible on desktop
- **WHEN** 使用者在桌機版收合清單側欄
- **THEN** 主內容區 SHALL 相應擴大寬度，icon rail 仍固定顯示

### Requirement: Mobile Single-Column Layout with Bottom Navigation
在手機寬度（`md` breakpoint 以下）下，系統 SHALL 以單欄主內容呈現，並提供底部導航列取代 icon rail。

#### Scenario: Mobile layout renders single column with bottom nav
- **WHEN** 使用者在手機寬度瀏覽器開啟任務清單頁面
- **THEN** 畫面僅顯示主內容區（任務列表），底部固定顯示導航列

#### Scenario: List sidebar becomes a drawer on mobile
- **WHEN** 使用者在手機版觸發開啟清單側欄
- **THEN** 清單側欄以左側抽屜（drawer）形式滑出，覆蓋於主內容之上，關閉後恢復原本畫面

#### Scenario: Task detail becomes full-screen on mobile
- **WHEN** 使用者在手機版點選一個任務
- **THEN** 系統以全螢幕頁面顯示任務詳情（取代四欄版面中的側邊詳情面板），並提供返回主內容區的動作

### Requirement: Single Codebase Across Breakpoints
系統 SHALL 使用同一組元件與路由，透過 CSS breakpoint 切換版面骨架，不依裝置類型（User-Agent）分流至不同路由或程式碼路徑。

#### Scenario: No device-based routing
- **WHEN** 相同網址在桌機瀏覽器與手機瀏覽器分別開啟
- **THEN** 系統回傳相同的頁面與元件，僅版面呈現依畫面寬度不同而改變
