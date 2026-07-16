'use client';

import { useState, useRef, useEffect } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { ptBR } from 'react-day-picker/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const CARD   = '#181818';
const CARD2  = '#1F1F1F';
const BORDER = '#272727';
const RED    = '#E8001C';
const MUTED  = '#6B7280';
const WHITE  = '#FFFFFF';

export interface DateSelection {
  since:   string;
  until:   string;
  preset?: string;
  label:   string;
}

interface Preset {
  value:  string;
  label:  string;
  custom: () => { since: string; until: string };
}

function toISO(d: Date) {
  return d.toISOString().split('T')[0];
}

function today() { return new Date(); }

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date) {
  const r = new Date(d);
  const day = r.getDay();
  // Monday = start of week
  r.setDate(r.getDate() - ((day + 6) % 7));
  return r;
}

const PRESETS: Preset[] = [
  {
    value: 'today',
    label: 'Hoje',
    custom: () => { const d = toISO(today()); return { since: d, until: d }; },
  },
  {
    value: 'last_90d',
    label: 'Últimos 90 dias',
    custom: () => ({ since: toISO(addDays(today(), -89)), until: toISO(today()) }),
  },
  {
    value: 'yesterday',
    label: 'Ontem',
    custom: () => { const d = toISO(addDays(today(), -1)); return { since: d, until: d }; },
  },
  {
    value: 'this_week',
    label: 'Esta semana',
    custom: () => ({ since: toISO(startOfWeek(today())), until: toISO(today()) }),
  },
  {
    value: 'last_7d',
    label: 'Últimos 7 dias',
    custom: () => ({ since: toISO(addDays(today(), -6)), until: toISO(today()) }),
  },
  {
    value: 'last_week',
    label: 'Semana passada',
    custom: () => {
      const mon = startOfWeek(addDays(today(), -7));
      const sun = addDays(mon, 6);
      return { since: toISO(mon), until: toISO(sun) };
    },
  },
  {
    value: 'last_14d',
    label: 'Últimos 14 dias',
    custom: () => ({ since: toISO(addDays(today(), -13)), until: toISO(today()) }),
  },
  {
    value: 'last_month',
    label: 'Último mês',
    custom: () => {
      const d = today();
      const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
      const last  = new Date(d.getFullYear(), d.getMonth(), 0);
      return { since: toISO(first), until: toISO(last) };
    },
  },
  {
    value: 'last_30d',
    label: 'Últimos 30 dias',
    custom: () => ({ since: toISO(addDays(today(), -29)), until: toISO(today()) }),
  },
  {
    value: 'this_month',
    label: 'Mês atual',
    custom: () => {
      const d = today();
      const since = new Date(d.getFullYear(), d.getMonth(), 1);
      return { since: toISO(since), until: toISO(d) };
    },
  },
];

