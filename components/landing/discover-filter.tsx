'use client'

import { useState, useRef, useEffect } from 'react'
import { Filter, Users, Baby, ChevronDown, X, RotateCcw, Check, ArrowUpDown } from 'lucide-react'

interface FilterState {
  adults: number
  children: number
  minPrice: number
  maxPrice: number
  roomType: string
  sortBy: string
}

interface FilterPanelProps {
  filters: FilterState
  onApplyFilters: (filters: FilterState) => void
  roomTypes: Array<{ name: string }>
}

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
  { value: 'name-asc', label: 'Nama A–Z' },
  { value: 'area-desc', label: 'Area Terluas' },
]

export function DiscoverFilter({ filters, onApplyFilters, roomTypes }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sync local filters when parent filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  const handleApply = () => {
    onApplyFilters(localFilters)
    setIsOpen(false)
  }

  const handleReset = () => {
    const reset: FilterState = {
      adults: 1,
      children: 0,
      minPrice: 0,
      maxPrice: 5000000,
      roomType: 'all',
      sortBy: 'price-asc',
    }
    setLocalFilters(reset)
    onApplyFilters(reset)
    setIsOpen(false)
  }

  const hasActive =
    localFilters.adults > 1 ||
    localFilters.children > 0 ||
    localFilters.roomType !== 'all' ||
    localFilters.minPrice > 0 ||
    localFilters.maxPrice < 5000000

  const currentSort = SORT_OPTIONS.find(o => o.value === localFilters.sortBy)?.label || 'Urutkan'

  return (
    <div className="relative" ref={panelRef}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center justify-center gap-2 px-6 py-4 text-sm font-bold rounded-2xl border-none transition-all cursor-pointer shrink-0 ${
          isOpen || hasActive
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-300 scale-[0.98]'
            : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filter</span>
        {hasActive ? (
          <span className="w-2 h-2 bg-white rounded-full animate-pulse ml-0.5" />
        ) : (
          <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* ── Dropdown Panel ── */}
      {isOpen && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(480px,90vw)] bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/60 overflow-hidden"
          style={{
            animation: 'filterSlideDown 0.22s cubic-bezier(0.16,1,0.3,1) both',
          }}
        >
          <style>{`
            @keyframes filterSlideDown {
              from { opacity: 0; transform: translateY(-12px) scaleY(0.95); transform-origin: top; }
              to   { opacity: 1; transform: translateY(0)   scaleY(1);    transform-origin: top; }
            }
          `}</style>

          {/* Panel Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-100 rounded-lg">
                <Filter className="w-4 h-4 text-rose-500" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Filter &amp; Urutkan</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {/* ── Jumlah Tamu ── */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Jumlah Tamu</h4>
              <div className="grid grid-cols-2 gap-3">
                {/* Dewasa */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <Users className="w-3.5 h-3.5 text-rose-400" />
                    Dewasa
                  </label>
                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setLocalFilters(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 font-bold text-base transition cursor-pointer border-0 bg-transparent"
                    >−</button>
                    <span className="flex-1 text-center font-extrabold text-gray-900 text-sm">{localFilters.adults}</span>
                    <button
                      type="button"
                      onClick={() => setLocalFilters(p => ({ ...p, adults: Math.min(6, p.adults + 1) }))}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 font-bold text-base transition cursor-pointer border-0 bg-transparent"
                    >+</button>
                  </div>
                </div>
                {/* Anak-anak */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <Baby className="w-3.5 h-3.5 text-rose-400" />
                    Anak-anak
                  </label>
                  <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setLocalFilters(p => ({ ...p, children: Math.max(0, p.children - 1) }))}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 font-bold text-base transition cursor-pointer border-0 bg-transparent"
                    >−</button>
                    <span className="flex-1 text-center font-extrabold text-gray-900 text-sm">{localFilters.children}</span>
                    <button
                      type="button"
                      onClick={() => setLocalFilters(p => ({ ...p, children: Math.min(4, p.children + 1) }))}
                      className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 font-bold text-base transition cursor-pointer border-0 bg-transparent"
                    >+</button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Tipe Kamar ── */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Tipe Kamar</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLocalFilters(p => ({ ...p, roomType: 'all' }))}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    localFilters.roomType === 'all'
                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-500'
                  }`}
                >
                  {localFilters.roomType === 'all' && <Check className="w-3 h-3" />}
                  Semua Kamar
                </button>
                {roomTypes.map((rt: any) => (
                  <button
                    key={rt.name}
                    type="button"
                    onClick={() => setLocalFilters(p => ({ ...p, roomType: rt.name }))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      localFilters.roomType === rt.name
                        ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-500'
                    }`}
                  >
                    {localFilters.roomType === rt.name && <Check className="w-3 h-3" />}
                    {rt.name}
                  </button>
                ))}
              </div>
            </section>

            {/* ── Rentang Harga ── */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Harga / Malam</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400">Minimal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">Rp</span>
                    <input
                      type="number"
                      value={localFilters.minPrice}
                      onChange={e => setLocalFilters(p => ({ ...p, minPrice: Number(e.target.value) }))}
                      className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:border-rose-400 focus:outline-none focus:bg-white transition"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-gray-400">Maksimal</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">Rp</span>
                    <input
                      type="number"
                      value={localFilters.maxPrice}
                      onChange={e => setLocalFilters(p => ({ ...p, maxPrice: Number(e.target.value) }))}
                      className="w-full pl-8 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:border-rose-400 focus:outline-none focus:bg-white transition"
                      placeholder="5000000"
                      min={0}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Urutkan — custom styled select ── */}
            <section className="space-y-3">
              <h4 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Urutkan
              </h4>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLocalFilters(p => ({ ...p, sortBy: opt.value }))}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      localFilters.sortBy === opt.value
                        ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                    }`}
                  >
                    {localFilters.sortBy === opt.value && <Check className="w-3 h-3" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* ── Footer Buttons ── */}
          <div className="flex gap-3 px-5 py-4 border-t border-gray-100 bg-gray-50/70">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Atur Ulang
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md shadow-rose-200 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              Terapkan Filter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
