'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import Navbar from '@/components/Navbar'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayForecast {
  dateStr: string   // YYYY-MM-DD
  label: string     // "Heute", "Morgen", "Mo 7 Apr", etc.
  count: number     // reviews due that day
}

interface DayActivity {
  dateStr: string
  count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** YYYY-MM-DD for a date offset by `offset` days from today. */
function offsetDateStr(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  const y   = d.getFullYear()
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mon}-${day}`
}

/** Human-readable label for a date offset from today. */
function dayLabel(offset: number, dateStr: string): string {
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  const d = new Date(dateStr + 'T12:00:00')  // noon avoids timezone flips
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

/** English short weekday name for a YYYY-MM-DD string. */
function shortWeekday(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

/** Returns past-N-days date strings, oldest first. */
function pastDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => offsetDateStr(-(n - 1 - i)))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Horizontal bar for the forecast chart. */
function ForecastBar({ label, count, max, isToday }: {
  label: string; count: number; max: number; isToday: boolean
}) {
  const pct = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0
  return (
    <div className="flex items-center gap-3">
      {/* Day label */}
      <div className={`text-sm w-28 shrink-0 ${isToday ? 'text-[#9b8cf5] font-bold' : 'text-[#9b98b0]'}`}>
        {label}
      </div>
      {/* Bar */}
      <div className="flex-1 h-6 bg-white/5 rounded-lg overflow-hidden relative">
        <div
          className={`h-full rounded-lg transition-all duration-700 ${
            isToday ? 'bg-[#7c6df2]' : 'bg-[#7c6df2]/40'
          }`}
          style={{ width: count === 0 ? '0%' : `${pct}%` }}
        />
      </div>
      {/* Count */}
      <div className={`text-sm font-bold w-10 text-right shrink-0 ${
        count > 0 ? (isToday ? 'text-[#9b8cf5]' : 'text-[#e8e6f0]') : 'text-[#9b98b0]'
      }`}>
        {count}
      </div>
    </div>
  )
}

/** 21-day activity grid — each cell is a dot, darker = more reviews. */
function ActivityGrid({ data }: { data: DayActivity[] }) {
  const today = offsetDateStr(0)
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <div>
      {/* Day-of-week header */}
      <div className="flex gap-1 mb-1 pl-0">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="flex-1 text-center text-[10px] text-[#9b98b0]">{d}</div>
        ))}
      </div>
      {/* 3 rows of 7 days = 21 days */}
      <div className="space-y-1">
        {[0, 7, 14].map(rowStart => (
          <div key={rowStart} className="flex gap-1">
            {data.slice(rowStart, rowStart + 7).map(day => {
              const intensity = day.count > 0 ? Math.max(0.25, day.count / maxCount) : 0
              const isToday   = day.dateStr === today
              return (
                <div
                  key={day.dateStr}
                  className={`flex-1 aspect-square rounded-md transition-all ${
                    isToday ? 'ring-1 ring-[#7c6df2]' : ''
                  }`}
                  style={{
                    backgroundColor: day.count > 0
                      ? `rgba(124, 109, 242, ${intensity})`
                      : 'rgba(255,255,255,0.04)',
                  }}
                  title={`${day.dateStr}: ${day.count} Reviews`}
                />
              )
            })}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-[#9b98b0]">Less</span>
        {[0.1, 0.3, 0.5, 0.75, 1].map(op => (
          <div
            key={op}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: `rgba(124, 109, 242, ${op})` }}
          />
        ))}
        <span className="text-[10px] text-[#9b98b0]">More</span>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ForecastPage() {
  const [loading, setLoading]           = useState(true)
  const [forecast, setForecast]         = useState<DayForecast[]>([])
  const [activity, setActivity]         = useState<DayActivity[]>([])
  const [totalUpcoming, setTotalUpcoming] = useState(0)
  const [totalDue, setTotalDue]         = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const sessionId = getOrCreateSessionId()
        const now        = new Date()

        // ── Upcoming reviews: next 7 days ────────────────────────────────────
        const sevenDaysLater = new Date(now.getTime() + 7 * 86400000)
        const { data: upcomingRows } = await supabase
          .from('gwc_grammar_reviews')
          .select('next_review_at')
          .eq('session_id', sessionId)
          .gte('next_review_at', now.toISOString())
          .lte('next_review_at', sevenDaysLater.toISOString())

        // Also count reviews due NOW (already overdue / due today)
        const { count: dueNow } = await supabase
          .from('gwc_grammar_reviews')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', sessionId)
          .lte('next_review_at', now.toISOString())

        setTotalDue(dueNow ?? 0)

        // Group upcoming by date
        const countsByDate: Record<string, number> = {}
        for (let i = 0; i < 7; i++) {
          const d = offsetDateStr(i)
          countsByDate[d] = 0
        }
        ;(upcomingRows || []).forEach(r => {
          const d = (r.next_review_at as string).slice(0, 10)
          if (d in countsByDate) countsByDate[d]++
        })

        const forecastArr: DayForecast[] = Object.entries(countsByDate).map(([dateStr, count], i) => ({
          dateStr,
          label: dayLabel(i, dateStr),
          count,
        }))

        setForecast(forecastArr)
        setTotalUpcoming((upcomingRows || []).length)

        // ── Past 21 days activity ────────────────────────────────────────────
        const past21 = pastDays(21)
        const oldestDate = past21[0]

        const { data: pastRows } = await supabase
          .from('gwc_grammar_reviews')
          .select('updated_at')
          .eq('session_id', sessionId)
          .gte('updated_at', oldestDate + 'T00:00:00')
          .lte('updated_at', now.toISOString())

        // Count by date
        const activityMap: Record<string, number> = {}
        past21.forEach(d => { activityMap[d] = 0 })
        ;(pastRows || []).forEach(r => {
          const d = (r.updated_at as string).slice(0, 10)
          if (d in activityMap) activityMap[d]++
        })

        // Align to start on Monday — pad the beginning if needed
        const firstDow = new Date(past21[0] + 'T12:00:00').getDay()  // 0=Sun
        const padDays  = (firstDow + 6) % 7   // how many empty cells before Monday
        const paddedActivity: DayActivity[] = [
          ...Array.from({ length: padDays }, (_, i) => ({
            dateStr: `pad-${i}`,
            count: 0,
          })),
          ...past21.map(d => ({ dateStr: d, count: activityMap[d] })),
        ]

        // Keep exactly 21 cells (trim from front if needed due to padding)
        setActivity(paddedActivity.slice(-21))

      } catch (e) {
        console.error('Forecast load error:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const maxCount = forecast.reduce((m, d) => Math.max(m, d.count), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 py-10 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-[#e8e6f0] mb-1">Forecast</h1>
          <p className="text-[#9b98b0] text-sm">Upcoming reviews and activity</p>
        </div>

        {/* ── Due now badge ────────────────────────────────────────────────── */}
        {totalDue > 0 && (
          <Link
            href="/review"
            className="flex items-center justify-between bg-orange-500/10 border border-orange-500/30 rounded-2xl px-5 py-4 hover:bg-orange-500/15 transition-colors"
          >
            <div>
              <p className="text-orange-400 font-bold">{totalDue} reviews due!</p>
              <p className="text-orange-400/70 text-sm">Start now →</p>
            </div>
            <span className="text-2xl">⏰</span>
          </Link>
        )}

        {/* ── Upcoming 7 days ───────────────────────────────────────────────── */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#e8e6f0]">Next 7 days</h2>
            <span className="text-sm text-[#9b98b0]">{totalUpcoming} reviews scheduled</span>
          </div>

          {forecast.length === 0 ? (
            <p className="text-[#9b98b0] text-sm text-center py-6">
              No reviews scheduled. Time to learn new words!
            </p>
          ) : (
            <div className="space-y-3">
              {forecast.map((day, i) => (
                <ForecastBar
                  key={day.dateStr}
                  label={day.label}
                  count={day.count}
                  max={maxCount}
                  isToday={i === 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Activity grid (21 days) ───────────────────────────────────────── */}
        <div className="bg-[#1a1830] rounded-2xl p-6 border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-[#e8e6f0]">Activity</h2>
            <span className="text-sm text-[#9b98b0]">Last 21 days</span>
          </div>
          <ActivityGrid data={activity} />
        </div>

        {/* ── Quick nav ──────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Link
            href="/review"
            className="flex-1 py-3 rounded-xl bg-[#7c6df2] text-white font-bold text-center hover:bg-[#6b5de0] transition-colors"
          >
            Start reviews
          </Link>
          <Link
            href="/profile"
            className="flex-1 py-3 rounded-xl bg-white/5 text-[#e8e6f0] font-bold text-center hover:bg-white/10 transition-colors border border-white/5"
          >
            Profile
          </Link>
        </div>

      </div>
    </div>
  )
}
