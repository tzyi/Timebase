## 1. 資料模型

- [ ] 1.1 在 `prisma/schema.prisma` 新增 `TaskGroup` model（`listId`、`name`、`sortOrder`、`tasks` 關聯、timestamps、`@@index([listId])`）
- [ ] 1.2 `List` model 新增對 `TaskGroup` 的反向關聯
- [ ] 1.3 `Task` model 新增可為 null 的 `groupId` 欄位與 `group` 關聯（`onDelete: SetNull`）
- [ ] 1.4 執行 `npx prisma migrate dev --name add_task_group` 產生 migration，並確認既有資料的 `groupId` 全部為 null
- [ ] 1.5 執行 `npx prisma generate` 更新 Prisma Client 型別

## 2. Server Actions — 分組管理

- [ ] 2.1 新增 `src/actions/taskGroups.ts`，實作 `createTaskGroup(listId, name)`（沿用既有 userId 歸屬檢查模式，`sortOrder` 取目前最大值 + 1）
- [ ] 2.2 實作 `renameTaskGroup(groupId, name)`
- [ ] 2.3 實作 `deleteTaskGroup(groupId)`（交易內先將所屬任務 `groupId` 設為 null，再刪除分組）
- [ ] 2.4 實作 `reorderTaskGroups(listId, orderedGroupIds)`（依陣列順序重寫 `sortOrder`）
- [ ] 2.5 為上述 actions 撰寫測試（比照 `src/actions/tasks.ts` / `calendar.test.ts` 現有測試風格）

## 3. Server Actions — 任務分組指派

- [ ] 3.1 在 `src/actions/tasks.ts` 新增 `moveTaskToGroup(taskId, groupId, targetIndex)`，更新 `groupId` 並重算目標欄位內任務的 `sortOrder`
- [ ] 3.2 確認 `createTask` 於未指定分組時 `groupId` 預設為 null，且既有呼叫端行為不變
- [ ] 3.3 確認清單刪除時既有 cascade 邏輯（任務移入收集箱）與新的 `TaskGroup` cascade 刪除不衝突，補上對應測試
- [ ] 3.4 撰寫 `moveTaskToGroup` 的測試（跨欄移動、同欄重排序、邊界情況如目標欄位為未分組）

## 4. 依賴與基礎設施

- [ ] 4.1 安裝 `@dnd-kit/core`、`@dnd-kit/sortable`、`@dnd-kit/utilities`
- [ ] 4.2 確認 Next.js dynamic import 設定，讓看板元件（含 dnd-kit）僅在切換至看板視圖時載入

## 5. 前端元件 — 看板核心

- [ ] 5.1 新增 `src/components/tasks/BoardView.tsx`：接收該清單的分組與任務，渲染各欄位（含固定「未分組」欄 + 動態 `TaskGroup` 欄）
- [ ] 5.2 新增 `src/components/tasks/BoardColumn.tsx`：欄位表頭（名稱、任務數、加任務按鈕、`...` 選單）+ 卡片直向堆疊，未分組欄不顯示改名/刪除選項
- [ ] 5.3 新增 `src/components/tasks/BoardCard.tsx`：沿用 `TaskRow` 的資料展示邏輯，改為卡片樣式
- [ ] 5.4 新增「+ 新分組」按鈕（固定看板最右側），呼叫 `createTaskGroup` 並樂觀更新欄位列表
- [ ] 5.5 分組「...」選單：改名（inline 輸入或小型表單）、刪除（刪除前彈出確認對話框，告知將移動的任務數量）

## 6. 前端元件 — 拖曳

- [ ] 6.1 以 `@dnd-kit` 的 `DndContext` 包裹 `BoardView`，欄位用 `useDroppable`，卡片用 `useSortable`
- [ ] 6.2 實作 `onDragEnd`：判斷卡片是否變更所屬欄位／同欄位內順序變更，呼叫 `moveTaskToGroup` 並更新本地狀態
- [ ] 6.3 分組欄位本身的拖曳排序（呼叫 `reorderTaskGroups`）
- [ ] 6.4 拖曳時的視覺回饋（拖曳中卡片樣式、欄位 drop 目標高亮）

## 7. 視圖切換

- [ ] 7.1 在 `TaskListView` 上方（或 `TasksApp` 標題列）新增清單／看板視圖切換按鈕，僅在 `selectedView.kind === 'list'` 時顯示
- [ ] 7.2 視圖偏好存讀 localStorage（key `timebase:listView:<listId>`），切換清單時載入對應偏好，預設為清單視圖
- [ ] 7.3 `TasksApp` 依切換狀態渲染 `TaskListView` 或 `BoardView`，並確保 `refreshTasks` 邏輯同時支援兩種視圖的資料重新整理

## 8. 資料串接

- [ ] 8.1 擴充 `getTasksForView` 或新增 `getBoardForList(listId)`：一次回傳該清單的分組列表（含未分組虛擬欄）與各分組底下的任務
- [ ] 8.2 確認任務的 `tags`、`subtasks`、`list` 關聯在看板卡片資料中仍完整回傳，供 `TaskDetailPanel` 沿用
- [ ] 8.3 點選看板卡片開啟既有 `TaskDetailPanel`，更新後刷新看板資料

## 9. 驗證

- [ ] 9.1 手動測試：新增/改名/刪除分組、刪除分組後任務移回未分組
- [ ] 9.2 手動測試：拖曳跨欄移動任務、同欄拖曳排序，重新整理頁面後順序與分組正確保存
- [ ] 9.3 手動測試：切換清單/看板視圖後再切換清單，確認視圖偏好正確記憶
- [ ] 9.4 手動測試：智慧清單（今天、最近 7 天、標籤、收集箱、已完成）不顯示看板切換選項
- [ ] 9.5 執行 `npm run lint` 與既有測試套件，確保無回歸
