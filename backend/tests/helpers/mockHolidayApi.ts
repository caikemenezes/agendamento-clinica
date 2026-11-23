import { vi } from "vitest";
import type { Holiday } from "../../src/services/holidayService.js";

// Feriados falsos, no mesmo formato da API Nager.Date.
// Os testes não dependem de internet nem de a API estar no ar.
export const FAKE_HOLIDAYS: Holiday[] = [
  { date: "2026-12-25", localName: "Natal", name: "Christmas Day", global: true, counties: null },
  {
    date: "2026-07-09",
    localName: "Revolução Constitucionalista de 1932",
    name: "Constitutionalist Revolution of 1932",
    global: false,
    counties: ["BR-SP"],
  },
  {
    date: "2027-01-01",
    localName: "Confraternização Universal",
    name: "New Year's Day",
    global: true,
    counties: null,
  },
];

// Substitui o fetch global por um falso que devolve FAKE_HOLIDAYS.
// Devolve o próprio mock para os testes contarem quantas vezes foi chamado.
export function mockHolidayApi() {
  const fetchMock = vi.fn(async (url: string | URL) => {
    const year = String(url).split("/").at(-2);
    const holidays = FAKE_HOLIDAYS.filter((holiday) => holiday.date.startsWith(`${year}-`));
    return new Response(JSON.stringify(holidays), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Simula a API fora do ar.
export function mockHolidayApiDown() {
  const fetchMock = vi.fn(async () => {
    throw new TypeError("fetch failed");
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
