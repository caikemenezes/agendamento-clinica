import type {
  Appointment,
  AppointmentConfirmation,
  DayAvailability,
  NewAppointment,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

// Erro vindo da API, com o status HTTP (ex.: 409 = horário ocupado).
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

// Faz a chamada e transforma respostas de erro ({ error: "..." }) em ApiError.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Ele está ligado?", 0);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(body?.error ?? "Erro inesperado. Tente novamente.", response.status);
  }
  return body as T;
}

export function getAvailability(date: string): Promise<DayAvailability> {
  return request(`/available?date=${encodeURIComponent(date)}`);
}

export function createAppointment(data: NewAppointment): Promise<AppointmentConfirmation> {
  return request("/appointments", { method: "POST", body: JSON.stringify(data) });
}

export function listAppointments(): Promise<Appointment[]> {
  return request("/appointments");
}
