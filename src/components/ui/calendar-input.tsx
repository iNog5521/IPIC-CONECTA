"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatDate(date: Date | undefined) {
  if (!date) return ""
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

interface CalendarInputProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function CalendarInput({ value, onChange, placeholder = "Selecione uma data" }: CalendarInputProps) {
  const [open, setOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState<Date>(value || new Date())

  React.useEffect(() => {
    if (value) setViewDate(value)
  }, [value])

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    onChange(newDate)
    setOpen(false)
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(viewDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setViewDate(newDate)
  }

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const paddingDays = Array.from({ length: firstDay }, (_, i) => i)

  const isSelected = (day: number) => {
    if (!value) return false
    return value.getDate() === day && value.getMonth() === month && value.getFullYear() === year
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: 'var(--background)',
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          width: '100%',
          fontWeight: value ? '500' : '400',
          fontSize: '0.95rem'
        }}
      >
        <CalendarIcon size={18} style={{ color: value ? 'var(--primary)' : 'var(--text-muted)' }} />
        {value ? formatDate(value) : placeholder}
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }} onClick={() => setOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '1.5rem', width: '90%', maxWidth: '360px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Selecionar Data</h2>
              <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <ChevronLeft className="size-5" style={{ color: 'var(--primary)' }} />
              </Button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select
                  value={month}
                  onChange={(e) => { const d = new Date(viewDate); d.setMonth(parseInt(e.target.value)); setViewDate(d) }}
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontWeight: 600, backgroundColor: 'white', color: 'var(--text-primary)' }}
                >
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select
                  value={year}
                  onChange={(e) => { const d = new Date(viewDate); d.setFullYear(parseInt(e.target.value)); setViewDate(d) }}
                  style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontWeight: 600, backgroundColor: 'white', color: 'var(--text-primary)' }}
                >
                  {Array.from({ length: new Date().getFullYear() - 1940 + 1 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                <ChevronRight className="size-5" style={{ color: 'var(--primary)' }} />
              </Button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.5rem' }}>
              {DAYS.map((day) => (
                <div key={day} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', padding: '0.5rem' }}>
                  {day}
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {paddingDays.map((_, i) => <div key={`pad-${i}`} style={{ padding: '0.5rem' }} />)}
              {days.map((day) => (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: isSelected(day) ? '8px' : isToday(day) ? '8px' : '4px',
                    background: isSelected(day) ? 'var(--primary)' : isToday(day) ? '#dcfce7' : '#f9fafb',
                    color: isSelected(day) ? 'white' : 'var(--text-primary)',
                    fontWeight: isToday(day) || isSelected(day) ? 700 : 400,
                    fontSize: '0.875rem',
                    border: isToday(day) && !isSelected(day) ? '2px solid var(--primary)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected(day)) {
                      e.currentTarget.style.backgroundColor = '#e5e7eb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected(day)) {
                      e.currentTarget.style.backgroundColor = isToday(day) ? '#dcfce7' : '#f9fafb'
                    }
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              {value && (
                <button
                  onClick={() => { onChange(undefined); setOpen(false); }}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f3f4f6', color: '#6b7280', fontWeight: 500, cursor: 'pointer' }}
                >
                  Limpar
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
