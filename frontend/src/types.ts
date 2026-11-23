// Formatos das respostas do backend (espelham os tipos da API).

export type UnavailableReason = "PAST_DATE" | "HOLIDAY" | "WEEKEND";

export interface DayAvailability {
  date: string;
  weekday: string;
  timezone: string;
  isBusinessDay: boolean;
  holiday: string | null;
  reason: UnavailableReason | null;
  message: string;
  availableSlots: string[];
}

export interface Appointment {
  id: number;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface NewAppointment {
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
}

export interface AppointmentConfirmation {
  message: string;
  appointment: Appointment;
}
