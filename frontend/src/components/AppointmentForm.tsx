import { useState, type FormEvent } from "react";
import { formatDateBR, formatPhone } from "../utils/format";

interface AppointmentFormProps {
  date: string;
  time: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (patientName: string, patientPhone: string) => void;
}

export function AppointmentForm({ date, time, submitting, error, onSubmit }: AppointmentFormProps) {
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault(); // evita o recarregamento padrão da página
    onSubmit(patientName, patientPhone);
  }

  return (
    <section className="step">
      <h2 className="step-title">
        <span className="step-number">3</span> Seus dados
      </h2>
      <p className="muted">
        Consulta em <strong>{formatDateBR(date)}</strong> às <strong>{time}</strong>
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Nome completo</span>
          <input
            type="text"
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            placeholder="Maria Silva"
            autoComplete="name"
            required
            minLength={3}
            maxLength={100}
          />
        </label>

        <label className="field">
          <span>Telefone (WhatsApp)</span>
          <input
            type="tel"
            value={patientPhone}
            onChange={(event) => setPatientPhone(formatPhone(event.target.value))}
            placeholder="(11) 98888-7777"
            autoComplete="tel"
            required
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="button" disabled={submitting}>
          {submitting ? "Agendando…" : "Confirmar agendamento"}
        </button>
      </form>
    </section>
  );
}
