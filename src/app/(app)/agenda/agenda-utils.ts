export { pad2, formatDateInput, formatTimeInput, addDaysToDate as addDays } from "@/lib/date-utils";
import { pad2, addDaysToDate } from "@/lib/date-utils";

export function addMinutesToTime(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${pad2(Math.floor(wrapped / 60))}:${pad2(wrapped % 60)}`;
}

export function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function diffMinutes(startTime: string, endTime: string) {
  return Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime));
}

export function combineDateAndTime(date: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  const x = new Date(date);
  x.setHours(h, m, 0, 0);
  return x;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function weekDays(start: Date) {
  return Array.from({ length: 7 }, (_, i) => addDaysToDate(start, i));
}

export const WEEKDAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function formatDayLabel(d: Date) {
  return `${WEEKDAY_LABELS[d.getDay()]} ${d.getDate()}`;
}
