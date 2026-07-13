'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DateRangePickerProps {
  checkIn: string
  checkOut: string
  onChangeCheckIn: (date: string) => void
  onChangeCheckOut: (date: string) => void
}

const DAYS_ID   = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

/** Format YYYY-MM-DD → day padded, month padded */
function toYMD(year: number, monthIdx: number, day: number) {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDisplay(str: string) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay() }

export function DateRangePicker({ checkIn, checkOut, onChangeCheckIn, onChangeCheckOut }: DateRangePickerProps) {
  const todayStr = getTodayStr()

  const [open, setOpen]           = useState(false)
  const [active, setActive]       = useState<'checkIn' | 'checkOut'>('checkIn')
  const [hover, setHover]         = useState<string | null>(null)
  const [viewYear, setViewYear]   = useState(() => {
    const d = checkIn ? new Date(checkIn) : new Date()
    return d.getFullYear()
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const d = checkIn ? new Date(checkIn) : new Date()
    return d.getMonth()
  })

  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const openPicker = (field: 'checkIn' | 'checkOut') => {
    setActive(field)
    const base = field === 'checkIn' ? checkIn : checkOut
    if (base) {
      const d = new Date(base)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    } else {
      const d = new Date()
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
    setOpen(true)
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const handleDateClick = (ds: string) => {
    if (ds < todayStr) return  // disabled

    if (active === 'checkIn') {
      onChangeCheckIn(ds)
      // Auto-advance checkout if needed
      if (!checkOut || checkOut <= ds) {
        const next = new Date(ds); next.setDate(next.getDate() + 1)
        onChangeCheckOut(next.toISOString().split('T')[0])
      }
      setActive('checkOut')
    } else {
      if (ds <= checkIn) {
        // Swap: picked before check-in → make it new check-in
        onChangeCheckIn(ds)
        const next = new Date(ds); next.setDate(next.getDate() + 1)
        onChangeCheckOut(next.toISOString().split('T')[0])
        setActive('checkOut')
      } else {
        onChangeCheckOut(ds)
        setOpen(false)
        setHover(null)
      }
    }
  }

  // Build calendar grid
  const dInMonth  = daysInMonth(viewYear, viewMonth)
  const firstDay  = firstDayOfMonth(viewYear, viewMonth)

  type Cell = { ds: string; day: number; current: boolean; disabled: boolean }
  const cells: Cell[] = []

  // Prev month filler
  const prevY = viewMonth === 0 ? viewYear - 1 : viewYear
  const prevM = viewMonth === 0 ? 11 : viewMonth - 1
  const dInPrev = daysInMonth(prevY, prevM)
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = dInPrev - i
    const ds  = toYMD(prevY, prevM, day)
    cells.push({ ds, day, current: false, disabled: true })
  }

  // Current month
  for (let d = 1; d <= dInMonth; d++) {
    const ds = toYMD(viewYear, viewMonth, d)
    cells.push({ ds, day: d, current: true, disabled: ds < todayStr })
  }

  // Next month filler
  const nextY = viewMonth === 11 ? viewYear + 1 : viewYear
  const nextM = viewMonth === 11 ? 0 : viewMonth + 1
  let nd = 1
  while (cells.length % 7 !== 0) {
    const ds = toYMD(nextY, nextM, nd)
    cells.push({ ds, day: nd, current: false, disabled: false })
    nd++
  }

  // Range logic
  const rangeEnd = active === 'checkOut' && hover ? hover : checkOut
  const isStart     = (ds: string) => ds === checkIn
  const isEnd       = (ds: string) => ds === rangeEnd
  const isInRange   = (ds: string) => {
    if (!checkIn || !rangeEnd) return false
    const [s, e] = checkIn < rangeEnd ? [checkIn, rangeEnd] : [rangeEnd, checkIn]
    return ds > s && ds < e
  }
  const isToday     = (ds: string) => ds === todayStr

  // Night count
  const nights = (() => {
    if (!checkIn || !checkOut) return 0
    const a = new Date(checkIn), b = new Date(checkOut)
    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000))
  })()

  return (
    <div className="flex gap-4 flex-1 w-full" ref={wrapRef}>

      {/* ── CHECK-IN field ── */}
      <button
        type="button"
        onClick={() => openPicker('checkIn')}
        className={`flex-1 w-full text-left rounded-2xl px-5 py-3.5 flex flex-col transition-all shadow-sm border cursor-pointer ${
          open && active === 'checkIn'
            ? 'border-rose-400 bg-rose-50/40 shadow-rose-100'
            : 'border-slate-100 bg-white hover:border-rose-200 hover:bg-rose-50/20'
        }`}
      >
        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">CHECK-IN</span>
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
          <span className={`text-sm font-bold ${checkIn ? 'text-slate-800' : 'text-slate-400'}`}>
            {checkIn ? formatDisplay(checkIn) : 'Pilih tanggal'}
          </span>
        </div>
      </button>

      {/* ── CHECK-OUT field ── */}
      <button
        type="button"
        onClick={() => openPicker('checkOut')}
        className={`flex-1 w-full text-left rounded-2xl px-5 py-3.5 flex flex-col transition-all shadow-sm border cursor-pointer ${
          open && active === 'checkOut'
            ? 'border-rose-400 bg-rose-50/40 shadow-rose-100'
            : 'border-slate-100 bg-white hover:border-rose-200 hover:bg-rose-50/20'
        }`}
      >
        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">CHECK-OUT</span>
        <div className="flex items-center gap-2.5">
          <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
          <span className={`text-sm font-bold ${checkOut ? 'text-slate-800' : 'text-slate-400'}`}>
            {checkOut ? formatDisplay(checkOut) : 'Pilih tanggal'}
          </span>
        </div>
      </button>

      {/* ── Calendar Popup ── */}
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+10px)] z-50 bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-300/40 overflow-hidden"
          style={{
            width: 'min(360px, 100vw - 32px)',
            animation: 'calSlideDown 0.2s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <style>{`
            @keyframes calSlideDown {
              from { opacity:0; transform:translateY(-10px) scale(0.97); transform-origin:top left; }
              to   { opacity:1; transform:translateY(0)    scale(1);     transform-origin:top left; }
            }
            .cal-day:hover:not(.cal-disabled) { background: #fff1f2; color: #e11d48; }
          `}</style>

          {/* Top: active mode indicator */}
          <div className="grid grid-cols-2 text-xs font-bold">
            <div
              className={`px-5 py-3 text-center border-b-2 transition-all ${
                active === 'checkIn'
                  ? 'border-rose-500 text-rose-600 bg-rose-50/60'
                  : 'border-transparent text-gray-400 bg-gray-50/60'
              }`}
            >
              <p className="text-[9px] uppercase tracking-widest font-extrabold mb-0.5 opacity-70">Check-In</p>
              <p className={active === 'checkIn' ? 'text-rose-600' : 'text-gray-500'}>
                {checkIn ? formatDisplay(checkIn) : '—'}
              </p>
            </div>
            <div
              className={`px-5 py-3 text-center border-b-2 transition-all ${
                active === 'checkOut'
                  ? 'border-rose-500 text-rose-600 bg-rose-50/60'
                  : 'border-transparent text-gray-400 bg-gray-50/60'
              }`}
            >
              <p className="text-[9px] uppercase tracking-widest font-extrabold mb-0.5 opacity-70">Check-Out</p>
              <p className={active === 'checkOut' ? 'text-rose-600' : 'text-gray-500'}>
                {checkOut ? formatDisplay(checkOut) : '—'}
              </p>
            </div>
          </div>

          {/* Night count */}
          {nights > 0 && (
            <div className="text-center py-1.5 bg-rose-500 text-white text-[11px] font-bold tracking-wide">
              {nights} Malam
            </div>
          )}

          {/* Month Navigation */}
          <div className="flex items-center justify-between px-5 py-4">
            <button
              type="button"
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-extrabold text-gray-800">
              {MONTHS_ID[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-4 mb-1">
            {DAYS_ID.map(d => (
              <div key={d} className="text-center text-[10px] font-extrabold text-gray-400 uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7 px-2 pb-4 gap-y-0.5">
            {cells.map((cell, i) => {
              const start  = isStart(cell.ds)
              const end    = isEnd(cell.ds)
              const range  = isInRange(cell.ds)
              const today_ = isToday(cell.ds)

              const isSelected = start || end

              let bg = ''
              let text = ''
              let ring = ''

              if (cell.disabled && !start && !end) {
                text = 'text-gray-300 cursor-not-allowed'
                bg   = ''
              } else if (isSelected) {
                bg   = 'bg-rose-500'
                text = 'text-white font-extrabold'
                ring = start && end ? '' : start ? 'rounded-r-none' : 'rounded-l-none'
              } else if (range) {
                bg   = 'bg-rose-100'
                text = 'text-rose-700 font-semibold'
              } else {
                text = cell.current ? 'text-gray-800' : 'text-gray-300'
              }



              return (
                <div
                  key={cell.ds}
                  className={`relative flex ${range || start || end ? '' : ''}`}
                >
                  {/* Range background (full width strip) */}
                  {range && (
                    <div className="absolute inset-y-0 inset-x-0 bg-rose-100 z-0" />
                  )}
                  {/* Start cap */}
                  {start && checkOut && checkOut > checkIn && (
                    <div className="absolute inset-y-0 right-0 w-1/2 bg-rose-100 z-0" />
                  )}
                  {/* End cap */}
                  {end && !start && checkIn && checkIn < (rangeEnd ?? '') && (
                    <div className="absolute inset-y-0 left-0 w-1/2 bg-rose-100 z-0" />
                  )}

                  <button
                    type="button"
                    disabled={cell.disabled && !start && !end}
                    onClick={() => handleDateClick(cell.ds)}
                    onMouseEnter={() => !cell.disabled && setHover(cell.ds)}
                    onMouseLeave={() => setHover(null)}
                    className={`cal-day relative z-10 w-full aspect-square flex items-center justify-center text-xs rounded-full transition-all duration-100 ${
                      isSelected
                        ? 'bg-rose-500 text-white font-extrabold shadow-md shadow-rose-300'
                        : range
                        ? 'text-rose-700 font-semibold hover:bg-rose-200'
                        : cell.disabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : cell.current
                        ? 'text-gray-800 hover:bg-rose-50 hover:text-rose-600 cursor-pointer'
                        : 'text-gray-300 cursor-pointer'
                    } ${today_ && !isSelected ? 'ring-1 ring-rose-400' : ''}`}
                  >
                    {cell.day}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <button
              type="button"
              onClick={() => {
                const t = getTodayStr()
                const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
                const tmrStr = tomorrow.toISOString().split('T')[0]
                onChangeCheckIn(t)
                onChangeCheckOut(tmrStr)
                setOpen(false)
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition cursor-pointer"
            >
              Hari ini
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm shadow-rose-200"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
