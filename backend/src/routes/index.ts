import { Router } from "express";
import * as appointmentController from "../controllers/appointmentController.js";
import { getAvailable } from "../controllers/availabilityController.js";

export const routes = Router();

routes.get("/available", getAvailable);
routes.post("/appointments", appointmentController.create);
routes.get("/appointments", appointmentController.list);
