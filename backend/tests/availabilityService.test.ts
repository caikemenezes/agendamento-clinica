import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateDailySlots, getDayAvailability } from "../src/services/availabilityService.js";
import { clearHolidayCache } from "../src/services/holidayService.js";
import { mockHolidayApi } from "./helpers/mockHolidayApi.js";

// "Agora" fixo: terça, 24/11/2026, 13:30 em Brasília (16:30 UTC).
const NOW = new Date("2026-11-24T16:30:00Z");

const ALL_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
];

describe("availabilityService", () => {
  beforeEach(() => {
    clearHolidayCache();
    mockHolidayApi();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("gera 10 horários de 1 hora, das 08:00 às 17:00", () => {
    expect(generateDailySlots()).toEqual(ALL_SLOTS);
  });

  it("dia útil livre tem todos os horários", async () => {
    const result = await getDayAvailability("2026-11-25", [], NOW);
    expect(result.isBusinessDay).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.weekday).toBe("quarta-feira");
    expect(result.timezone).toBe("America/Sao_Paulo");
    expect(result.availableSlots).toEqual(ALL_SLOTS);
  });

  it("remove os horários já ocupados", async () => {
    const result = await getDayAvailability("2026-11-25", ["09:00", "14:00"], NOW);
    expect(result.availableSlots).not.toContain("09:00");
    expect(result.availableSlots).not.toContain("14:00");
    expect(result.availableSlots).toHaveLength(8);
  });

  it("hoje: mostra só horários que ainda não começaram", async () => {
    const result = await getDayAvailability("2026-11-24", [], NOW);
    expect(result.availableSlots).toEqual(["14:00", "15:00", "16:00", "17:00"]);
  });

  it("bloqueia fim de semana", async () => {
    const result = await getDayAvailability("2026-11-28", [], NOW);
    expect(result.reason).toBe("WEEKEND");
    expect(result.isBusinessDay).toBe(false);
    expect(result.availableSlots).toEqual([]);
  });

  it("bloqueia feriado e informa o nome", async () => {
    const result = await getDayAvailability("2026-12-25", [], NOW);
    expect(result.reason).toBe("HOLIDAY");
    expect(result.holiday).toBe("Natal");
    expect(result.availableSlots).toEqual([]);
  });

  it("bloqueia data passada", async () => {
    const result = await getDayAvailability("2026-11-20", [], NOW);
    expect(result.reason).toBe("PAST_DATE");
    expect(result.availableSlots).toEqual([]);
  });

  it("recusa data inválida com erro 400", async () => {
    await expect(getDayAvailability("2026-02-30", [], NOW)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
