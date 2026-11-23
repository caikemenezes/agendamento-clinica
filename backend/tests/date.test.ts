import { describe, expect, it } from "vitest";
import {
  formatDateBR,
  getNowInClinicTimezone,
  getWeekdayName,
  isValidDate,
  isWeekend,
  minutesToTime,
  timeToMinutes,
} from "../src/utils/date.js";

describe("utils/date", () => {
  it("aceita datas válidas no formato AAAA-MM-DD", () => {
    expect(isValidDate("2026-11-25")).toBe(true);
    expect(isValidDate("2028-02-29")).toBe(true); // ano bissexto
  });

  it("recusa datas inexistentes ou em outro formato", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("2026-02-29")).toBe(false); // 2026 não é bissexto
    expect(isValidDate("25/11/2026")).toBe(false);
    expect(isValidDate("2026-1-5")).toBe(false);
    expect(isValidDate("abc")).toBe(false);
  });

  it("identifica sábado e domingo como fim de semana", () => {
    expect(isWeekend("2026-11-28")).toBe(true); // sábado
    expect(isWeekend("2026-11-29")).toBe(true); // domingo
    expect(isWeekend("2026-11-25")).toBe(false); // quarta
  });

  it("devolve o dia da semana em português", () => {
    expect(getWeekdayName("2026-11-25")).toBe("quarta-feira");
  });

  it("calcula o 'agora' no fuso de Brasília, não no do servidor", () => {
    // 02:00 UTC do dia 25 = 23:00 do dia 24 em Brasília
    const now = getNowInClinicTimezone(new Date("2026-11-25T02:00:00Z"));
    expect(now).toEqual({ date: "2026-11-24", minutes: 23 * 60 });
  });

  it("converte horários e datas", () => {
    expect(timeToMinutes("08:00")).toBe(480);
    expect(minutesToTime(1020)).toBe("17:00");
    expect(formatDateBR("2026-11-25")).toBe("25/11/2026");
  });
});
