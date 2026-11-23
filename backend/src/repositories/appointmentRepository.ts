import { db } from "../database/connection.js";

// Única camada que conhece SQL. As demais só chamam estas funções.

// Horários já reservados numa data, ex.: ["09:00", "14:00"].
export function findBookedTimesByDate(date: string): string[] {
  const rows = db
    .prepare("SELECT time FROM appointments WHERE date = ? ORDER BY time")
    .all(date) as { time: string }[];
  return rows.map((row) => row.time);
}
