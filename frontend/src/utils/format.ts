export const CLINIC_TIMEZONE = "America/Sao_Paulo";

// Data de hoje no fuso da clínica, no formato AAAA-MM-DD (usada como mínimo do calendário).
export function todayInClinic(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Data e hora atuais no fuso da clínica, ex.:
// { date: "segunda-feira, 23/11/2026", time: "19:20", offset: "GMT-3" }
export function nowInClinic(now: Date = new Date()) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINIC_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: CLINIC_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  const offset =
    new Intl.DateTimeFormat("en-US", { timeZone: CLINIC_TIMEZONE, timeZoneName: "shortOffset" })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value ?? "";

  return { date, time, offset };
}

// "2026-11-25" -> "25/11/2026"
export function formatDateBR(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

// Máscara enquanto digita: "11988887777" -> "(11) 98888-7777"
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
