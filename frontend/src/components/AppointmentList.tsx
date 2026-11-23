import type { Appointment } from "../types";
import { formatDateBR, formatPhone } from "../utils/format";

interface AppointmentListProps {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

// Agenda da clínica (GET /appointments).
export function AppointmentList({ appointments, loading, error, onRefresh }: AppointmentListProps) {
  return (
    <section className="card agenda" aria-labelledby="agenda-title">
      <div className="agenda-header">
        <h2 id="agenda-title">Agenda</h2>
        <button type="button" className="link-button" onClick={onRefresh} disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {!error && appointments.length === 0 && !loading && (
        <p className="muted">Nenhum agendamento ainda.</p>
      )}

      {appointments.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Horário</th>
                <th>Paciente</th>
                <th>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>{formatDateBR(appointment.date)}</td>
                  <td>{appointment.time}</td>
                  <td>{appointment.patientName}</td>
                  <td className="nowrap">{formatPhone(appointment.patientPhone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
