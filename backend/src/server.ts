import { app } from "./app.js";

// Porta do servidor: usa a variável de ambiente PORT se existir, senão 3333.
const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
