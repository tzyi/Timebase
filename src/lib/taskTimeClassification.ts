export enum TaskTimeType {
  NO_TIME = 'no_time',
  ALL_DAY = 'all_day',
  TIMED = 'timed',
}

interface Task {
  id: number;
  title: string;
  dueDate?: Date | null;
  dueTime?: string | null;
  endTime?: string | null;
  allDay: boolean;
  priority: string;
  completedAt?: Date | null;
  createdAt?: Date | null;
  [key: string]: any;
}

export function classifyTaskTime(task: Task): TaskTimeType {
  if (task.allDay) return TaskTimeType.ALL_DAY;
  if (!task.dueTime && !task.endTime) return TaskTimeType.NO_TIME;
  return TaskTimeType.TIMED;
}

// 固定排序：全天 → 無時間（依優先級、建立時間）→ 定時（依開始時間），跨月/週/日視圖與側邊面板共用同一順序。
export function sortDayTasks(tasks: Task[]): Task[] {
  const allDayTasks = tasks.filter((t) => classifyTaskTime(t) === TaskTimeType.ALL_DAY);
  const noTimeTasks = tasks.filter((t) => classifyTaskTime(t) === TaskTimeType.NO_TIME);
  const timedTasks = tasks.filter((t) => classifyTaskTime(t) === TaskTimeType.TIMED);

  noTimeTasks.sort((a, b) => {
    const priorityOrder: { [key: string]: number } = { high: 0, medium: 1, low: 2, none: 3 };
    const aPriority = priorityOrder[a.priority] ?? 3;
    const bPriority = priorityOrder[b.priority] ?? 3;

    if (aPriority !== bPriority) return aPriority - bPriority;

    const aCreated = a.createdAt?.getTime() ?? 0;
    const bCreated = b.createdAt?.getTime() ?? 0;
    return aCreated - bCreated;
  });

  timedTasks.sort((a, b) => {
    const aTime = (a.dueTime ?? '').localeCompare(b.dueTime ?? '');
    return aTime;
  });

  return [...allDayTasks, ...noTimeTasks, ...timedTasks];
}

export function isTaskCompleted(task: Task): boolean {
  return !!task.completedAt;
}
