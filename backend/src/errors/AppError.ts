// Erro "esperado" da aplicação: carrega o código HTTP que deve ir na resposta.
// Ex.: 400 (dado inválido), 409 (horário ocupado), 503 (API de feriados fora do ar).
// Assim as camadas de regra de negócio só lançam o erro, e quem monta a resposta
// HTTP decide o status a partir dele.
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}
