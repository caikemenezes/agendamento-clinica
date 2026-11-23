import { useEffect, useRef, useState } from "react";
import { AppointmentForm } from "./components/AppointmentForm";
import { AppointmentList } from "./components/AppointmentList";
import { ClinicClock } from "./components/ClinicClock";
import { Confirmation } from "./components/Confirmation";
import { DatePicker } from "./components/DatePicker";
import { DayInfo } from "./components/DayInfo";
import { SlotList } from "./components/SlotList";
import { ApiError, createAppointment, getAvailability, listAppointments } from "./services/api";
import type { Appointment, AppointmentConfirmation, DayAvailability } from "./types";
import { todayInClinic } from "./utils/format";

export function App() {
  const [date, setDate] = useState("");
  const [availability, setAvailability] = useState<DayAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<AppointmentConfirmation | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);

  async function loadAppointments() {
    setAppointmentsLoading(true);
    setAppointmentsError(null);
    try {
      setAppointments(await listAppointments());
    } catch (error) {
      setAppointmentsError(error instanceof ApiError ? error.message : "Erro ao carregar a agenda.");
    } finally {
      setAppointmentsLoading(false);
    }
  }

  // Carrega a agenda uma vez, quando a tela abre.
  useEffect(() => {
    loadAppointments();
  }, []);

  // Guarda a última data pedida: se o usuário trocar de data rápido,
  // uma resposta antiga que chegue atrasada é ignorada.
  const latestDate = useRef("");

  async function loadAvailability(newDate: string) {
    latestDate.current = newDate;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await getAvailability(newDate);
      if (latestDate.current === newDate) setAvailability(result);
    } catch (error) {
      if (latestDate.current === newDate) {
        setAvailability(null);
        setLoadError(error instanceof ApiError ? error.message : "Erro ao consultar horários.");
      }
    } finally {
      if (latestDate.current === newDate) setLoading(false);
    }
  }

  function handleDateChange(newDate: string) {
    setDate(newDate);
    setSelectedTime(null);
    setSubmitError(null);
    if (newDate) {
      loadAvailability(newDate);
    } else {
      setAvailability(null);
    }
  }

  async function handleSubmit(patientName: string, patientPhone: string) {
    if (!selectedTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createAppointment({ patientName, patientPhone, date, time: selectedTime });
      setConfirmation(result);
      loadAppointments();
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Erro ao agendar.");
      // Horário ocupado por outra pessoa nesse meio-tempo: atualiza a lista.
      if (error instanceof ApiError && error.status === 409) {
        setSelectedTime(null);
        loadAvailability(date);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewAppointment() {
    setConfirmation(null);
    setSelectedTime(null);
    setSubmitError(null);
    if (date) loadAvailability(date);
  }

  return (
    <div className="page">
      <header className="header">
        <p className="eyebrow">Clínica</p>
        <h1>Agendamento de consultas</h1>
        <p className="muted">Segunda a sexta, das 08:00 às 18:00 · consultas de 1 hora</p>
        <ClinicClock />
      </header>

      <main className="card">
        {confirmation ? (
          <Confirmation confirmation={confirmation} onNew={handleNewAppointment} />
        ) : (
          <>
            <DatePicker value={date} min={todayInClinic()} onChange={handleDateChange}>
              {availability && !loading && <DayInfo availability={availability} />}
            </DatePicker>

            {/* Aviso de conflito (409): o formulário fechou, então a mensagem aparece aqui. */}
            {submitError && !selectedTime && (
              <p className="error" role="alert">
                {submitError}
              </p>
            )}

            {loadError ? (
              <p className="error" role="alert">
                {loadError}
              </p>
            ) : (
              <SlotList
                availability={availability}
                loading={loading}
                selected={selectedTime}
                onSelect={(time) => {
                  setSelectedTime(time);
                  setSubmitError(null);
                }}
              />
            )}

            {selectedTime && (
              <AppointmentForm
                key={`${date}-${selectedTime}`}
                date={date}
                time={selectedTime}
                submitting={submitting}
                error={submitError}
                onSubmit={handleSubmit}
              />
            )}
          </>
        )}
      </main>

      <AppointmentList
        appointments={appointments}
        loading={appointmentsLoading}
        error={appointmentsError}
        onRefresh={loadAppointments}
      />
    </div>
  );
}
