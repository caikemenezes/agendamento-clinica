// Regras de funcionamento da clínica, reunidas num só lugar.
// Mudar o expediente ou a duração da consulta é mudar só este arquivo.
export const CLINIC = {
  timezone: "America/Sao_Paulo",
  openingHour: 8, // primeira consulta começa às 08:00
  closingHour: 18, // última consulta precisa terminar até 18:00
  appointmentDurationMinutes: 60,
} as const;