function formatDisplay(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function formatLabel(since: string, until: string): string {
  if (since === until) return formatDisplay(since);
  return `${formatDisplay(since)} – ${formatDisplay(until)}`;
}

interface Props {
  value:    DateSelection;
  onChange: (v: DateSelection) => void;
}

export default function DateRangePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  // staged selection (only committed on "Atualizar")
  const [staged, setStaged]       = useState<DateRange | undefined>(() => ({
    from: new Date(value.since + 'T12:00:00'),
    to:   new Date(value.until + 'T12:00:00'),
  }));
  const [stagedPreset, setStagedPreset] = useState<string | undefined>(value.preset);

  // Which month to show (left calendar)
  const [month, setMonth] = useState<Date>(() => {
    const d = new Date(value.until + 'T12:00:00');
    d.setMonth(d.getMonth() - 1);
    return d;
  });

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOut);
    return () => document.removeEventListener('mousedown', onOut);
  }, []);

  // Sync staged when dropdown opens
  function handleOpen() {
    setStaged({ from: new Date(value.since + 'T12:00:00'), to: new Date(value.until + 'T12:00:00') });
    setStagedPreset(value.preset);
    const d = new Date(value.until + 'T12:00:00');
    d.setMonth(d.getMonth() - 1);
    setMonth(d);
    setOpen(true);
  }

  function selectPreset(p: Preset) {
    const { since, until } = p.custom();
    setStaged({ from: new Date(since + 'T12:00:00'), to: new Date(until + 'T12:00:00') });
    setStagedPreset(p.value);
    // Navigate calendar to show the range
    const d = new Date(since + 'T12:00:00');
    setMonth(d);
  }

  function handleCalendarSelect(r: DateRange | undefined) {
    setStaged(r);
    setStagedPreset(undefined);
  }

  function apply() {
    if (!staged?.from) return;
    const since = toISO(staged.from);
    const until = staged.to ? toISO(staged.to) : since;
    const preset = stagedPreset;
    const presetObj = PRESETS.find(p => p.value === preset);
    const label = presetObj ? presetObj.label : formatLabel(since, until);
    onChange({ since, until, preset, label });
    setOpen(false);
  }

  // Display text on trigger
  const sinceDisplay = formatDisplay(value.since);
  const untilDisplay = formatDisplay(value.until);

  // Staged display
  const stagedSince = staged?.from ? toISO(staged.from) : '';
  const stagedUntil = staged?.to   ? toISO(staged.to)   : '';

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => open ? setOpen(false) : handleOpen()}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition hover:bg-white/5"
        style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, color: WHITE }}>
        <Calendar className="w-4 h-4 shrink-0" style={{ color: MUTED }} />
        <span className="whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {sinceDisplay}
        </span>
        <span style={{ color: MUTED }}>→</span>
        <span className="whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {untilDisplay}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-11 z-[200] rounded-2xl shadow-2xl overflow-hidden"
          style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, width: 720 }}>

          {/* Presets grid */}
          <div className="grid grid-cols-2 gap-x-0 gap-y-0 p-2 border-b" style={{ borderColor: BORDER }}>
            {PRESETS.map(p => {
              const active = stagedPreset === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => selectPreset(p)}
                  className="text-left px-4 py-2.5 text-sm rounded-lg transition-colors"
                  style={{
                    color:           active ? RED : WHITE,
                    backgroundColor: active ? 'rgba(232,0,28,0.08)' : 'transparent',
                    fontWeight:      active ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}>
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Dual calendar */}
          <div className="px-5 pt-4 pb-2">

            <style>{`
              .rdp-root {
                --rdp-accent-color: ${RED};
                --rdp-accent-background-color: rgba(232,0,28,0.18);
                --rdp-day-height: 44px;
                --rdp-day-width: 44px;
                --rdp-day_button-height: 40px;
                --rdp-day_button-width: 40px;
                --rdp-selected-border: none;
                color: #fff;
                font-size: 14px;
                width: 100%;
              }
              .rdp-months { display: flex; gap: 16px; width: 100%; }
              .rdp-month  { flex: 1; }
              .rdp-month_caption { color: #fff; font-weight: 700; font-size: 15px; text-align: center; padding-bottom: 8px; }
              .rdp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); }
              .rdp-weekday  { color: ${MUTED}; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; text-align: center; padding: 4px 0; }
              .rdp-week     { display: grid; grid-template-columns: repeat(7, 1fr); }
              .rdp-day      { color: #fff; display: flex; align-items: center; justify-content: center; }
              .rdp-day_button { border-radius: 50%; transition: background 0.15s; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
              .rdp-day:hover .rdp-day_button:not(:disabled) { background: rgba(255,255,255,0.1) !important; }
              .rdp-selected .rdp-day_button { background: ${RED} !important; color: #fff; border-radius: 50%; }
              .rdp-range_start .rdp-day_button { background: ${RED} !important; color: #fff; border-radius: 50%; }
              .rdp-range_end .rdp-day_button   { background: ${RED} !important; color: #fff; border-radius: 50%; }
              .rdp-range_middle .rdp-day_button { background: rgba(232,0,28,0.15) !important; border-radius: 0 !important; }
              .rdp-range_start { border-radius: 50% 0 0 50%; }
              .rdp-range_end   { border-radius: 0 50% 50% 0; }
              .rdp-outside  { opacity: 0.25; }
              .rdp-disabled { opacity: 0.2; }
              .rdp-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
              .rdp-button_previous, .rdp-button_next {
                color: ${MUTED};
                background: none;
                border: none;
                cursor: pointer;
                border-radius: 6px;
                padding: 6px;
                transition: background 0.15s, color 0.15s;
                display: flex;
                align-items: center;
              }
              .rdp-button_previous:hover, .rdp-button_next:hover {
                color: #fff;
                background: rgba(255,255,255,0.08);
              }
            `}</style>

            <DayPicker
              mode="range"
              selected={staged}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              locale={ptBR}
              month={month}
              onMonthChange={setMonth}
              disabled={{ after: today() }}
              captionLayout="label"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: BORDER }}>
            <span className="text-sm" style={{ color: MUTED }}>
              {stagedSince && stagedUntil
                ? `${formatDisplay(stagedSince)} – ${formatDisplay(stagedUntil)}`
                : stagedSince
                ? `De ${formatDisplay(stagedSince)} — selecione o fim`
                : 'Selecione um período'}
            </span>
            <button
              onClick={apply}
              disabled={!staged?.from}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity"
              style={{
                backgroundColor: RED,
                color: WHITE,
                opacity: staged?.from ? 1 : 0.4,
                cursor: staged?.from ? 'pointer' : 'not-allowed',
              }}>
              Atualizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
