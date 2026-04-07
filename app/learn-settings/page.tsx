'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getOrCreateSessionId } from '@/lib/session'
import { ALL_PATHS, getPathById, type PathDef } from '@/lib/paths'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserPath {
  id: string
  session_id: string
  path_id: string
  queue_position: number
  daily_goal: number
  batch_size: number
  lesson_order: string
  active: boolean
}

// UserPath combined with its static PathDef for display
interface UserPathWithDef extends UserPath {
  def: PathDef
}

// ─── Per-Path Settings Modal ──────────────────────────────────────────────────

interface PathSettingsModalProps {
  userPath: UserPathWithDef
  onClose: () => void
  onUpdate: (changes: Partial<UserPath>) => void
  onRemove: () => void
}

function PathSettingsModal({ userPath, onClose, onUpdate, onRemove }: PathSettingsModalProps) {
  const [tab, setTab] = useState<'overview' | 'learn' | 'review'>('overview')

  // Local copies of editable settings (synced to DB on change)
  const [dailyGoal, setDailyGoal]     = useState(userPath.daily_goal)
  const [batchSize, setBatchSize]     = useState(userPath.batch_size)
  const [lessonOrder, setLessonOrder] = useState(userPath.lesson_order)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)  // shows "Saved!" briefly after saving
  const [confirmRemove, setConfirmRemove] = useState(false)

  // Save a partial update to Supabase and notify parent
  async function save(changes: Partial<UserPath>) {
    setSaving(true)
    await supabase
      .from('gwc_user_paths')
      .update({ ...changes, updated_at: new Date().toISOString() })
      .eq('id', userPath.id)
    setSaving(false)
    onUpdate(changes)
  }

  // Save dailyGoal + batchSize together when user clicks "Save Changes"
  async function saveChanges() {
    setSaving(true)
    setSaved(false)
    await supabase
      .from('gwc_user_paths')
      .update({ daily_goal: dailyGoal, batch_size: batchSize, updated_at: new Date().toISOString() })
      .eq('id', userPath.id)
    setSaving(false)
    onUpdate({ daily_goal: dailyGoal, batch_size: batchSize })
    // Show "Saved!" for 2 seconds
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative z-10 w-full sm:max-w-md bg-[#1a1830] rounded-t-2xl sm:rounded-2xl border border-white/10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{userPath.def.icon}</span>
            <div>
              <p className="font-bold text-[#e8e6f0]">{userPath.def.name}</p>
              <p className="text-xs text-[#9b98b0]">{userPath.def.level} · {userPath.def.badge}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-white/5">
          {(['overview', 'learn', 'review'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'text-[#9b8cf5] border-[#7c6df2]'
                  : 'text-[#9b98b0] border-transparent hover:text-[#e8e6f0]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 py-5">

          {/* ── Overview tab ── */}
          {tab === 'overview' && (
            <div className="space-y-6">

              {/* Daily Goal */}
              <div>
                <p className="text-sm font-medium text-[#e8e6f0] mb-0.5">Daily New Cards</p>
                <p className="text-xs text-[#9b98b0] mb-4">New sentences to learn per day from this deck.</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setDailyGoal(v => Math.max(1, v - 1))}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#e8e6f0] hover:bg-white/10 transition-colors text-xl font-bold"
                  >
                    −
                  </button>
                  <span className="text-3xl font-bold text-[#e8e6f0] w-14 text-center tabular-nums">{dailyGoal}</span>
                  <button
                    onClick={() => setDailyGoal(v => Math.min(100, v + 1))}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#e8e6f0] hover:bg-white/10 transition-colors text-xl font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-[#9b98b0]">per day</span>
                </div>
              </div>

              {/* Batch Size */}
              <div>
                <p className="text-sm font-medium text-[#e8e6f0] mb-0.5">Batch Size</p>
                <p className="text-xs text-[#9b98b0] mb-4">How many new items to teach per learn session.</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setBatchSize(v => Math.max(1, v - 1))}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#e8e6f0] hover:bg-white/10 transition-colors text-xl font-bold"
                  >
                    −
                  </button>
                  <span className="text-3xl font-bold text-[#e8e6f0] w-14 text-center tabular-nums">{batchSize}</span>
                  <button
                    onClick={() => setBatchSize(v => Math.min(20, v + 1))}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#e8e6f0] hover:bg-white/10 transition-colors text-xl font-bold"
                  >
                    +
                  </button>
                  <span className="text-sm text-[#9b98b0]">items</span>
                </div>
              </div>

              {/* Save Changes — persists daily_goal + batch_size to DB */}
              <button
                onClick={saveChanges}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-[#7c6df2] hover:bg-[#9b8cf5] disabled:opacity-60 transition-colors text-white text-sm font-semibold"
              >
                {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
              </button>

              {/* Remove from queue */}
              {!confirmRemove ? (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
                >
                  Remove from Learn Queue
                </button>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                  <p className="text-sm text-red-300 mb-3 text-center">Remove this deck from your queue?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmRemove(false)}
                      className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-[#9b98b0] text-sm hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onRemove}
                      className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm hover:bg-red-500/30 transition-colors font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Learn tab ── */}
          {tab === 'learn' && (
            <div>
              <p className="text-sm font-medium text-[#e8e6f0] mb-0.5">Lesson Order</p>
              <p className="text-xs text-[#9b98b0] mb-4">How new items are ordered when you learn them.</p>
              <div className="space-y-2">
                {[
                  { value: 'default',      label: 'Default Order',  desc: 'Follow the recommended teaching order' },
                  { value: 'alphabetical', label: 'Alphabetical',   desc: 'Items sorted A → Z' },
                  { value: 'frequency',    label: 'By Frequency',   desc: 'Most common words first' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setLessonOrder(opt.value); save({ lesson_order: opt.value }) }}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      lessonOrder === opt.value
                        ? 'border-[#7c6df2]/60 bg-[#7c6df2]/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio circle */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        lessonOrder === opt.value ? 'border-[#7c6df2]' : 'border-white/30'
                      }`}>
                        {lessonOrder === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-[#7c6df2]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#e8e6f0]">{opt.label}</p>
                        <p className="text-xs text-[#9b98b0]">{opt.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Review tab ── */}
          {tab === 'review' && (
            <div className="text-center py-10">
              <p className="text-3xl mb-3">⚙️</p>
              <p className="text-[#e8e6f0] font-medium mb-1">Review Settings</p>
              <p className="text-sm text-[#9b98b0]">Per-deck review settings coming soon.</p>
            </div>
          )}
        </div>

        {/* Saving indicator */}
        {saving && (
          <div className="px-5 pb-4 text-center">
            <p className="text-xs text-[#9b98b0]">Saving…</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Add Deck Sheet ───────────────────────────────────────────────────────────

interface AddDeckSheetProps {
  activePaths: UserPathWithDef[]
  onAdd: (pathId: string) => Promise<void>
  onClose: () => void
}

function AddDeckSheet({ activePaths, onAdd, onClose }: AddDeckSheetProps) {
  const activeIds = new Set(activePaths.map(p => p.path_id))
  const available = ALL_PATHS.filter(p => !activeIds.has(p.id))
  const [adding, setAdding] = useState<string | null>(null)

  async function handleAdd(pathId: string) {
    setAdding(pathId)
    await onAdd(pathId)
    setAdding(null)
    onClose()
  }

  const typeColor = (type: string) =>
    type === 'mixed'   ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25' :
    type === 'grammar' ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' :
    type === 'verb'    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' :
                         'bg-green-500/15 text-green-300 border-green-500/25'

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full sm:max-w-md bg-[#1a1830] rounded-t-2xl sm:rounded-2xl border border-white/10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/5">
          <p className="font-bold text-[#e8e6f0]">Add a Deck</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/5 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {available.length === 0 ? (
            <p className="text-[#9b98b0] text-sm text-center py-6">No more paths available.</p>
          ) : (
            available.map(path => (
              <button
                key={path.id}
                onClick={() => handleAdd(path.id)}
                disabled={!!adding}
                className="w-full text-left p-4 rounded-xl border border-white/10 bg-white/5 hover:border-[#7c6df2]/40 hover:bg-[#7c6df2]/5 transition-all disabled:opacity-50"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{path.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-[#e8e6f0]">{path.name}</p>
                      <span className="text-xs border border-white/15 text-[#9b98b0] px-1.5 py-0.5 rounded-md shrink-0">{path.level}</span>
                      <span className={`text-xs border px-1.5 py-0.5 rounded-md shrink-0 ${typeColor(path.type)}`}>
                        {path.type === 'mixed' ? 'Mixed' : path.type === 'grammar' ? 'Grammar' : path.type === 'verb' ? 'Verbs' : 'Vocab'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9b98b0] leading-relaxed">{path.description}</p>
                  </div>
                  <div className="shrink-0 mt-0.5">
                    {adding === path.id ? (
                      <div className="w-5 h-5 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-[#7c6df2] text-xl font-bold">+</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Path Row ─────────────────────────────────────────────────────────────────

function PathRow({
  userPath,
  position,
  onOpenSettings,
}: {
  userPath: UserPathWithDef
  position: number
  onOpenSettings: () => void
}) {
  const typeColor =
    userPath.def.type === 'mixed'   ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25' :
    userPath.def.type === 'grammar' ? 'bg-blue-500/15 text-blue-300 border-blue-500/25' :
    userPath.def.type === 'verb'    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' :
                                      'bg-green-500/15 text-green-300 border-green-500/25'

  const typeLabel =
    userPath.def.type === 'mixed'   ? 'Mixed' :
    userPath.def.type === 'grammar' ? 'Grammar' :
    userPath.def.type === 'verb'    ? 'Verbs' : 'Vocab'

  return (
    <div className="flex items-center gap-3 bg-[#252340] rounded-xl p-4 border border-white/5">
      {/* Queue position number */}
      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm font-bold text-[#9b98b0] shrink-0">
        {position}
      </div>

      {/* Icon + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl shrink-0">{userPath.def.icon}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-bold text-[#e8e6f0] truncate">{userPath.def.name}</p>
            <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-medium border ${typeColor}`}>
              {typeLabel}
            </span>
          </div>
          <p className="text-xs text-[#9b98b0]">
            {userPath.daily_goal} new/day · Batch: {userPath.batch_size}
          </p>
        </div>
      </div>

      {/* Settings gear button */}
      <button
        onClick={onOpenSettings}
        className="p-2 rounded-lg text-[#9b98b0] hover:text-[#e8e6f0] hover:bg-white/5 transition-colors shrink-0"
        title="Path settings"
      >
        <span className="text-base">⚙️</span>
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LearnSettingsPage() {
  const [tab, setTab]               = useState<'queue' | 'general'>('queue')
  const [paths, setPaths]           = useState<UserPathWithDef[]>([])
  const [loading, setLoading]       = useState(true)
  const [settingsPath, setSettingsPath] = useState<UserPathWithDef | null>(null)
  const [showAddDeck, setShowAddDeck]   = useState(false)

  useEffect(() => {
    loadPaths()
  }, [])

  // Fetch this user's active paths from Supabase
  async function loadPaths() {
    setLoading(true)
    const sessionId = getOrCreateSessionId()
    const { data } = await supabase
      .from('gwc_user_paths')
      .select('*')
      .eq('session_id', sessionId)
      .eq('active', true)
      .order('queue_position', { ascending: true })

    if (data) {
      const withDefs = (data as UserPath[])
        .map(p => {
          const def = getPathById(p.path_id)
          return def ? { ...p, def } : null
        })
        .filter(Boolean) as UserPathWithDef[]
      setPaths(withDefs)
    }
    setLoading(false)
  }

  // Add a new path to the queue
  async function handleAddPath(pathId: string) {
    const sessionId = getOrCreateSessionId()
    const nextPosition = paths.length + 1

    // upsert: if this path was previously removed, re-activate it
    await supabase.from('gwc_user_paths').upsert(
      {
        session_id:     sessionId,
        path_id:        pathId,
        queue_position: nextPosition,
        daily_goal:     10,
        batch_size:     5,
        lesson_order:   'default',
        active:         true,
        updated_at:     new Date().toISOString(),
      },
      { onConflict: 'session_id,path_id' }
    )
    await loadPaths()
  }

  // Remove a path from the queue (delete the row)
  async function handleRemovePath(userPath: UserPathWithDef) {
    await supabase
      .from('gwc_user_paths')
      .delete()
      .eq('id', userPath.id)
    setSettingsPath(null)
    await loadPaths()
  }

  // Update a path's settings in local state after a save
  function handleUpdatePath(userPath: UserPathWithDef, changes: Partial<UserPath>) {
    setPaths(prev => prev.map(p => p.id === userPath.id ? { ...p, ...changes } : p))
    // Also update the modal's copy so the UI reflects the change immediately
    setSettingsPath(prev => prev && prev.id === userPath.id ? { ...prev, ...changes } : prev)
  }

  return (
    <div className="min-h-screen bg-[#0f0e17]">
      <div className="max-w-2xl mx-auto px-5 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-[#9b98b0] hover:text-[#e8e6f0] text-sm transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[#e8e6f0] mt-4 mb-1">Learn Queue</h1>
          <p className="text-[#9b98b0] text-sm">Manage your active decks and learning settings.</p>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-white/10 mb-6">
          {(['queue', 'general'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'text-[#9b8cf5] border-[#7c6df2]'
                  : 'text-[#9b98b0] border-transparent hover:text-[#e8e6f0]'
              }`}
            >
              {t === 'queue' ? 'Queue' : 'General'}
            </button>
          ))}
        </div>

        {/* ── Queue Tab ── */}
        {tab === 'queue' && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-[#7c6df2] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* Active path rows */}
                {paths.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {paths.map((p, i) => (
                      <PathRow
                        key={p.id}
                        userPath={p}
                        position={i + 1}
                        onOpenSettings={() => setSettingsPath(p)}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state */}
                {paths.length === 0 && (
                  <div className="text-center py-12 bg-[#1a1830] rounded-2xl border border-white/5 mb-4">
                    <p className="text-4xl mb-3">📚</p>
                    <p className="text-[#e8e6f0] font-medium mb-1">No decks in your queue</p>
                    <p className="text-sm text-[#9b98b0]">Add a deck below to start learning.</p>
                  </div>
                )}

                {/* Add Deck button — only shown when < 2 active paths */}
                {paths.length < 2 && (
                  <button
                    onClick={() => setShowAddDeck(true)}
                    className="w-full py-3 rounded-xl border border-dashed border-white/20 text-[#9b98b0] hover:text-[#e8e6f0] hover:border-[#7c6df2]/40 transition-colors text-sm font-medium"
                  >
                    + Add Deck
                  </button>
                )}

                {/* Max 2 notice */}
                {paths.length >= 2 && (
                  <p className="text-xs text-[#9b98b0] text-center mt-3">
                    Maximum 2 active decks. Remove one to add another.
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ── General Tab ── */}
        {tab === 'general' && (
          <div className="bg-[#1a1830] rounded-2xl p-8 border border-white/5 text-center">
            <p className="text-4xl mb-3">⚙️</p>
            <p className="text-[#e8e6f0] font-medium mb-1">Global Settings</p>
            <p className="text-sm text-[#9b98b0]">Global learn settings coming soon.</p>
          </div>
        )}

      </div>

      {/* ── Per-path Settings Modal ── */}
      {settingsPath && (
        <PathSettingsModal
          userPath={settingsPath}
          onClose={() => setSettingsPath(null)}
          onUpdate={(changes) => handleUpdatePath(settingsPath, changes)}
          onRemove={() => handleRemovePath(settingsPath)}
        />
      )}

      {/* ── Add Deck Sheet ── */}
      {showAddDeck && (
        <AddDeckSheet
          activePaths={paths}
          onAdd={handleAddPath}
          onClose={() => setShowAddDeck(false)}
        />
      )}
    </div>
  )
}
