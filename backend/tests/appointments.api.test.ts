import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/database/connection.js";
import { clearHolidayCache } from "../src/services/holidayService.js";
import { mockHolidayApi, mockHolidayApiDown } from "./helpers/mockHolidayApi.js";

// Testes de ponta a ponta: requisição HTTP real -> rota -> service -> banco (em memória).

const validBody = {
  patientName: "Maria Silva",
  patientPhone: "(11) 98888-7777",
  date: "2026-11-25",
  time: "10:00",
};

describe("API de agendamento", () => {
  beforeAll(() => {
    // Congela só o relógio (Date) em terça, 24/11/2026, 13:30 de Brasília.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-24T16:30:00Z"));
  });
  afterAll(() => vi.useRealTimers());

  beforeEach(() => {
    db.exec("DELETE FROM appointments");
    clearHolidayCache();
    mockHolidayApi();
  });
  afterEach(() => vi.unstubAllGlobals());

  describe("GET /available", () => {
    it("devolve os horários de um dia útil", async () => {
      const res = await request(app).get("/available?date=2026-11-25");
      expect(res.status).toBe(200);
      expect(res.body.availableSlots).toHaveLength(10);
      expect(res.body.isBusinessDay).toBe(true);
    });

    it("informa feriado com lista vazia", async () => {
      const res = await request(app).get("/available?date=2026-12-25");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ reason: "HOLIDAY", holiday: "Natal", availableSlots: [] });
    });

    it("exige a data", async () => {
      const res = await request(app).get("/available");
      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });

    it("responde 503 se a API de feriados estiver fora do ar", async () => {
      mockHolidayApiDown();
      const res = await request(app).get("/available?date=2026-11-25");
      expect(res.status).toBe(503);
    });
  });

  describe("POST /appointments", () => {
    it("cria o agendamento e devolve a confirmação", async () => {
      const res = await request(app).post("/appointments").send(validBody);
      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Consulta agendada para quarta-feira, 25/11/2026, às 10:00.");
      expect(res.body.appointment).toMatchObject({
        id: expect.any(Number),
        patientName: "Maria Silva",
        patientPhone: "11988887777",
        date: "2026-11-25",
        time: "10:00",
      });
    });

    it("o horário reservado some do GET /available", async () => {
      await request(app).post("/appointments").send(validBody);
      const res = await request(app).get("/available?date=2026-11-25");
      expect(res.body.availableSlots).not.toContain("10:00");
    });

    it("recusa horário ocupado com 409", async () => {
      await request(app).post("/appointments").send(validBody);
      const res = await request(app)
        .post("/appointments")
        .send({ ...validBody, patientName: "João Souza" });
      expect(res.status).toBe(409);
    });

    it("pedidos simultâneos para o mesmo horário: só um é aceito", async () => {
      const responses = await Promise.all(
        [1, 2, 3, 4, 5].map((n) =>
          request(app)
            .post("/appointments")
            .send({ ...validBody, patientName: `Paciente ${n}` }),
        ),
      );
      const statuses = responses.map((res) => res.status).sort();
      expect(statuses).toEqual([201, 409, 409, 409, 409]);
    });

    it.each([
      ["feriado", { date: "2026-12-25" }],
      ["fim de semana", { date: "2026-11-28" }],
      ["data passada", { date: "2026-11-20" }],
      ["horário que já passou hoje", { date: "2026-11-24", time: "09:00" }],
      ["depois do expediente", { time: "18:00" }],
      ["fora da grade de horários", { time: "10:30" }],
      ["data inválida", { date: "2026-02-30" }],
      ["telefone sem DDD", { patientPhone: "98888-7777" }],
      ["nome curto", { patientName: "A" }],
    ])("recusa com 400: %s", async (_label, change) => {
      const res = await request(app)
        .post("/appointments")
        .send({ ...validBody, ...change });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });

    it("lista todos os problemas quando o corpo vem vazio", async () => {
      const res = await request(app).post("/appointments").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("nome");
      expect(res.body.error).toContain("telefone");
    });
  });

  describe("GET /appointments", () => {
    it("lista os agendamentos ordenados por data e hora", async () => {
      await request(app).post("/appointments").send({ ...validBody, time: "15:00" });
      await request(app).post("/appointments").send({ ...validBody, time: "09:00" });
      await request(app).post("/appointments").send({ ...validBody, date: "2026-11-24", time: "16:00" });

      const res = await request(app).get("/appointments");
      expect(res.status).toBe(200);
      expect(res.body.map((a: { date: string; time: string }) => `${a.date} ${a.time}`)).toEqual([
        "2026-11-24 16:00",
        "2026-11-25 09:00",
        "2026-11-25 15:00",
      ]);
    });
  });

  it("rota inexistente responde 404", async () => {
    const res = await request(app).get("/nao-existe");
    expect(res.status).toBe(404);
  });
});
