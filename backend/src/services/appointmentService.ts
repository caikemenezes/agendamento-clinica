import { AppError } from "../errors/AppError.js";
import {
  createAppointment as insertAppointment,
  findBookedTimesByDate,
  type Appointment,
  type NewAppointment,
} from "../repositories/appointmentRepository.js";
import { formatDateBR, getNowInClinicTimezone, timeToMinutes } from "../utils/date.js";
import { generateDailySlots, getDayAvailability } from "./availabilityService.js";

const TIME_FORMAT = /^\d{2}:\d{2}$/;

export interface AppointmentConfirmation {
  message: string;
  appointment: Appointment;
}

// Confere os campos enviados e devolve os dados já limpos.
// O corpo da requisição chega como "unknown": não dá para confiar no que o cliente mandou.
export function validateAppointmentInput(body: unknown): NewAppointment {
  const input = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const patientName = typeof input.patientName === "string" ? input.patientName.trim() : "";
  if (patientName.length < 3 || patientName.length > 100) {
    errors.push("Informe o nome do paciente (3 a 100 caracteres).");
  }

  // Aceita "(11) 99999-0000" ou "11999990000"; guarda só os dígitos.
  const patientPhone =
    typeof input.patientPhone === "string" ? input.patientPhone.replace(/\D/g, "") : "";
  if (patientPhone.length < 10 || patientPhone.length > 11) {
    errors.push("Informe um telefone com DDD (10 ou 11 dígitos).");
  }

  const date = typeof input.date === "string" ? input.date : "";
  if (!date) errors.push("Informe a data (AAAA-MM-DD).");

  const time = typeof input.time === "string" ? input.time : "";
  if (!TIME_FORMAT.test(time)) errors.push("Informe o horário no formato HH:MM.");

  if (errors.length > 0) {
    throw new AppError(errors.join(" "), 400);
  }

  return { patientName, patientPhone, date, time };
}

// Cria o agendamento repetindo TODAS as validações no backend:
// o pedido pode não ter vindo da nossa tela, então nada que o cliente diga é aceito sem conferir.
export async function scheduleAppointment(
  body: unknown,
  now: Date = new Date(),
): Promise<AppointmentConfirmation> {
  const data = validateAppointmentInput(body);

  // Reaproveita a mesma regra do GET /available (data válida, passado, feriado, fim de semana).
  const availability = await getDayAvailability(data.date, findBookedTimesByDate(data.date), now);
  if (availability.reason) {
    throw new AppError(availability.message, 400);
  }

  if (!generateDailySlots().includes(data.time)) {
    throw new AppError(
      "Horário fora do expediente. As consultas começam de hora em hora, das 08:00 às 17:00.",
      400,
    );
  }

  const today = getNowInClinicTimezone(now);
  if (data.date === today.date && timeToMinutes(data.time) <= today.minutes) {
    throw new AppError("Este horário já passou.", 400);
  }

  if (!availability.availableSlots.includes(data.time)) {
    throw new AppError("Este horário já está ocupado. Escolha outro.", 409);
  }

  let appointment: Appointment;
  try {
    appointment = insertAppointment(data);
  } catch (error) {
    // Duas pessoas confirmaram o mesmo horário quase juntas: o UNIQUE do banco barrou a segunda.
    if ((error as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE") {
      throw new AppError("Este horário acabou de ser reservado. Escolha outro.", 409);
    }
    throw error;
  }

  return {
    message: `Consulta agendada para ${availability.weekday}, ${formatDateBR(data.date)}, às ${data.time}.`,
    appointment,
  };
}
