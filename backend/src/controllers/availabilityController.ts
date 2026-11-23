import type { Request, Response } from "express";
import { AppError } from "../errors/AppError.js";
import { findBookedTimesByDate } from "../repositories/appointmentRepository.js";
import { getDayAvailability } from "../services/availabilityService.js";

// GET /available?date=AAAA-MM-DD
export async function getAvailable(req: Request, res: Response): Promise<void> {
  const { date } = req.query;

  if (typeof date !== "string" || date.length === 0) {
    throw new AppError("Informe a data na URL: /available?date=AAAA-MM-DD", 400);
  }

  const bookedTimes = findBookedTimesByDate(date);
  const availability = await getDayAvailability(date, bookedTimes);

  res.json(availability);
}
