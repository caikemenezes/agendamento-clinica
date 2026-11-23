# Agendamento Clínica

Mini sistema de agendamento de consultas: o usuário escolhe uma data, vê os horários disponíveis e cria um agendamento. Feriados (via API pública [Nager.Date](https://date.nager.at)) e fins de semana são bloqueados.

> 🚧 Em construção — este README é atualizado a cada etapa.

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
