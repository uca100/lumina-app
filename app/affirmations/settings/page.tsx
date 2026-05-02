'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Item } from '@/components/ItemCard'
import { isRTL } from '@/lib/utils/rtl'

interface Reminder {
  id: string
  label: string
  hour: number
  minute: number
  typesFilter: string[]
  mode: string
  enabled: number
}

async function saveOrder(order: string[]) {
  await fetch('/lumina/api/affirmations/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order }),
  })
}

async function setPinned(id: string, pinned: number, item: Item) {
  await fetch(`/lumina/api/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...item, pinned }),
  })
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    Affirmation: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    Quote: 'text-sky-600 bg-sky-50 border-sky-200',
    Thought: 'text-amber-600 bg-amber-50 border-amber-200',
    Lesson: 'text-rose-600 bg-rose-50 border-rose-200',
    Habit: 'text-teal-600 bg-teal-50 border-teal-200',
    Story: 'text-violet-600 bg-violet-50 border-violet-200',
    Pattern: 'text-orange-600 bg-orange-50 border-orange-200',
  }
  return map[type] ?? 'text-stone-500 bg-stone-50 border-stone-200'
}

function ItemRow({ item, actions }: { item: Item; actions: React.ReactNode }) {
  const bodyRTL = isRTL(item.body)
  return (
    <div className="flex items-start gap-3 bg-white/60 border border-stone-200 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${typeColor(item.type)}`}>
            {item.type}
          </span>
          {item.title && (
            <span className={`text-xs text-stone-400 truncate${isRTL(item.title) ? ' rtl-text' : ''}`}>
              {item.title}
            </span>
          )}
        </div>
        <p
          dir={bodyRTL ? 'rtl' : 'ltr'}
          className={`text-sm text-stone-700 font-serif leading-snug line-clamp-2${bodyRTL ? ' text-right rtl-text' : ''}`}
        >
          {item.body}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">{actions}</div>
    </div>
  )
}

