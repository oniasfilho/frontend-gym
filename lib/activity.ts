export type Activity = Record<string, number>

const WEEKS = 15

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function daysAgo(today: Date, days: number) {
  const date = new Date(today)
  date.setDate(date.getDate() - days)
  return date
}

/** 0 = no solves, then 1, 2–3, 4–5, 6+. */
export function activityLevel(count: number) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count <= 3) return 2
  if (count <= 5) return 3
  return 4
}

export type ActivityCell = { key: string; count: number; future: boolean; title: string; level: number }

export function activityStats(activity: Activity, now = new Date()) {
  // Noon avoids skipping or repeating a day across daylight-saving changes.
  const today = new Date(now)
  today.setHours(12, 0, 0, 0)
  const count = (date: Date) => activity[dayKey(date)] ?? 0

  let streak = 0
  for (let back = count(today) ? 0 : 1; count(daysAgo(today, back)) > 0; back++) streak++

  let week = 0
  for (let back = 0; back < 7; back++) week += count(daysAgo(today, back))

  // Columns are weeks starting on Sunday, ending with the current week.
  const start = daysAgo(today, (WEEKS - 1) * 7 + today.getDay())
  const cells: ActivityCell[] = []
  let activeDays = 0
  for (let offset = 0; offset < WEEKS * 7; offset++) {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const solved = count(date)
    const future = date.getTime() > today.getTime()
    if (solved && !future) activeDays++
    cells.push({
      key: dayKey(date),
      count: solved,
      future,
      level: activityLevel(solved),
      title: `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${solved ? `${solved} solved` : 'no practice'}`,
    })
  }

  return { streak, week, cells, activeDays }
}

export function relativeTime(timestamp: number, now = Date.now()) {
  const minutes = Math.floor((now - timestamp) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}
