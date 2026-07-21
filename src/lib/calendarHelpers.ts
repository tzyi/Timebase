export function getMonthDays(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const weeks: Date[][] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= lastDay || currentDate.getDay() !== 0) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function getWeekDays(date: Date): Date[] {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(new Date(monday));
    monday.setDate(monday.getDate() + 1);
  }

  return days;
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
}

export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function dateToString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getToday(): Date {
  return new Date();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getDayName(date: Date): string {
  return date.toLocaleDateString('zh-TW', { weekday: 'short' });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const COLOR_MAP: { [key: string]: string } = {
  red: 'bg-red-100',
  orange: 'bg-orange-100',
  yellow: 'bg-yellow-100',
  green: 'bg-green-100',
  blue: 'bg-blue-100',
  indigo: 'bg-indigo-100',
  purple: 'bg-purple-100',
  pink: 'bg-pink-100',
  gray: 'bg-gray-100',
};

const FADED_COLOR_MAP: { [key: string]: string } = {
  red: 'bg-red-100/50',
  orange: 'bg-orange-100/50',
  yellow: 'bg-yellow-100/50',
  green: 'bg-green-100/50',
  blue: 'bg-blue-100/50',
  indigo: 'bg-indigo-100/50',
  purple: 'bg-purple-100/50',
  pink: 'bg-pink-100/50',
  gray: 'bg-gray-100/50',
};

const TEXT_COLOR_MAP: { [key: string]: string } = {
  red: 'text-red-700',
  orange: 'text-orange-700',
  yellow: 'text-yellow-700',
  green: 'text-green-700',
  blue: 'text-blue-700',
  indigo: 'text-indigo-700',
  purple: 'text-purple-700',
  pink: 'text-pink-700',
  gray: 'text-gray-700',
};

interface TaskForColor {
  completedAt?: Date | null;
  dueDate?: Date | null;
  list?: { color: string } | null;
  status?: string;
}

function isBeforeToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

export function getTaskBackgroundColor(task: TaskForColor): string {
  if (task.completedAt || task.status === 'done') {
    return 'bg-gray-200';
  }

  const colorKey = task.list && task.list.color ? task.list.color : 'blue';
  const isPastDue = !!task.dueDate && isBeforeToday(new Date(task.dueDate));

  if (isPastDue) {
    return FADED_COLOR_MAP[colorKey] || 'bg-blue-100/50';
  }

  return COLOR_MAP[colorKey] || 'bg-blue-100';
}

export function getTaskTextColor(task: TaskForColor): string {
  if (task.completedAt || task.status === 'done') {
    return 'text-gray-500';
  }

  if (task.list && task.list.color) {
    return TEXT_COLOR_MAP[task.list.color] || 'text-blue-700';
  }

  return 'text-blue-700';
}
