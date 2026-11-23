import { CLINIC } from "../config/clinic.js";

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

// Monta um Date em UTC a partir de "AAAA-MM-DD".
// Usar UTC evita que o fuso do servidor mude o dia (ex.: servidor em outro país).
function toUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// Confere o formato e se a data existe de verdade (rejeita "2026-02-30").
export function isValidDate(date: string): boolean {
  if (!DATE_FORMAT.test(date)) return false;
  return toUtcDate(date).toISOString().slice(0, 10) === date;
}

// 0 = domingo ... 6 = sábado
export function getWeekday(date: string): number {
  return toUtcDate(date).getUTCDay();
}

export function isWeekend(date: string): boolean {
  const weekday = getWeekday(date);
  return weekday === 0 || weekday === 6;
}

// Nome do dia da semana em português, ex.: "terça-feira".
export function getWeekdayName(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" }).format(
    toUtcDate(date),
  );
}

// "Agora" no fuso da clínica, independente do fuso do servidor.
// Devolve a data ("AAAA-MM-DD") e a hora em minutos desde a meia-noite.
export function getNowInClinicTimezone(now: Date = new Date()): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

// 480 -> "08:00"
export function minutesToTime(minutes: number): string {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

// "08:00" -> 480
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}
