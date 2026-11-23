import type { ReactNode } from "react";

interface DatePickerProps {
  value: string;
  min: string;
  onChange: (date: string) => void;
  children?: ReactNode; // informações do dia escolhido, abaixo do calendário
}

export function DatePicker({ value, min, onChange, children }: DatePickerProps) {
  return (
    <section className="step">
      <h2 className="step-title">
        <span className="step-number">1</span> Escolha a data
      </h2>
      <input
        type="date"
        className="date-input"
        aria-label="Data da consulta"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
      />
      {children}
    </section>
  );
}
