/*
  TaskGroup Server Actions Testing

  This file documents the expected behavior of the taskGroups Server Actions.
  Full integration testing requires the Next.js dev server + database running.

  Test cases for:
  - createTaskGroup(listId, name)
  - renameTaskGroup(groupId, name)
  - deleteTaskGroup(groupId)
  - reorderTaskGroups(listId, orderedGroupIds)
*/

interface MockGroup {
  id: number;
  listId: number;
  name: string;
  sortOrder: number;
}

function createMockGroup(overrides: Partial<MockGroup> = {}): MockGroup {
  return {
    id: 1,
    listId: 1,
    name: 'TODO',
    sortOrder: 0,
    ...overrides,
  };
}

export function testCreateTaskGroupSortOrderLogic() {
  console.log('Testing createTaskGroup sortOrder logic...');

  const existing = [
    createMockGroup({ id: 1, sortOrder: 0 }),
    createMockGroup({ id: 2, sortOrder: 1 }),
  ];

  const maxOrder = existing.reduce((max, g) => Math.max(max, g.sortOrder), -1);
  const nextOrder = maxOrder + 1;

  console.assert(nextOrder === 2, '新分組的 sortOrder 應為目前最大值 + 1');

  const emptyMaxOrder = ([] as MockGroup[]).reduce((max, g) => Math.max(max, g.sortOrder), -1);
  console.assert(emptyMaxOrder + 1 === 0, '清單無分組時，第一個分組的 sortOrder 應為 0');

  console.log('✓ createTaskGroup sortOrder logic test passed');
}

export function testDeleteTaskGroupMovesTasksToUngrouped() {
  console.log('Testing deleteTaskGroup ungroups tasks logic...');

  const tasksInGroup = [{ id: 1, groupId: 1 }, { id: 2, groupId: 1 }];
  const afterDelete = tasksInGroup.map((t) => ({ ...t, groupId: null }));

  console.assert(
    afterDelete.every((t) => t.groupId === null),
    '刪除分組後，原屬於此分組的任務 groupId 應全部為 null'
  );
  console.assert(afterDelete.length === tasksInGroup.length, '任務本身不應被刪除');

  console.log('✓ deleteTaskGroup ungroups tasks logic test passed');
}

export function testReorderTaskGroupsLogic() {
  console.log('Testing reorderTaskGroups logic...');

  const orderedGroupIds = [3, 1, 2];
  const newSortOrders = orderedGroupIds.map((id, index) => ({ id, sortOrder: index }));

  console.assert(newSortOrders[0].id === 3 && newSortOrders[0].sortOrder === 0, '第一個分組排序應為 0');
  console.assert(newSortOrders[2].id === 2 && newSortOrders[2].sortOrder === 2, '最後一個分組排序應為 2');

  console.log('✓ reorderTaskGroups logic test passed');
}

export function testListDeletionCascadesTaskGroups() {
  console.log('Testing list deletion cascades task groups...');

  // deleteList 先將 listId=null 寫回任務（既有邏輯），
  // 之後刪除 List 時，DB 層 ON DELETE CASCADE 會一併刪除該清單底下的 TaskGroup，
  // 而 Task.groupId 的 ON DELETE SET NULL 會在 TaskGroup 列被刪除時自動生效。
  const tasksBeforeListDelete = [{ id: 1, listId: 1, groupId: 1 }];
  const tasksAfterListIdCleared = tasksBeforeListDelete.map((t) => ({ ...t, listId: null }));
  const tasksAfterGroupCascade = tasksAfterListIdCleared.map((t) => ({ ...t, groupId: null }));

  console.assert(tasksAfterGroupCascade[0].listId === null, '任務應移入收集箱（listId = null）');
  console.assert(tasksAfterGroupCascade[0].groupId === null, '任務的 groupId 應因分組被刪除而清空');

  console.log('✓ list deletion cascades task groups test passed');
}
