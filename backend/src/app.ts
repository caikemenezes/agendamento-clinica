import express from "express";
import cors from "cors";

// O "app" é a aplicação Express: aqui ficam as configurações e as rotas.
// Ele fica separado do server.ts para poder ser usado nos testes sem abrir porta.
export const app = express();

// Permite que o frontend (rodando em outra porta) chame esta API.
app.use(cors());

// Faz o Express entender o corpo das requisições em JSON (usado no POST).
app.use(express.json());

// Rota simples para checar se a API está no ar.
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
