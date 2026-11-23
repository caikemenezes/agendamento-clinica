import express from "express";
import cors from "cors";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";
import { routes } from "./routes/index.js";

// A configuração do app fica separada do server.ts para os testes
// usarem a aplicação sem abrir uma porta.
export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(routes);

// Precisam vir depois das rotas.
app.use(notFoundHandler);
app.use(errorHandler);
