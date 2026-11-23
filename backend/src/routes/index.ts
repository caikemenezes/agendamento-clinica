import { Router } from "express";
import { getAvailable } from "../controllers/availabilityController.js";

export const routes = Router();

routes.get("/available", getAvailable);
