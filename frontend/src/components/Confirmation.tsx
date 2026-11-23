import type { AppointmentConfirmation } from "../types";

interface ConfirmationProps {
  confirmation: AppointmentConfirmation;
  onNew: () => void;
}

export function Confirmation({ confirmation, onNew }: ConfirmationProps) {
  const { appointment } = confirmation;

  return (
    <section className="confirmation" role="status">
      <div className="confirmation-icon" aria-hidden="true">
        ✓
      </div>
      <h2>Agendamento confirmado</h2>
      <p>{confirmation.message}</p>
      <dl className="summary">
        <div>
          <dt>Paciente</dt>
          <dd>{appointment.patientName}</dd>
        </div>
        <div>
          <dt>Protocolo</dt>
          <dd>#{String(appointment.id).padStart(5, "0")}</dd>
        </div>
      </dl>
      <button type="button" className="button button-secondary" onClick={onNew}>
        Fazer outro agendamento
      </button>
    </section>
  );
}
