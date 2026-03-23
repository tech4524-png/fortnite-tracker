import { kv } from '@vercel/kv'

const DAYS_KEY = 'bp_days_data'
const START_KEY = 'bp_start_date'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const days = await kv.get(DAYS_KEY) || {}
      const startDate = await kv.get(START_KEY) || null
      return res.status(200).json({ days, startDate })
    } catch (e) {
      return res.status(500).json({ error: 'KV error', detail: e.message })
    }
  }

  if (req.method === 'POST') {
    const { action, dateKey, startDate } = req.body

    try {
      if (action === 'toggle') {
        const days = await kv.get(DAYS_KEY) || {}
        days[dateKey] = !days[dateKey]
        await kv.set(DAYS_KEY, days)
        return res.status(200).json({ days })
      }

      if (action === 'setStart') {
        await kv.set(START_KEY, startDate)
        return res.status(200).json({ startDate })
      }

      if (action === 'setDay') {
        const { value } = req.body
        const days = await kv.get(DAYS_KEY) || {}
        days[dateKey] = value
        await kv.set(DAYS_KEY, days)
        return res.status(200).json({ days })
      }

      return res.status(400).json({ error: 'Unknown action' })
    } catch (e) {
      return res.status(500).json({ error: 'KV error', detail: e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
