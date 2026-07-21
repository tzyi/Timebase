# Timebase

管理時間的軟體，提供清單、月曆、看板等功能，幫助您高效組織和追蹤任務。

## 功能

- **任務清單**：創建和管理任務清單
- **月曆檢視**：按月份檢視任務
- **看板檢視**：使用看板方式組織任務
- **優先級和截止日期**：設置任務優先級和截止日期
- **標籤系統**：使用標籤分類和篩選任務
- **多租戶隔離**：每位使用者擁有獨立的工作空間

## 技術棧

- **框架**：Next.js 15 (App Router)
- **UI 框架**：React 19
- **語言**：TypeScript
- **資料庫**：SQLite + Prisma ORM
- **認證**：NextAuth.js (Credentials Provider)
- **樣式**：Tailwind CSS + PostCSS

## 快速開始

### 前置要求

- Node.js 18+
- npm

### 安裝

```bash
# 克隆倉庫
git clone <repository-url>
cd Timebase

# 安裝依賴
npm install

# 設置資料庫
npx prisma migrate dev

# 啟動開發伺服器
npm run dev
```

應用將在 `http://localhost:3000` 啟動。

## 開發命令

```bash
# 啟動開發伺服器
npm run dev

# 構建應用
npm run build

# 啟動生產伺服器
npm start

# 執行 ESLint
npm run lint

# Prisma 資料庫管理
npx prisma migrate dev         # 執行遷移
npx prisma migrate reset       # 重設資料庫
npx prisma studio             # 打開 Prisma Studio
npx prisma generate           # 重新生成 Prisma Client
```

## 項目結構

```
src/
├── app/                        # Next.js App Router 頁面
│   ├── (auth)/                # 認證相關路由
│   ├── (app)/                 # 應用主體路由
│   └── ...
├── auth.ts                     # NextAuth 配置
├── lib/
│   └── prisma.ts              # Prisma Client 單例
└── ...
prisma/
├── schema.prisma              # 資料庫模型定義
└── migrations/                # 資料庫遷移
```

## 認證

應用使用 NextAuth.js 進行認證，支援帳戶/密碼登入方式。密碼使用 bcrypt 進行雜湊儲存。

## 環境變數

在 `.env.local` 文件中配置以下變數：

```
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-secret-key>
```

## 授權

MIT License