export default function AffirmationsSettingsPage() {
  const [allItems, setAllItems] = useState<Item[]>([])
  const [order, setOrder] = useState<string[]>([])
  const [reminder, setReminder] = useState<Reminder | null>(null)
  const [reminderTime, setReminderTime] = useState('08:00')
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSaved, setNotifSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/lumina/api/items').then((r) => r.json()),
      fetch('/lumina/api/affirmations/order').then((r) => r.json()),
      fetch('/lumina/api/reminders').then((r) => r.json()),
    ]).then(([itemsData, orderData, remindersData]: [Item[], { order: string[] }, { schedules: Reminder[] }]) => {
      setAllItems(itemsData)
      setOrder(orderData.order)
      // Find the affirmation daily reminder
      const affReminder = remindersData.schedules.find(
        (r) => r.typesFilter.includes('Affirmation') && r.mode === 'fixed'
      ) ?? null
      if (affReminder) {
        setReminder(affReminder)
        setReminderTime(`${String(affReminder.hour).padStart(2, '0')}:${String(affReminder.minute).padStart(2, '0')}`)
        setReminderEnabled(affReminder.enabled === 1)
      }
      setLoading(false)
    })
  }, [])

  const pinned = allItems.filter((a) => a.pinned === 1)
  const unpinned = allItems.filter((a) => a.pinned !== 1)
  const randomPool = unpinned.filter((a) => a.type === 'Affirmation')

  const orderedPinned = [
    ...order.map((id) => pinned.find((a) => a.id === id)).filter(Boolean) as Item[],
    ...pinned.filter((a) => !order.includes(a.id)),
  ]

  async function add(item: Item) {
    setSaving(item.id)
    await setPinned(item.id, 1, item)
    const newOrder = [...order, item.id]
    await saveOrder(newOrder)
    setAllItems((prev) => prev.map((a) => a.id === item.id ? { ...a, pinned: 1 } : a))
    setOrder(newOrder)
    setSaving(null)
  }

  async function remove(item: Item) {
    setSaving(item.id)
    await setPinned(item.id, 0, item)
    const newOrder = order.filter((id) => id !== item.id)
    await saveOrder(newOrder)
    setAllItems((prev) => prev.map((a) => a.id === item.id ? { ...a, pinned: 0 } : a))
    setOrder(newOrder)
    setSaving(null)
  }

  async function move(itemId: string, direction: 'up' | 'down') {
    const currentOrder = orderedPinned.map((a) => a.id)
    const idx = currentOrder.indexOf(itemId)
    if (idx < 0) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= currentOrder.length) return
    const newOrder = [...currentOrder]
    ;[newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]]
    setOrder(newOrder)
    await saveOrder(newOrder)
  }

  async function saveNotification() {
    setNotifSaving(true)
    const [h, m] = reminderTime.split(':').map(Number)
    const payload = {
      label: 'Daily Affirmation',
      hour: h,
      minute: m,
      mode: 'fixed',
      typesFilter: ['Affirmation'],
      enabled: reminderEnabled ? 1 : 0,
      count: 1,
    }
    if (reminder) {
      await fetch(`/lumina/api/reminders/${reminder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      setReminder({ ...reminder, hour: h, minute: m, enabled: reminderEnabled ? 1 : 0 })
    } else {
      const res = await fetch('/lumina/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const created = await res.json()
      setReminder(created)
    }
    setNotifSaving(false)
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2000)
  }

  async function deleteNotification() {
    if (!reminder) return
    await fetch(`/lumina/api/reminders/${reminder.id}`, { method: 'DELETE' })
    setReminder(null)
    setReminderTime('08:00')
    setReminderEnabled(true)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #f5f0e8 100%)' }}>
      <div className="text-4xl animate-pulse text-emerald-400">✿</div>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #fdf8f0 0%, #f5f0e8 50%, #ede8df 100%)' }}>

      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-stone-200/60 px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/affirmations" className="text-stone-400 hover:text-stone-700 text-sm transition-colors">
            ← Affirmations
          </Link>
          <h1 className="font-serif text-base font-bold text-stone-700">Affirmation Settings</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* ── Daily Notification ── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Daily Notification</p>
          <p className="text-xs text-stone-400 mb-4">Get a push notification with a random affirmation at this time</p>
          <div className="bg-white/70 border border-stone-200 rounded-2xl px-5 py-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-[10px] text-stone-400 mb-1.5 uppercase tracking-widest">Time</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="border border-stone-200 rounded-xl px-4 py-2 bg-white text-stone-700 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition-all text-sm"
                />
              </div>
              <div className="pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <span className="text-sm text-stone-600">Enabled</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={saveNotification}
                disabled={notifSaving}
                className="px-5 py-2 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-sm font-medium rounded-full hover:shadow-md disabled:opacity-40 transition-all"
              >
                {notifSaving ? 'Saving…' : notifSaved ? '✓ Saved' : reminder ? 'Update' : 'Set up'}
              </button>
              {reminder && (
                <button
                  onClick={deleteNotification}
                  className="px-4 py-2 border border-red-200 text-red-400 text-sm rounded-full hover:bg-red-50 transition-all"
                >
                  Remove
                </button>
              )}
              {reminder && (
                <span className="text-xs text-stone-400 italic">
                  Active: {String(reminder.hour).padStart(2, '0')}:{String(reminder.minute).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Daily Set ── */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Daily Set</p>
            <span className="text-xs text-emerald-600 font-medium">{orderedPinned.length} item{orderedPinned.length !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-xs text-stone-400 mb-4">These appear on the reading page in this order</p>
          {orderedPinned.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-stone-300 rounded-2xl text-stone-400 text-sm">
              Empty — add items from the library below
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {orderedPinned.map((item, i) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  actions={
                    <>
                      <button onClick={() => move(item.id, 'up')} disabled={i === 0} className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600 disabled:opacity-20 transition-all text-xs">↑</button>
                      <button onClick={() => move(item.id, 'down')} disabled={i === orderedPinned.length - 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600 disabled:opacity-20 transition-all text-xs">↓</button>
                      <button onClick={() => remove(item)} disabled={saving === item.id} className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 disabled:opacity-40 transition-all text-xs">{saving === item.id ? '…' : '×'}</button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Random Pool ── */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Random Pool</p>
          <p className="text-xs text-stone-400 mb-4">
            Affirmation items not in the daily set — one is picked daily for &ldquo;Today&apos;s Pick&rdquo;
          </p>
          {randomPool.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-stone-300 rounded-2xl text-stone-400 text-sm">
              No affirmations in the random pool yet.<br />
              <Link href="/capture" className="text-emerald-600 hover:text-emerald-500 mt-1 inline-block">Add affirmations →</Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {randomPool.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  actions={
                    <button
                      onClick={() => add(item)}
                      disabled={saving === item.id}
                      className="px-3 py-1 rounded-lg border border-stone-200 text-stone-500 text-xs hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 transition-all"
                      title="Move to daily set"
                    >
                      {saving === item.id ? '…' : '→ Daily'}
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Add from Library ── */}
        {unpinned.filter((a) => a.type !== 'Affirmation').length > 0 && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1">Add from Library</p>
            <p className="text-xs text-stone-400 mb-4">Other items you can add to the daily set</p>
            <div className="flex flex-col gap-2">
              {unpinned.filter((a) => a.type !== 'Affirmation').map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  actions={
                    <button
                      onClick={() => add(item)}
                      disabled={saving === item.id}
                      className="px-3 py-1 rounded-lg border border-emerald-300 text-emerald-600 text-xs font-medium hover:bg-emerald-50 disabled:opacity-40 transition-all"
                    >
                      {saving === item.id ? '…' : '+ Add'}
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* New affirmation */}
        <section className="text-center pt-2">
          <Link
            href="/capture"
            className="inline-block px-6 py-2.5 bg-emerald-600/10 border border-emerald-400/30 rounded-full text-emerald-700 text-sm hover:bg-emerald-600/20 transition-all"
          >
            + Capture a new affirmation
          </Link>
        </section>

      </main>
    </div>
  )
}
