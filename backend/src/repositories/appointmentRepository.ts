import { db } from "../database/connection.js";

// Única camada que conhece SQL. As demais só chamam estas funções.

export interface Appointment {
  id: number;
  patientName: string;
  patientPhone: string;
  date: string; // "2026-11-25" (horário local da clínica)
  time: string; // "09:00"
  createdAt: string; // ISO em UTC
}

export interface NewAppointment {
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
}

// Formato da linha como está no banco (snake_case).
interface AppointmentRow {
  id: number;
  patient_name: string;
  patient_phone: string;
  date: string;
  time: string;
  created_at: string;
}

function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    date: row.date,
    time: row.time,
    createdAt: row.created_at,
  };
}

// Horários já reservados numa data, ex.: ["09:00", "14:00"].
export function findBookedTimesByDate(date: string): string[] {
  const rows = db
    .prepare("SELECT time FROM appointments WHERE date = ? ORDER BY time")
    .all(date) as { time: string }[];
  return rows.map((row) => row.time);
}

export function findAllAppointments(): Appointment[] {
  const rows = db
    .prepare("SELECT * FROM appointments ORDER BY date, time")
    .all() as AppointmentRow[];
  return rows.map(toAppointment);
}

// Lança erro do SQLite (SQLITE_CONSTRAINT_UNIQUE) se o horário já estiver reservado.
export function createAppointment(data: NewAppointment): Appointment {
  const row = db
    .prepare(
      `INSERT INTO appointments (patient_name, patient_phone, date, time)
       VALUES (?, ?, ?, ?)
       RETURNING *`,
    )
    .get(data.patientName, data.patientPhone, data.date, data.time) as AppointmentRow;
  return toAppointment(row);
}
