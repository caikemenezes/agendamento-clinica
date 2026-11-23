import { AppError } from "../errors/AppError.js";

// Formato de cada feriado devolvido pela API Nager.Date (só os campos que usamos).
export interface Holiday {
  date: string; // "2026-12-25"
  localName: string; // "Natal"
  name: string; // "Christmas Day"
  global: boolean; // true = feriado nacional; false = só em alguns estados
  counties: string[] | null; // estados onde vale, quando não é nacional (ex.: ["BR-SP"])
}

const NAGER_BASE_URL = "https://date.nager.at/api/v3/PublicHolidays";
const COUNTRY_CODE = "BR";
const REQUEST_TIMEOUT_MS = 5000;

// Cache em memória: ano -> lista de feriados nacionais.
// Os feriados de um ano não mudam, então basta buscar uma vez por ano
// enquanto o servidor estiver no ar. Guardamos a Promise (e não só o resultado)
// para que duas requisições simultâneas do mesmo ano gerem UMA chamada à API.
const cache = new Map<number, Promise<Holiday[]>>();

async function fetchNationalHolidays(year: number): Promise<Holiday[]> {
  let response: Response;
  try {
    response = await fetch(`${NAGER_BASE_URL}/${year}/${COUNTRY_CODE}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new AppError("Não foi possível consultar a API de feriados. Tente novamente.", 503);
  }

  if (!response.ok) {
    throw new AppError("A API de feriados respondeu com erro. Tente novamente.", 503);
  }

  const holidays = (await response.json()) as Holiday[];

  // Só feriados nacionais bloqueiam agendamento: a clínica não informou o estado,
  // então feriados estaduais (global = false) não se aplicam a ela.
  return holidays.filter((holiday) => holiday.global);
}

// Devolve os feriados nacionais de um ano, usando o cache quando possível.
export function getHolidaysByYear(year: number): Promise<Holiday[]> {
  const cached = cache.get(year);
  if (cached) return cached;

  const request = fetchNationalHolidays(year).catch((error) => {
    // Se a chamada falhou, tira do cache para tentar de novo na próxima vez.
    cache.delete(year);
    throw error;
  });

  cache.set(year, request);
  return request;
}

// Recebe uma data "AAAA-MM-DD" e devolve o feriado daquele dia, ou null.
export async function findHoliday(date: string): Promise<Holiday | null> {
  const year = Number(date.slice(0, 4));
  const holidays = await getHolidaysByYear(year);
  return holidays.find((holiday) => holiday.date === date) ?? null;
}

// Usado nos testes para começar sempre com o cache vazio.
export function clearHolidayCache(): void {
  cache.clear();
}
