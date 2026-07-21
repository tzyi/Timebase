import { getMonthDays, getWeekDays, getWeekNumber, formatTime, timeToMinutes, isSameDay } from './calendarHelpers';
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

if (typeof window === 'undefined') {
  testCalendarHelpers();
  testTaskTimeClassification();
  testTaskLayout();
}
