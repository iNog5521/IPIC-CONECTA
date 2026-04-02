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

  const years = Array.from(
    { length: maxYear - minYear + 1 },
    (_, i) => maxYear - i
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

  const customHeader = () => (
    <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100">
      <button
        type="button"
        onClick={() => handleMonthChange(-1)}
        className="p-1 hover:bg-gray-100 rounded transition-colors text-sm font-medium"
      >
        &lt;
      </button>
      <select
        value={selectedMonth.getMonth()}
        onChange={(e) => {
          const newDate = new Date(selectedMonth);
          newDate.setMonth(parseInt(e.target.value));
          setSelectedMonth(newDate);
        }}
        className="text-sm font-semibold bg-transparent border-none cursor-pointer focus:outline-none"
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
        className="text-sm font-semibold bg-transparent border-none cursor-pointer focus:outline-none"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => handleMonthChange(1)}
        className="p-1 hover:bg-gray-100 rounded transition-colors text-sm font-medium"
      >
        &gt;
      </button>
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-left flex items-center justify-between hover:border-gray-400 transition-colors bg-white font-normal"
        style={{ fontSize: '0.95rem' }}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? format(value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : placeholder}
        </span>
        <Calendar size={20} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 p-3">
          <div className="flex justify-between items-center mb-2">
            {customHeader()}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={16} className="text-gray-500" />
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
              { from: new Date(maxYear + 1, 0, 1), to: new Date(3000, 11, 31) }
            ]}
          />
          <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
            <button
              type="button"
              onClick={() => { onChange(undefined); setIsOpen(false); }}
              className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-[#1B3B36] rounded-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
