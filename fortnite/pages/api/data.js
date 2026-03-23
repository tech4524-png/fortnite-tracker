import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const DAYS_KEY = 'bp_days_data'
const START_KEY = 'bp_start_date'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const days = await redis.get(DAYS_KEY) || {}
      const startDate = await redis.get(START_KEY) || null
      return res.status(200).json({ days, startDate })
    } catch (e) {
      return res.status(500).json({ error: 'KV error', detail: e.message })
    }
  }

  if (req.method === 'POST') {
    const { action, dateKey, startDate } = req.body

    try {
      if (action === 'toggle') {
        const days = await redis.get(DAYS_KEY) || {}
        days[dateKey] = !days[dateKey]
        await redis.set(DAYS_KEY, days)
        return res.status(200).json({ days })
      }

      if (action === 'setStart') {
        await redis.set(START_KEY, startDate)
        return res.status(200).json({ startDate })
      }

      if (action === 'setDay') {
        const { value } = req.body
        const days = await redis.get(DAYS_KEY) || {}
        days[dateKey] = value
        await redis.set(DAYS_KEY, days)
        return res.status(200).json({ days })
      }

      return res.status(400).json({ error: 'Unknown action' })
    } catch (e) {
      return res.status(500).json({ error: 'KV error', detail: e.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
