/*
  moveTaskToGroup Server Action Testing

  This file documents the expected behavior of moveTaskToGroup(taskId, groupId, targetIndex).
  Full integration testing requires the Next.js dev server + database running.
*/

interface MockTask {
  id: number;
  listId: number | null;
  groupId: number | null;
  sortOrder: number;
}

function reorderTasksIntoGroup(
  siblings: MockTask[],
  moving: MockTask,
  groupId: number | null,
  targetIndex: number
): MockTask[] {
  const clampedIndex = Math.max(0, Math.min(targetIndex, siblings.length));
  const reordered = [
    ...siblings.slice(0, clampedIndex),
    { ...moving, groupId },
    ...siblings.slice(clampedIndex),
  ];
  return reordered.map((t, index) => ({ ...t, sortOrder: index }));
}

export function testMoveTaskAcrossColumns() {
  console.log('Testing moveTaskToGroup cross-column move...');

  const moving: MockTask = { id: 1, listId: 10, groupId: 1, sortOrder: 0 };
  const targetColumnSiblings: MockTask[] = [
    { id: 2, listId: 10, groupId: 2, sortOrder: 0 },
    { id: 3, listId: 10, groupId: 2, sortOrder: 1 },
  ];

  const result = reorderTasksIntoGroup(targetColumnSiblings, moving, 2, 1);

  console.assert(result[1].id === 1, '移動的任務應插入到 targetIndex 指定位置');
  console.assert(result.every((t) => t.groupId === 2), '所有任務都應更新為目標分組');
  console.assert(
    result.map((t) => t.sortOrder).every((v, i) => v === i),
    'sortOrder 應依新順序重新編號'
  );

  console.log('✓ moveTaskToGroup cross-column move test passed');
}

export function testMoveTaskWithinSameColumn() {
  console.log('Testing moveTaskToGroup same-column reorder...');

  const moving: MockTask = { id: 2, listId: 10, groupId: 1, sortOrder: 1 };
  const siblings: MockTask[] = [
    { id: 1, listId: 10, groupId: 1, sortOrder: 0 },
    { id: 3, listId: 10, groupId: 1, sortOrder: 2 },
  ];

  const result = reorderTasksIntoGroup(siblings, moving, 1, 0);

  console.assert(result[0].id === 2, '任務應移動到欄位最前面');
  console.assert(result.map((t) => t.id).join(',') === '2,1,3', '同欄拖曳排序應反映新順序');

  console.log('✓ moveTaskToGroup same-column reorder test passed');
}

export function testMoveTaskToUngroupedColumn() {
  console.log('Testing moveTaskToGroup moving to ungrouped column (groupId = null)...');

  const moving: MockTask = { id: 1, listId: 10, groupId: 2, sortOrder: 0 };
  const ungroupedSiblings: MockTask[] = [
    { id: 4, listId: 10, groupId: null, sortOrder: 0 },
  ];

  const result = reorderTasksIntoGroup(ungroupedSiblings, moving, null, 1);

  console.assert(result[1].groupId === null, '移動到未分組欄位時 groupId 應為 null');
  console.assert(result[1].id === 1, '任務應出現在指定的目標索引');

  console.log('✓ moveTaskToGroup ungrouped column test passed');
}
