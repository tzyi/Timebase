## ADDED Requirements

### Requirement: User Registration
使用者 SHALL 能夠以 Email 與密碼註冊新帳號。系統 SHALL 對密碼進行雜湊（bcrypt）後儲存，不得儲存明文密碼。Email SHALL 在系統中唯一。

#### Scenario: Successful registration
- **WHEN** 使用者提交未被註冊過的 Email 與符合密碼規則的密碼
- **THEN** 系統建立新使用者帳號，密碼以雜湊形式儲存，並將使用者導向登入或直接建立登入態

#### Scenario: Duplicate email rejected
- **WHEN** 使用者提交的 Email 已存在於系統中
- **THEN** 系統拒絕註冊並顯示「Email 已被使用」的錯誤訊息，不建立新帳號

### Requirement: User Login
使用者 SHALL 能夠以已註冊的 Email 與密碼登入，建立登入態（session）。

#### Scenario: Successful login
- **WHEN** 使用者輸入正確的 Email 與密碼
- **THEN** 系統建立 session 並將使用者導向任務清單主畫面

#### Scenario: Invalid credentials rejected
- **WHEN** 使用者輸入不存在的 Email 或錯誤的密碼
- **THEN** 系統拒絕登入並顯示通用錯誤訊息（不透露是 Email 不存在還是密碼錯誤）

### Requirement: User Logout
已登入使用者 SHALL 能夠登出，結束其 session。

#### Scenario: Successful logout
- **WHEN** 已登入使用者觸發登出動作
- **THEN** 系統清除該使用者的 session，並將其導向登入頁

### Requirement: Protected Routes
系統 SHALL 保護所有任務清單相關頁面與 Server Actions，未登入使用者不得存取或操作任何使用者資料。

#### Scenario: Unauthenticated access redirected
- **WHEN** 未登入的訪客嘗試直接開啟任務清單頁面網址
- **THEN** 系統將其導向登入頁，不回傳任何任務資料

#### Scenario: Unauthenticated Server Action rejected
- **WHEN** 未登入的請求呼叫任務／清單／標籤相關 Server Action
- **THEN** 系統拒絕該操作並回傳未授權錯誤，不執行任何資料變更
