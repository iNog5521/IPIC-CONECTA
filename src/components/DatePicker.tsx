"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, X } from "lucide-react";
import "react-day-picker/style.css";

interface DatePickerInputProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label: string;
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
}

export function DatePickerInput({
  value,
  onChange,
  label,
  placeholder = "Selecione uma data",
  minYear = 1900,
  maxYear = new Date().getFullYear()
}: DatePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => currentYear - i
  );

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const [selectedMonth, setSelectedMonth] = useState<Date>(value || new Date());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    if (date) setIsOpen(false);
  };

  const handleMonthChange = (direction: number) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedMonth(newDate);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left flex items-center justify-between hover:border-gray-400 transition-colors bg-white font-normal"
        style={{ 
          fontSize: '0.95rem',
          borderColor: isOpen ? 'var(--primary)' : undefined,
          boxShadow: isOpen ? '0 0 0 2px var(--primary-faded)' : undefined
        }}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"} style={{ color: value ? undefined : '#9ca3af' }}>
          {value ? format(value, "dd/MM/yyyy") : placeholder}
        </span>
        <Calendar size={20} style={{ color: value ? 'var(--primary)' : '#9ca3af' }} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4"
          style={{ 
            minWidth: '320px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              style={{ color: 'var(--primary)' }}
            >
              ‹
            </button>
            <div className="flex gap-2">
              <select
                value={selectedMonth.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(selectedMonth);
                  newDate.setMonth(parseInt(e.target.value));
                  setSelectedMonth(newDate);
                }}
                className="text-sm font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(selectedMonth);
                  newDate.setFullYear(parseInt(e.target.value));
                  setSelectedMonth(newDate);
                }}
                className="text-sm font-semibold bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              style={{ color: 'var(--primary)' }}
            >
              ›
            </button>
          </div>
          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleSelect}
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            locale={ptBR}
            className="react-day-picker-custom"
            styles={{
              caption: { display: 'none' },
              head_cell: { color: '#6b7280', fontSize: '0.75rem', fontWeight: 600 },
              day: { fontSize: '0.875rem' }
            }}
            disabled={[
              { from: new Date(currentYear + 1, 0, 1), to: new Date(3000, 11, 31) }
            ]}
          />
          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onChange(undefined); setIsOpen(false); }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
