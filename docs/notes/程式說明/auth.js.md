# auth.js

`src/auth.ts` 是專案的 NextAuth 認證設定檔，主要負責：

1. 使用 Email 和密碼登入
2. 從 Prisma 資料庫查詢使用者
3. 使用 bcrypt 驗證密碼
4. 建立 JWT Session
5. 將使用者 id 放入 Session
6. 將登入頁面指定為 `/login`

---

### 1. 匯入套件

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcrypt";

```

* **NextAuth**：建立認證系統。
* **Credentials**：使用自訂帳號密碼登入。
* **compare**：比較使用者輸入的明文密碼與資料庫中的 bcrypt 雜湊密碼。

```typescript
const prisma = require("@prisma/client").PrismaClient;

```

這裡取得 Prisma Client 建構函式，後續會使用 `new prisma()` 建立資料庫連線。

### 2. 擴充 Session 型別

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      email: string;
      name?: string;
    };
  }
}

```

NextAuth 預設的 `session.user` 不一定包含自訂的 id。這段 TypeScript 宣告擴充讓程式知道：

* `session.user.id`
* `session.user.email`
* `session.user.name`

其中 id 被定義為 `number`。

### 3. 建立 NextAuth 設定

```typescript
export const { auth, handlers, signIn, signOut } = NextAuth({ ... });

```

NextAuth 會回傳幾個功能：

* **auth**：取得目前登入狀態
* **handlers**：處理登入、登出等 API 請求
* **signIn**：執行登入
* **signOut**：執行登出

其他檔案可以匯入這些函式使用。

### 4. Credentials 登入欄位

```typescript
credentials: {
  email: { label: "Email", type: "text" },
  password: { label: "Password", type: "password" },
},

```

定義登入表單需要的欄位：

* `email`
* `password`

這些資料會傳入 `authorize()`。

### 5. authorize()：驗證登入

```typescript
if (!credentials?.email || !credentials?.password) {
  return null;
}

```

如果 Email 或密碼缺少，直接登入失敗。

接著查詢使用者：

```typescript
const user = await prismaInstance.user.findUnique({
  where: { email: credentials.email as string },
});

```

根據 Email 從 User 資料表尋找使用者。

如果找不到：

```typescript
if (!user) {
  return null;
}

```

登入失敗。

### 6. 驗證密碼

```typescript
const passwordMatch = await compare(
  credentials.password as string,
  user.passwordHash
);

```

`compare()` 會將使用者輸入的密碼與資料庫中的 `passwordHash` 進行比對。

密碼不正確時：

```typescript
if (!passwordMatch) {
  return null;
}

```

登入失敗。

密碼正確後，回傳使用者資料：

```typescript
return {
  id: String(user.id),
  email: user.email,
  name: user.name,
};

```

這裡將資料庫中的數字型 `user.id` 轉成字串，因為 NextAuth 的 User 型別通常使用字串 ID。

### 7. 登入頁面設定

```typescript
pages: {
  signIn: "/login",
},

```

當使用者需要登入時，NextAuth 會導向 `/login`。

### 8. JWT Callback

```typescript
async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
  }
  return token;
},

```

使用者成功登入時，將 `user.id` 寫入 JWT：
`token.id = user.id;`

這樣後續建立 Session 時才能取得使用者 ID。

### 9. Session Callback

```typescript
async session({ session, token }) {
  if (session.user) {
    session.user.id = Number(token.id);
  }
  return session;
},

```

將 JWT 裡的 ID 放回 Session，並轉成數字：
`session.user.id = Number(token.id);`

之後在 Server Component 或 Server Action 中可以取得：

```typescript
const session = await auth();
const userId = session?.user.id;

```

用來查詢該使用者自己的任務、清單等資料。

---

### 整體登入流程

1. 使用者輸入 Email / 密碼
2. `authorize()`
3. 查詢 Prisma User
4. bcrypt 比對密碼
5. 建立 JWT，儲存 `user.id`
6. 建立 Session，提供 `session.user.id`

> **注意**：此檔案中的 `$disconnect()` 只在登入成功時執行；如果使用者不存在或密碼錯誤，可能不會執行斷線。若專案已有 `src/lib/prisma.ts` 的 Prisma 單例時，建議改為使用該單例，而不是每次登入都 `new PrismaClient()`。