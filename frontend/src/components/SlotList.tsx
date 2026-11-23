import type { DayAvailability } from "../types";

interface SlotListProps {
  availability: DayAvailability | null;
  loading: boolean;
  selected: string | null;
  onSelect: (time: string) => void;
}

export function SlotList({ availability, loading, selected, onSelect }: SlotListProps) {
  return (
    <section className="step">
      <h2 className="step-title">
        <span className="step-number">2</span> Escolha o horário
      </h2>

      {loading && <p className="muted">Consultando horários…</p>}

      {!loading && !availability && <p className="muted">Selecione uma data para ver os horários.</p>}

      {!loading && availability && availability.availableSlots.length === 0 && (
        <p className="notice">{availability.message}</p>
      )}

      {!loading && availability && availability.availableSlots.length > 0 && (
        <div className="slots" role="group" aria-label="Horários disponíveis">
          {availability.availableSlots.map((time) => (
            <button
              key={time}
              type="button"
              className={`slot ${selected === time ? "slot-selected" : ""}`}
              aria-pressed={selected === time}
              onClick={() => onSelect(time)}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
