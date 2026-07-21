import { timeToMinutes } from './calendarHelpers';

export interface TaskLayoutInfo {
  taskId: number;
  column: number;
  columnCount: number;
  top: number;
  height: number;
  left: number;
}

interface TimedTask {
  id: number;
  dueTime?: string | null;
  endTime?: string | null;
  [key: string]: any;
}

interface LayoutInterval {
  start: number;
  end: number;
  taskIds: number[];
}

export function calculateTaskLayout(
  tasks: TimedTask[],
  _dayStart: number = 0,
  _dayEnd: number = 1440
): TaskLayoutInfo[] {
  const timedTasks = tasks.filter((t) => t.dueTime && t.endTime);

  if (timedTasks.length === 0) return [];

  const sortedTasks = [...timedTasks].sort((a, b) => {
    const aStart = timeToMinutes(a.dueTime || '');
    const bStart = timeToMinutes(b.dueTime || '');
    return aStart - bStart;
  });

  const intervals = buildIntervals(sortedTasks);
  const columnAssignments = assignColumns(intervals);

  const layouts: TaskLayoutInfo[] = [];
  for (const task of sortedTasks) {
    const startMinutes = timeToMinutes(task.dueTime || '');
    const endMinutes = timeToMinutes(task.endTime || '');

    const column = columnAssignments.get(task.id) || 0;
    const columnsAtTask = getMaxColumnsInRange(intervals, startMinutes, endMinutes);

    const top = (startMinutes / 60) * 60;
    const duration = Math.max(endMinutes - startMinutes, 30);
    const height = (duration / 60) * 60;
    const left = (column / columnsAtTask) * 100;

    layouts.push({
      taskId: task.id,
      column,
      columnCount: columnsAtTask,
      top,
      height,
      left,
    });
  }

  return layouts;
}

function buildIntervals(tasks: TimedTask[]): LayoutInterval[] {
  const events: { time: number; type: 'start' | 'end'; taskId: number }[] = [];

  for (const task of tasks) {
    const start = timeToMinutes(task.dueTime || '');
    const end = timeToMinutes(task.endTime || '');
    events.push({ time: start, type: 'start', taskId: task.id });
    events.push({ time: end, type: 'end', taskId: task.id });
  }

  events.sort((a, b) => a.time - b.time || (a.type === 'start' ? -1 : 1));

  const intervals: LayoutInterval[] = [];
  const activeTaskIds = new Set<number>();
  let prevTime = 0;

  for (const event of events) {
    if (event.time > prevTime && activeTaskIds.size > 0) {
      intervals.push({
        start: prevTime,
        end: event.time,
        taskIds: Array.from(activeTaskIds),
      });
    }

    if (event.type === 'start') {
      activeTaskIds.add(event.taskId);
    } else {
      activeTaskIds.delete(event.taskId);
    }

    prevTime = event.time;
  }

  return intervals;
}

function assignColumns(intervals: LayoutInterval[]): Map<number, number> {
  const columnMap = new Map<number, number>();

  for (const interval of intervals) {
    const usedColumns = new Set<number>();
    for (const taskId of interval.taskIds) {
      const col = columnMap.get(taskId);
      if (col !== undefined) usedColumns.add(col);
    }

    for (const taskId of interval.taskIds) {
      if (!columnMap.has(taskId)) {
        let col = 0;
        while (usedColumns.has(col)) col++;
        columnMap.set(taskId, col);
        usedColumns.add(col);
      }
    }
  }

  return columnMap;
}

function getMaxColumnsInRange(
  intervals: LayoutInterval[],
  start: number,
  end: number
): number {
  let maxColumns = 1;

  for (const interval of intervals) {
    if (interval.start < end && interval.end > start) {
      maxColumns = Math.max(maxColumns, interval.taskIds.length);
    }
  }

  return maxColumns;
}
