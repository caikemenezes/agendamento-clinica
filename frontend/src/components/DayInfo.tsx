import type { DayAvailability } from "../types";
import { formatDateBR } from "../utils/format";

interface DayInfoProps {
  availability: DayAvailability;
}

const STATUS_LABEL = {
  HOLIDAY: "Feriado",
  WEEKEND: "Fim de semana",
  PAST_DATE: "Data passada",
} as const;

// Os "dados reais" do dia escolhido, como vieram do backend.
export function DayInfo({ availability }: DayInfoProps) {
  const { date, weekday, timezone, isBusinessDay, holiday, reason, availableSlots } = availability;

  const status = reason
    ? reason === "HOLIDAY" && holiday
      ? `Feriado: ${holiday}`
      : STATUS_LABEL[reason]
    : "Dia útil";

  return (
    <dl className="day-info" aria-label="Informações do dia">
      <div>
        <dt>Data</dt>
        <dd>
          {formatDateBR(date)} · {weekday}
        </dd>
      </div>
      <div>
        <dt>Situação</dt>
        <dd>
          <span className={`badge ${isBusinessDay && !reason ? "badge-open" : "badge-closed"}`}>
            {status}
          </span>
        </dd>
      </div>
      <div>
        <dt>Fuso horário</dt>
        <dd>{timezone}</dd>
      </div>
      <div>
        <dt>Horários livres</dt>
        <dd>{availableSlots.length}</dd>
      </div>
    </dl>
  );
}
