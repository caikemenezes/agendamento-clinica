# Agendamento Clínica

Mini sistema de agendamento de consultas: o usuário escolhe uma data, vê os horários disponíveis e cria um agendamento. Feriados (via API pública [Nager.Date](https://date.nager.at)) e fins de semana são bloqueados.

> 🚧 Em construção — este README é atualizado a cada etapa.

## Endpoints

### `GET /available?date=AAAA-MM-DD`
Informa se o dia está aberto e quais horários estão livres.

```http
GET /available?date=2026-11-25
```
```json
{
  "date": "2026-11-25",
  "weekday": "quarta-feira",
  "timezone": "America/Sao_Paulo",
  "isBusinessDay": true,
  "holiday": null,
  "reason": null,
  "message": "8 horário(s) disponível(is).",
  "availableSlots": ["08:00", "10:00", "11:00", "12:00", "13:00", "15:00", "16:00", "17:00"]
}
```

Dia bloqueado (`reason` pode ser `PAST_DATE`, `HOLIDAY` ou `WEEKEND`):
```json
{
  "date": "2026-12-25",
  "weekday": "sexta-feira",
  "timezone": "America/Sao_Paulo",
  "isBusinessDay": false,
  "holiday": "Natal",
  "reason": "HOLIDAY",
  "message": "Feriado: Natal. A clínica não atende.",
  "availableSlots": []
}
```

| Status | Quando |
|---|---|
| `200` | Sempre que a data é válida, mesmo bloqueada (o motivo vem em `reason`) |
| `400` | Data ausente ou inválida |
| `503` | API de feriados indisponível |

### `POST /appointments`
Cria um agendamento. O backend repete todas as validações, sem confiar no que a tela mostrou.

```http
POST /appointments
Content-Type: application/json

{
  "patientName": "Maria Silva",
  "patientPhone": "(11) 98888-7777",
  "date": "2026-11-25",
  "time": "10:00"
}
```
Resposta `201 Created`:
```json
{
  "message": "Consulta agendada para quarta-feira, 25/11/2026, às 10:00.",
  "appointment": {
    "id": 1,
    "patientName": "Maria Silva",
    "patientPhone": "11988887777",
    "date": "2026-11-25",
    "time": "10:00",
    "createdAt": "2026-11-23T22:02:35Z"
  }
}
```

| Status | Quando |
|---|---|
| `201` | Agendamento criado |
| `400` | Campos inválidos, data passada, feriado, fim de semana, horário fora do expediente ou que já passou hoje |
| `409` | Horário já ocupado |
| `503` | API de feriados indisponível |

### `GET /appointments`
Lista os agendamentos, ordenados por data e horário.

```json
[
  {
    "id": 1,
    "patientName": "Maria Silva",
    "patientPhone": "11988887777",
    "date": "2026-11-25",
    "time": "10:00",
    "createdAt": "2026-11-23T22:02:35Z"
  }
]
```

Erros sempre têm o formato `{ "error": "mensagem" }`.

## Decisões técnicas

### Feriados (API Nager.Date)
- **A consulta é feita pelo backend**, nunca pelo navegador, como pede o enunciado.
- **O ano vem da data escolhida**, não fixo em 2026. Assim, uma data de 2027 consulta os feriados de 2027.
- **Cache em memória por ano:** feriados de um ano não mudam, então a API é chamada uma única vez por ano enquanto o servidor estiver no ar. Se a chamada falhar, o ano sai do cache e a próxima requisição tenta de novo.
- **Só feriados nacionais bloqueiam agendamento** (`global: true`). O enunciado não informa o estado da clínica, então feriados estaduais (ex.: 09/07, só em SP) não são aplicados.
- **Carnaval é bloqueado.** A API o marca como ponto facultativo/bancário, mas ele vem como nacional e, na prática, clínicas costumam fechar.
- **API fora do ar:** a resposta é um erro `503` com mensagem clara, em vez de liberar horários sem saber se o dia é feriado.

### Horários e fuso horário
- **Expediente de 08:00 às 18:00, consultas de 1 hora:** são 10 horários por dia (08:00 a 17:00). A última consulta começa às 17:00 para terminar às 18:00.
- **Regras da clínica num só arquivo** (`src/config/clinic.ts`): mudar expediente ou duração não exige mexer na lógica.
- **Fuso fixo da clínica: `America/Sao_Paulo`.** O "agora" é sempre calculado nesse fuso, independentemente de onde o servidor esteja hospedado.
- **Datas tratadas em UTC** para descobrir o dia da semana, o que evita que o fuso do servidor mude o dia.
- **Datas passadas são bloqueadas**, e, no dia de hoje, só aparecem horários que ainda não começaram. O enunciado não pede, mas marcar no passado não faz sentido.
- **Datas inválidas** (`2026-02-30`, `25/12/2026`) são recusadas com erro `400`.
- **Ordem das verificações:** data passada → feriado → fim de semana → horários ocupados. A resposta sempre diz o motivo do bloqueio (`reason`) e uma mensagem pronta para a tela.

### Banco de dados e arquitetura
- **SQLite (`better-sqlite3`):** o banco é um arquivo (`backend/clinic.db`) criado automaticamente na primeira execução. Quem avalia não precisa instalar nem configurar nenhum servidor de banco.
- **Tabela `appointments`** com `UNIQUE (date, time)`: mesmo que duas pessoas confirmem o mesmo horário ao mesmo tempo, o banco aceita só a primeira.
- **Data e hora guardadas no horário local da clínica** (`date` = `AAAA-MM-DD`, `time` = `HH:MM`), que é como a clínica pensa a agenda; `created_at` fica em UTC.
- **Camadas:** `routes` → `controllers` → `services` → `repositories` → `database`. Regras de negócio ficam só nos services; SQL fica só nos repositories.
- **Validação dupla ao agendar:** o `POST` reaproveita a mesma regra do `GET /available` e confere tudo de novo (o pedido pode não ter vindo da tela). Se dois pedidos simultâneos passarem pela checagem, o `UNIQUE` do banco barra o segundo, que recebe `409`. Testado com 5 pedidos simultâneos para o mesmo horário: 1 aceito, 4 recusados.
- **Dados do paciente:** nome (3 a 100 caracteres) e telefone com DDD. O telefone aceita qualquer formatação, mas é guardado só com dígitos.
- **Tratamento de erros centralizado** (`middlewares/errorHandler.ts`): erros esperados viram respostas com status e mensagem claros; erros inesperados viram `500` sem expor detalhes internos.
