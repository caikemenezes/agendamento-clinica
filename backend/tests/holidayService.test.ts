import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../src/errors/AppError.js";
import { clearHolidayCache, findHoliday } from "../src/services/holidayService.js";
import { mockHolidayApi, mockHolidayApiDown } from "./helpers/mockHolidayApi.js";

describe("holidayService", () => {
  beforeEach(() => clearHolidayCache());
  afterEach(() => vi.unstubAllGlobals());

  it("encontra um feriado nacional", async () => {
    mockHolidayApi();
    const holiday = await findHoliday("2026-12-25");
    expect(holiday?.localName).toBe("Natal");
  });

  it("devolve null para um dia comum", async () => {
    mockHolidayApi();
    expect(await findHoliday("2026-11-25")).toBeNull();
  });

  it("ignora feriados estaduais", async () => {
    mockHolidayApi();
    expect(await findHoliday("2026-07-09")).toBeNull();
  });

  it("consulta a API pelo ano da data", async () => {
    const fetchMock = mockHolidayApi();
    const holiday = await findHoliday("2027-01-01");
    expect(holiday?.localName).toBe("Confraternização Universal");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/2027/BR");
  });

  it("usa o cache: a API é chamada uma vez por ano", async () => {
    const fetchMock = mockHolidayApi();
    await findHoliday("2026-12-25");
    await findHoliday("2026-11-25");
    await findHoliday("2026-01-01");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("pedidos simultâneos do mesmo ano geram uma única chamada", async () => {
    const fetchMock = mockHolidayApi();
    await Promise.all([findHoliday("2026-12-25"), findHoliday("2026-11-25")]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("API fora do ar gera erro 503 e permite tentar de novo depois", async () => {
    mockHolidayApiDown();
    await expect(findHoliday("2026-12-25")).rejects.toMatchObject({
      constructor: AppError,
      statusCode: 503,
    });

    // A API voltou: a falha não ficou presa no cache.
    mockHolidayApi();
    expect((await findHoliday("2026-12-25"))?.localName).toBe("Natal");
  });
});
