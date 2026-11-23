import type { Request, Response } from "express";
import { findAllAppointments } from "../repositories/appointmentRepository.js";
import { scheduleAppointment } from "../services/appointmentService.js";

// POST /appointments
export async function create(req: Request, res: Response): Promise<void> {
  const confirmation = await scheduleAppointment(req.body);
  res.status(201).json(confirmation);
}

// GET /appointments
export function list(_req: Request, res: Response): void {
  res.json(findAllAppointments());
}
