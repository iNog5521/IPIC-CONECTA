"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined) {
  if (!date) return ""
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function isValidDate(date: Date | undefined) {
  if (!date) return false
  return !isNaN(date.getTime())
}

interface CalendarInputProps {
  label?: string
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

export function CalendarInput({ label, value, onChange, placeholder = "Selecione uma data" }: CalendarInputProps) {
  const [open, setOpen] = React.useState(false)
  const [viewDate, setViewDate] = React.useState<Date>(value || new Date())
  const [inputValue, setInputValue] = React.useState(formatDate(value))

  React.useEffect(() => {
    setInputValue(formatDate(value))
    if (value) setViewDate(value)
  }, [value])

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day)
    onChange(newDate)
    setInputValue(formatDate(newDate))
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
    <div className="flex flex-col gap-3">
      {label && <Label style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</Label>}
      <div className="relative flex gap-2">
        <Input
          value={inputValue}
          placeholder={placeholder}
          className="bg-background pr-10"
          style={{ borderColor: open ? 'var(--primary)' : undefined, boxShadow: open ? '0 0 0 2px var(--primary-faded)' : undefined }}
          onChange={(e) => {
            const val = e.target.value
            setInputValue(val)
            const parts = val.split('/')
            if (parts.length === 3) {
              const d = parseInt(parts[0], 10)
              const m = parseInt(parts[1], 10) - 1
              const y = parseInt(parts[2], 10)
              if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                const date = new Date(y, m, d)
                if (isValidDate(date)) {
                  onChange(date)
                  setViewDate(date)
                }
              }
            }
          }}
          onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true) } }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ color: value ? 'var(--primary)' : '#9ca3af' }}
            >
              <CalendarIcon className="size-4" />
              <span className="sr-only">Selecionar data</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end" alignOffset={-8} sideOffset={10} style={{ zIndex: 9999, backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ padding: '1rem', minWidth: '300px', backgroundColor: 'white', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <ChevronLeft className="size-4" style={{ color: 'var(--primary)' }} />
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
                    {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 30 + i).map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} style={{ padding: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
                  <ChevronRight className="size-4" style={{ color: 'var(--primary)' }} />
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => { onChange(undefined); setInputValue(""); setOpen(false); }}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#6b7280', fontWeight: 500, cursor: 'pointer' }}
                >
                  Limpar
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  OK
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}