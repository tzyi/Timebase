import { getMonthDays, getWeekDays, getWeekNumber, formatTime, timeToMinutes, isSameDay, addDays } from './calendarHelpers';
import { classifyTaskTime, sortDayTasks, TaskTimeType } from './taskTimeClassification';
import { calculateTaskLayout } from './taskLayout';

export function testCalendarHelpers() {
  console.log('Testing calendarHelpers...');

  const date = new Date(2026, 6, 21);

  const monthDays = getMonthDays(2026, 6);
  console.assert(monthDays.length > 0, 'getMonthDays should return weeks');

  const weekDays = getWeekDays(date);
  console.assert(weekDays.length === 7, 'getWeekDays should return 7 days');

  const weekNum = getWeekNumber(date);
  console.assert(weekNum > 0, 'getWeekNumber should return positive number');

  console.assert(formatTime('08:30') === '08:30', 'formatTime should format correctly');
  console.assert(timeToMinutes('08:30') === 510, 'timeToMinutes should convert correctly');
  console.assert(isSameDay(date, new Date(2026, 6, 21)), 'isSameDay should work');

  console.log('✓ calendarHelpers tests passed');
}

export function testTaskTimeClassification() {
  console.log('Testing taskTimeClassification...');

  const mockTasks = [
    {
      id: 1,
      title: 'All day event',
      allDay: true,
      dueTime: null,
      endTime: null,
      priority: 'high',
      createdAt: new Date(),
    },
    {
      id: 2,
      title: 'No time task',
      allDay: false,
      dueTime: null,
      endTime: null,
      priority: 'medium',
      createdAt: new Date(),
    },
    {
      id: 3,
      title: 'Timed task',
      allDay: false,
      dueTime: '09:00',
      endTime: '10:00',
      priority: 'low',
      createdAt: new Date(),
    },
  ];

  console.assert(
    classifyTaskTime(mockTasks[0]) === TaskTimeType.ALL_DAY,
    'All day task should be classified as ALL_DAY'
  );
  console.assert(
    classifyTaskTime(mockTasks[1]) === TaskTimeType.NO_TIME,
    'No time task should be classified as NO_TIME'
  );
  console.assert(
    classifyTaskTime(mockTasks[2]) === TaskTimeType.TIMED,
    'Timed task should be classified as TIMED'
  );

  const sorted = sortDayTasks(mockTasks);
  console.assert(sorted[0].id === 1, 'All day task should be first');
  console.assert(sorted[1].id === 2, 'No time task should be second');
  console.assert(sorted[2].id === 3, 'Timed task should be last');

  console.log('✓ taskTimeClassification tests passed');
}

export function testTaskLayout() {
  console.log('Testing taskLayout...');

  const mockTasks = [
    {
      id: 1,
      dueTime: '09:00',
      endTime: '10:00',
    },
    {
      id: 2,
      dueTime: '09:30',
      endTime: '10:30',
    },
  ];

  const layout = calculateTaskLayout(mockTasks);
  console.assert(layout.length === 2, 'Should return 2 layout items');
  console.assert(layout[0].taskId === 1, 'First layout should be for task 1');
  console.assert(layout[1].taskId === 2, 'Second layout should be for task 2');
  console.assert(layout[0].column !== layout[1].column, 'Overlapping tasks should have different columns');

  console.log('✓ taskLayout tests passed');
}

export function testWeekOverlap() {
  console.log('Testing week view overlap layout...');

  // 三個任務：09:00-10:00、09:30-10:30（與第一個重疊）、11:00-12:00（不重疊）
  const mockTasks = [
    { id: 1, dueTime: '09:00', endTime: '10:00' },
    { id: 2, dueTime: '09:30', endTime: '10:30' },
    { id: 3, dueTime: '11:00', endTime: '12:00' },
  ];

  const layout = calculateTaskLayout(mockTasks);
  const layoutById = new Map(layout.map((l) => [l.taskId, l]));

  console.assert(layout.length === 3, '應回傳 3 筆布局資訊');
  console.assert(
    layoutById.get(1)!.column !== layoutById.get(2)!.column,
    '重疊任務應分配到不同欄位'
  );
  console.assert(
    layoutById.get(1)!.columnCount === 2 && layoutById.get(2)!.columnCount === 2,
    '重疊區間內的任務欄數應為 2'
  );
  console.assert(
    layoutById.get(3)!.columnCount === 1,
    '不重疊的任務欄數應為 1'
  );

  console.log('✓ week view overlap tests passed');
}

export function testWeekDayNavigation() {
  console.log('Testing week/day navigation date math...');

  const wednesday = new Date(2026, 6, 22); // 2026-07-22 is a Wednesday
  const weekStart = getWeekDays(wednesday)[0];
  console.assert(weekStart.getDay() === 1, '週視圖的起始日應為星期一');

  const prevWeekStart = addDays(weekStart, -7);
  const nextWeekStart = addDays(weekStart, 7);
  console.assert(
    getWeekDays(prevWeekStart)[0].getTime() === prevWeekStart.getTime(),
    '上一週的起始日應仍為星期一'
  );
  console.assert(
    getWeekDays(nextWeekStart)[0].getTime() === nextWeekStart.getTime(),
    '下一週的起始日應仍為星期一'
  );
  console.assert(
    (nextWeekStart.getTime() - prevWeekStart.getTime()) / (1000 * 60 * 60 * 24) === 14,
    '上一週與下一週應相距 14 天'
  );

  const prevDay = addDays(wednesday, -1);
  const nextDay = addDays(wednesday, 1);
  console.assert(isSameDay(prevDay, new Date(2026, 6, 21)), '上一天應為 2026-07-21');
  console.assert(isSameDay(nextDay, new Date(2026, 6, 23)), '下一天應為 2026-07-23');

  console.log('✓ week/day navigation tests passed');
}

if (typeof window === 'undefined') {
  testCalendarHelpers();
  testTaskTimeClassification();
  testTaskLayout();
  testWeekOverlap();
  testWeekDayNavigation();
}
