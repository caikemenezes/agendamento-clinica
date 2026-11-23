import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError.js";

// Ponto único de tratamento de erros: toda exceção lançada nas rotas chega aqui.
// Erros esperados (AppError) viram resposta com o status e a mensagem deles;
// qualquer outro é falha inesperada: registra no log e responde 500 sem expor detalhes.
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Erro interno do servidor." });
}

// Rota que não existe.
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Rota não encontrada." });
}
