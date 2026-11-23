import { CLINIC } from "../config/clinic.js";
import { AppError } from "../errors/AppError.js";
import {
  getNowInClinicTimezone,
  getWeekdayName,
  isValidDate,
  isWeekend,
  minutesToTime,
  timeToMinutes,
} from "../utils/date.js";
import { findHoliday } from "./holidayService.js";

export type UnavailableReason = "PAST_DATE" | "HOLIDAY" | "WEEKEND";

export interface DayAvailability {
  date: string;
  weekday: string;
  timezone: string;
  isBusinessDay: boolean;
  holiday: string | null;
  reason: UnavailableReason | null; // por que o dia está bloqueado (null = não está)
  message: string;
  availableSlots: string[];
}

// Todos os inícios de consulta possíveis num dia: 08:00, 09:00 ... 17:00.
// A última começa às 17:00 porque precisa terminar até 18:00.
export function generateDailySlots(): string[] {
  const slots: string[] = [];
  const opening = CLINIC.openingHour * 60;
  const lastStart = CLINIC.closingHour * 60 - CLINIC.appointmentDurationMinutes;

  for (let start = opening; start <= lastStart; start += CLINIC.appointmentDurationMinutes) {
    slots.push(minutesToTime(start));
  }
  return slots;
}

// Calcula a disponibilidade de um dia.
// bookedTimes: horários já ocupados nesse dia (vêm do banco na rota).
// now: permite fixar o "agora" nos testes; em produção é o horário atual.
export async function getDayAvailability(
  date: string,
  bookedTimes: string[] = [],
  now: Date = new Date(),
): Promise<DayAvailability> {
  if (!isValidDate(date)) {
    throw new AppError("Data inválida. Use o formato AAAA-MM-DD, ex.: 2026-02-10.", 400);
  }

  const holiday = await findHoliday(date);
  const weekend = isWeekend(date);
  const today = getNowInClinicTimezone(now);

  const base = {
    date,
    weekday: getWeekdayName(date),
    timezone: CLINIC.timezone,
    isBusinessDay: !weekend && !holiday,
    holiday: holiday?.localName ?? null,
  };

  // Comparar "AAAA-MM-DD" como texto funciona porque o formato segue a ordem ano-mês-dia.
  if (date < today.date) {
    return { ...base, reason: "PAST_DATE", message: "Esta data já passou.", availableSlots: [] };
  }
  if (holiday) {
    return {
      ...base,
      reason: "HOLIDAY",
      message: `Feriado: ${holiday.localName}. A clínica não atende.`,
      availableSlots: [],
    };
  }
  if (weekend) {
    return {
      ...base,
      reason: "WEEKEND",
      message: "A clínica não atende aos sábados e domingos.",
      availableSlots: [],
    };
  }

  const booked = new Set(bookedTimes);
  const isToday = date === today.date;

  const availableSlots = generateDailySlots().filter((slot) => {
    if (booked.has(slot)) return false;
    // Hoje: só horários que ainda não começaram.
    if (isToday && timeToMinutes(slot) <= today.minutes) return false;
    return true;
  });

  return {
    ...base,
    reason: null,
    message:
      availableSlots.length > 0
        ? `${availableSlots.length} horário(s) disponível(is).`
        : "Não há horários disponíveis nesta data.",
    availableSlots,
  };
}
