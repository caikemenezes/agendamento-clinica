import { useEffect, useState } from "react";
import { CLINIC_TIMEZONE, nowInClinic } from "../utils/format";

// Data e hora atuais da clínica, atualizadas a cada 30 segundos.
export function ClinicClock() {
  const [now, setNow] = useState(() => nowInClinic());

  useEffect(() => {
    const timer = setInterval(() => setNow(nowInClinic()), 30_000);
    return () => clearInterval(timer); // limpa o timer quando o componente sai da tela
  }, []);

  return (
    <p className="clock">
      <span>Hoje: {now.date}</span>
      <span>
        {now.time} · {CLINIC_TIMEZONE} ({now.offset})
      </span>
    </p>
  );
}
