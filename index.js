import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const CREDENTIALS = { username: 'david', password: 'davidi4524' }
const TOTAL_DAYS = 90
const HERO_NAME = 'דוד'

const CHECKLIST_ITEMS = [
  { id: 'noShouting', label: 'לא היו צעקות', emoji: '🤫' },
  { id: 'homework',   label: 'ביצע שיעורי בית', emoji: '📚' },
  { id: 'shower',     label: 'התקלח', emoji: '🚿' },
  { id: 'kindFamily', label: 'התייחס יפה לבני המשפחה', emoji: '❤️' },
]

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

export default function Home() {
  const [screen, setScreen] = useState('login') // login | app
  const [isParent, setIsParent] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)
  const [daysData, setDaysData] = useState({})   // { 'YYYY-MM-DD': true }
  const [startDate, setStartDate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  // Checklist modal
  const [checklistDate, setChecklistDate] = useState(null)
  const [checklistValues, setChecklistValues] = useState({})

  // Load data from API
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/data')
      const json = await res.json()
      setDaysData(json.days || {})
      if (json.startDate) {
        setStartDate(json.startDate)
      } else {
        const today = formatDate(new Date())
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'setStart', startDate: today })
        })
        setStartDate(today)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (screen === 'app') loadData()
  }, [screen, loadData])

  function showToast(msg, type = 'good') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  // Login
  function handleLogin() {
    if (username.trim() === CREDENTIALS.username && password === CREDENTIALS.password) {
      setIsParent(true)
      setLoginError(false)
      setScreen('app')
    } else {
      setLoginError(true)
      setPassword('')
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  // Open checklist for a day
  function openChecklist(dateKey) {
    if (!isParent) return
    setChecklistDate(dateKey)
    // Pre-fill existing values if day was already marked
    const existing = daysData[dateKey]
    if (existing && typeof existing === 'object') {
      setChecklistValues(existing)
    } else {
      setChecklistValues({ noShouting: false, homework: false, shower: false, kindFamily: false })
    }
  }

  function closeChecklist() {
    setChecklistDate(null)
    setChecklistValues({})
  }

  async function saveChecklist() {
    const allGood = CHECKLIST_ITEMS.every(item => checklistValues[item.id])
    const value = allGood ? checklistValues : (
      Object.values(checklistValues).some(v => v) ? checklistValues : false
    )

    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setDay', dateKey: checklistDate, value })
      })
      const json = await res.json()
      setDaysData(json.days || {})

      if (allGood) {
        showToast('✅ יום מושלם! +1 XP 🔥', 'good')
      } else {
        const count = Object.values(checklistValues).filter(Boolean).length
        showToast(`⚡ ${count}/4 פעולות הושלמו`, 'partial')
      }
    } catch (e) {
      console.error(e)
    }
    closeChecklist()
  }

  async function removeDay(dateKey) {
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setDay', dateKey, value: false })
      })
      const json = await res.json()
      setDaysData(json.days || {})
      showToast('🗑️ הוסר', 'storm')
    } catch (e) { console.error(e) }
    closeChecklist()
  }

  // Compute stats
  const today = new Date(); today.setHours(0,0,0,0)
  const start = startDate ? parseDate(startDate) : today
  start.setHours(0,0,0,0)

  let goodCount = 0, currentStreak = 0, tempStreak = 0
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = addDays(start, i)
    if (d > today) break
    const key = formatDate(d)
    const val = daysData[key]
    const isGood = val && (val === true || (typeof val === 'object' && CHECKLIST_ITEMS.every(item => val[item.id])))
    if (isGood) { goodCount++; tempStreak++ }
    else tempStreak = 0
  }
  currentStreak = tempStreak
  const elapsed = Math.min(Math.floor((today - start) / 86400000) + 1, TOTAL_DAYS)
  const daysLeft = Math.max(0, TOTAL_DAYS - elapsed)
  const xpPct = Math.min(100, (goodCount / TOTAL_DAYS) * 100)
  let tierName = '🏅 Bronze'
  if (goodCount >= 75) tierName = '💎 Diamond'
  else if (goodCount >= 60) tierName = '🥇 Gold'
  else if (goodCount >= 45) tierName = '🥈 Silver'
  else if (goodCount >= 30) tierName = '🥉 Bronze+'
  const isComplete = goodCount >= TOTAL_DAYS

  // Build months
  const hebrewMonths = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר']
  const dayLabels = ['א','ב','ג','ד','ה','ו','ש']
  const monthsMap = {}
  for (let i = 0; i < TOTAL_DAYS; i++) {
    const d = addDays(start, i)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!monthsMap[key]) monthsMap[key] = { year: d.getFullYear(), month: d.getMonth(), days: [] }
    monthsMap[key].days.push({ date: d, dayIndex: i })
  }

  function getDayStatus(date) {
    const d = new Date(date); d.setHours(0,0,0,0)
    const key = formatDate(d)
    const val = daysData[key]
    if (d > today) return 'future'
    if (!val) return 'storm'
    if (val === true || (typeof val === 'object' && CHECKLIST_ITEMS.every(item => val[item.id]))) return 'good'
    return 'partial' // some checked
  }

  // ===================== RENDER =====================
  const s = {
    body: { fontFamily: "'Heebo', sans-serif", background: '#1a1035', color: '#fff', minHeight: '100vh', direction: 'rtl', position: 'relative', overflowX: 'hidden' },
    overlay: { position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 20% 50%, #5a1a9966, transparent 60%), radial-gradient(ellipse 60% 80% at 80% 30%, #3d1a8855, transparent 50%)', pointerEvents: 'none', zIndex: 0 },
    container: { position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 0 60px' },

    // Login
    loginWrap: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 0 },
    loginLogo: { fontFamily: "'Orbitron', sans-serif", fontSize: 12, letterSpacing: 4, color: '#a855f7', marginBottom: 8, textTransform: 'uppercase' },
    loginTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 24, fontWeight: 900, color: '#00e5ff', textShadow: '0 0 20px #00e5ff, 0 0 40px #00e5ff', textAlign: 'center', marginBottom: 4 },
    loginSub: { fontSize: 13, color: '#b0a0d0', marginBottom: 32, textAlign: 'center' },
    card: { background: '#2a1f50', border: '1px solid #6b3faa', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 340, boxShadow: '0 0 50px #7a3faa44' },
    cardTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: 16, color: '#ffd700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20, textAlign: 'center' },
    label: { display: 'block', fontSize: 12, color: '#b0a0d0', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
    input: { width: '100%', background: '#1e1640', border: '1px solid #6b3faa', borderRadius: 8, padding: '12px 14px', color: '#fff', fontFamily: "'Heebo', sans-serif", fontSize: 15, outline: 'none', direction: 'ltr', textAlign: 'left', marginBottom: 16 },
    btnLogin: { width: '100%', background: 'linear-gradient(135deg, #00aaff, #0066cc)', border: 'none', borderRadius: 10, padding: 14, color: '#fff', fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: 2, cursor: 'pointer', marginTop: 8, boxShadow: '0 4px 20px #00aaff44' },
    errMsg: { color: '#ff2244', fontSize: 13, textAlign: 'center', marginTop: 10 },
    btnViewOnly: { marginTop: 16, background: 'none', border: '1px solid #6b3faa', borderRadius: 10, padding: 12, color: '#b0a0d0', fontFamily: "'Heebo', sans-serif", fontSize: 14, cursor: 'pointer', width: '100%', maxWidth: 340 },

    // Top bar
    topBar: { background: 'linear-gradient(180deg, #221648 0%, transparent 100%)', padding: '16px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(8px)', borderBottom: '1px solid #6b3faa' },
    topTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, color: '#00e5ff', letterSpacing: 1 },
    topRight: { display: 'flex', alignItems: 'center', gap: 10 },
    badgeParent: { fontSize: 11, padding: '4px 10px', borderRadius: 20, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', background: '#ffd70022', border: '1px solid #ffd700', color: '#ffd700' },
    badgeViewer: { fontSize: 11, padding: '4px 10px', borderRadius: 20, fontFamily: "'Rajdhani', sans-serif", fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', background: '#00e5ff11', border: '1px solid #00e5ff', color: '#00e5ff' },
    logoutBtn: { background: 'none', border: 'none', color: '#b0a0d0', fontSize: 13, cursor: 'pointer', padding: '4px 8px', fontFamily: "'Heebo', sans-serif" },

    // Hero
    heroSection: { padding: '24px 20px 16px', textAlign: 'center' },
    seasonLabel: { fontFamily: "'Rajdhani', sans-serif", fontSize: 12, letterSpacing: 3, color: '#a855f7', textTransform: 'uppercase', marginBottom: 4 },
    heroName: { fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 20 },

    // XP
    xpSection: { background: '#2a1f50', border: '1px solid #6b3faa', borderRadius: 14, padding: 16, margin: '0 20px 8px', boxShadow: '0 0 20px #3d1a7a22' },
    xpHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    xpLabel: { fontFamily: "'Rajdhani', sans-serif", fontSize: 13, letterSpacing: 2, color: '#b0a0d0', textTransform: 'uppercase' },
    xpValue: { fontFamily: "'Orbitron', sans-serif", fontSize: 13, color: '#ffd700', fontWeight: 700 },
    xpBarBg: { background: '#1e1640', borderRadius: 100, height: 14, overflow: 'hidden', border: '1px solid #6b3faa', position: 'relative' },
    xpBarFill: (pct) => ({ height: '100%', borderRadius: 100, background: 'linear-gradient(90deg, #ff9500, #ffd700)', boxShadow: '0 0 10px #ffd700', width: pct + '%', transition: 'width 1s cubic-bezier(0.4,0,0.2,1)' }),
    xpTier: { display: 'flex', justifyContent: 'space-between', marginTop: 8 },
    tierDim: { fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: '#b0a0d0', textTransform: 'uppercase' },
    tierCurrent: { fontFamily: "'Rajdhani', sans-serif", fontSize: 12, color: '#ffd700', fontWeight: 700, textTransform: 'uppercase' },

    // Stats
    statsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, margin: '0 20px 20px' },
    statCard: (accent) => ({ background: '#2a1f50', border: `1px solid ${accent}`, borderRadius: 12, padding: '12px 8px', textAlign: 'center', boxShadow: `0 0 15px ${accent}22` }),
    statNum: (color) => ({ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 900, lineHeight: 1, marginBottom: 4, color }),
    statLabel: { fontSize: 10, color: '#b0a0d0', letterSpacing: 1, textTransform: 'uppercase', fontFamily: "'Rajdhani', sans-serif" },

    // Section title
    sectionTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: 13, letterSpacing: 3, color: '#b0a0d0', textTransform: 'uppercase', padding: '0 20px 10px' },

    // Month
    monthBlock: { margin: '0 20px 24px' },
    monthHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
    monthName: { fontFamily: "'Orbitron', sans-serif", fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 1 },
    monthStats: (perfect) => ({ fontSize: 11, color: perfect ? '#ffd700' : '#b0a0d0', fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1, marginRight: 'auto' }),
    dayLabelsRow: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 },
    dayLabelCell: { textAlign: 'center', fontSize: 9, color: '#b0a0d0', fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1, textTransform: 'uppercase', padding: '2px 0' },
    daysGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 },

    // Day cell base
    dayCell: (status, isToday, clickable) => {
      const base = { aspectRatio: '1', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, position: 'relative', border: '1px solid transparent', overflow: 'hidden', cursor: clickable ? 'pointer' : 'default', transition: 'all 0.15s', userSelect: 'none' }
      if (status === 'future') return { ...base, background: '#2a2050', borderColor: '#3a2d6a', color: '#5a4a80' }
      if (status === 'good') return { ...base, background: 'linear-gradient(135deg, #005580, #0077bb)', borderColor: isToday ? '#00e5ff' : '#00aadd', color: '#00e5ff', boxShadow: isToday ? '0 0 12px #00e5ff88' : '0 0 6px #00ccff33' }
      if (status === 'partial') return { ...base, background: 'linear-gradient(135deg, #664400, #886600)', borderColor: isToday ? '#ffd700' : '#aa8800', color: '#ffd700', boxShadow: isToday ? '0 0 12px #ffd70088' : '0 0 6px #ffd70033' }
      // storm
      return { ...base, background: 'linear-gradient(135deg, #4a1a77, #31105a)', borderColor: isToday ? '#00e5ff' : '#7a3faa', color: '#c090e0', boxShadow: isToday ? '0 0 10px #00e5ff66' : 'none' }
    },

    // Legend
    legend: { display: 'flex', gap: 16, padding: '0 20px 24px', flexWrap: 'wrap' },
    legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#b0a0d0', fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1 },
    legendDot: (bg, border) => ({ width: 14, height: 14, borderRadius: 4, border: `1px solid ${border}`, background: bg, flexShrink: 0 }),

    // Victory
    victorySection: { margin: '0 20px 24px', background: '#2a1f50', border: '1px solid #6b3faa', borderRadius: 16, padding: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' },

    // Checklist modal
    overlay2: { position: 'fixed', inset: 0, background: '#00000088', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
    modal: { background: '#221648', border: '1px solid #6b3faa', borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 480, boxShadow: '0 -10px 40px #3d1a7a88' },
    modalTitle: { fontFamily: "'Orbitron', sans-serif", fontSize: 15, color: '#00e5ff', marginBottom: 4, textAlign: 'center' },
    modalSub: { fontSize: 12, color: '#b0a0d0', textAlign: 'center', marginBottom: 20 },
    checkRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0', borderBottom: '1px solid #3d2a6a', cursor: 'pointer' },
    checkEmoji: { fontSize: 22, width: 32, textAlign: 'center' },
    checkLabel: { flex: 1, fontSize: 16, color: '#fff' },
    checkBox: (checked) => ({ width: 26, height: 26, borderRadius: 8, border: `2px solid ${checked ? '#00e5ff' : '#6b3faa'}`, background: checked ? 'linear-gradient(135deg, #005580, #0077bb)' : '#1e1640', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, transition: 'all 0.15s' }),
    modalBtns: { display: 'flex', gap: 10, marginTop: 20 },
    btnSave: { flex: 1, background: 'linear-gradient(135deg, #00aaff, #0066cc)', border: 'none', borderRadius: 10, padding: '14px', color: '#fff', fontFamily: "'Orbitron', sans-serif", fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 1 },
    btnRemove: { background: '#3d1a5a', border: '1px solid #6b3faa', borderRadius: 10, padding: '14px 16px', color: '#b0a0d0', fontSize: 13, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" },
    btnCancel: { background: 'none', border: '1px solid #6b3faa', borderRadius: 10, padding: '14px 16px', color: '#b0a0d0', fontSize: 13, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" },

    // Toast
    toastWrap: (visible) => ({ position: 'fixed', top: 80, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : -20}px)`, opacity: visible ? 1 : 0, transition: 'all 0.3s', zIndex: 999, background: '#2a1f50', border: `1px solid #6b3faa`, borderRadius: 10, padding: '10px 20px', fontFamily: "'Rajdhani', sans-serif", fontSize: 14, letterSpacing: 1, color: '#00e5ff', boxShadow: '0 0 20px #00e5ff33', whiteSpace: 'nowrap', pointerEvents: 'none' }),
  }

  // ---- LOGIN SCREEN ----
  if (screen === 'login') return (
    <>
      <Head>
        <title>Battle Pass 🎮</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@700;900&family=Heebo:wght@400;500;700;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Head>
      <div style={s.body}>
        <div style={s.overlay} />
        <div style={s.loginWrap}>
          <div style={s.loginLogo}>⚡ FORTNITE TRACKER</div>
          <div style={s.loginTitle}>BATTLE PASS</div>
          <div style={s.loginSub}>מסע של 3 חודשים 🏆</div>
          <div style={s.card}>
            <div style={s.cardTitle}>🔐 כניסת הורה</div>
            <div><label style={s.label}>שם משתמש</label>
              <input style={s.input} value={username} onChange={e => setUsername(e.target.value)} onKeyDown={handleKeyDown} placeholder="username" autoComplete="username" /></div>
            <div><label style={s.label}>סיסמא</label>
              <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} placeholder="••••••••" autoComplete="current-password" /></div>
            <button style={s.btnLogin} onClick={handleLogin}>SQUAD UP →</button>
            {loginError && <div style={s.errMsg}>❌ שם משתמש או סיסמא שגויים</div>}
          </div>
          <button style={s.btnViewOnly} onClick={() => { setIsParent(false); setScreen('app') }}>👁 כניסה לצפייה בלבד</button>
        </div>
      </div>
    </>
  )

  // ---- CHECKLIST MODAL ----
  function ChecklistModal() {
    if (!checklistDate) return null
    const dateObj = parseDate(checklistDate)
    const dateStr = `${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()}`
    const allChecked = CHECKLIST_ITEMS.every(i => checklistValues[i.id])
    const existing = daysData[checklistDate]
    const hasData = existing && (existing === true || typeof existing === 'object')

    return (
      <div style={s.overlay2} onClick={closeChecklist}>
        <div style={s.modal} onClick={e => e.stopPropagation()}>
          <div style={s.modalTitle}>📋 סיכום יום — {dateStr}</div>
          <div style={s.modalSub}>סמן את מה שבוצע היום</div>
          {CHECKLIST_ITEMS.map(item => (
            <div key={item.id} style={s.checkRow} onClick={() => setChecklistValues(v => ({ ...v, [item.id]: !v[item.id] }))}>
              <span style={s.checkEmoji}>{item.emoji}</span>
              <span style={s.checkLabel}>{item.label}</span>
              <div style={s.checkBox(!!checklistValues[item.id])}>
                {checklistValues[item.id] ? '✓' : ''}
              </div>
            </div>
          ))}
          {allChecked && <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#00e5ff', fontFamily: "'Rajdhani', sans-serif", letterSpacing: 1 }}>🌟 כל הפעולות הושלמו — יום מושלם!</div>}
          <div style={s.modalBtns}>
            <button style={s.btnSave} onClick={saveChecklist}>שמור ✓</button>
            {hasData && <button style={s.btnRemove} onClick={() => removeDay(checklistDate)}>🗑️</button>}
            <button style={s.btnCancel} onClick={closeChecklist}>ביטול</button>
          </div>
        </div>
      </div>
    )
  }

  // ---- MAIN APP ----
  return (
    <>
      <Head>
        <title>Battle Pass 🎮</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Orbitron:wght@700;900&family=Heebo:wght@400;500;700;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
      </Head>
      <div style={s.body}>
        <div style={s.overlay} />

        {/* Toast */}
        <div style={s.toastWrap(!!toast)}>{toast?.msg}</div>

        {/* Checklist Modal */}
        <ChecklistModal />

        <div style={s.container}>

          {/* Top Bar */}
          <div style={s.topBar}>
            <div style={s.topTitle}>⚡ BATTLE PASS</div>
            <div style={s.topRight}>
              <span style={isParent ? s.badgeParent : s.badgeViewer}>{isParent ? 'PARENT ⭐' : 'VIEWER 👁'}</span>
              <button style={s.logoutBtn} onClick={() => setScreen('login')}>יציאה</button>
            </div>
          </div>

          {/* Hero */}
          <div style={s.heroSection}>
            <div style={s.seasonLabel}>🌟 Season 1 — מבצע מחשב גיימינג</div>
            <div style={s.heroName}>{HERO_NAME}</div>
          </div>

          {/* XP Bar */}
          <div style={s.xpSection}>
            <div style={s.xpHeader}>
              <span style={s.xpLabel}>⚡ Battle Pass XP</span>
              <span style={s.xpValue}>{goodCount} / {TOTAL_DAYS} XP</span>
            </div>
            <div style={s.xpBarBg}><div style={s.xpBarFill(xpPct)} /></div>
            <div style={s.xpTier}>
              <span style={s.tierDim}>Tier 1</span>
              <span style={s.tierCurrent}>{tierName}</span>
              <span style={s.tierDim}>{Math.round(xpPct)}%</span>
            </div>
          </div>

          {/* Stats */}
          <div style={s.statsRow}>
            <div style={s.statCard('#00aadd')}>
              <div style={s.statNum('#00e5ff')}>{goodCount}</div>
              <div style={s.statLabel}>✅ ימים טובים</div>
            </div>
            <div style={s.statCard('#ff9500')}>
              <div style={s.statNum('#ff9500')}>{currentStreak}</div>
              <div style={s.statLabel}>🔥 רצף נוכחי</div>
            </div>
            <div style={s.statCard('#a855f7')}>
              <div style={s.statNum('#a855f7')}>{daysLeft}</div>
              <div style={s.statLabel}>⏳ נותרו</div>
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', color: '#b0a0d0', padding: 20, fontFamily: "'Rajdhani', sans-serif", letterSpacing: 2 }}>טוען נתונים...</div>}

          {/* Calendar */}
          <div style={s.sectionTitle}>📅 מפת הקרב</div>

          {Object.values(monthsMap).map(({ year, month, days }) => {
            let mGood = 0, mTotal = 0
            days.forEach(({ date }) => {
              const d = new Date(date); d.setHours(0,0,0,0)
              if (d <= today) { mTotal++; if (getDayStatus(d) === 'good') mGood++ }
            })
            const perfect = mTotal > 0 && mGood === mTotal
            const firstDay = days[0].date.getDay()

            return (
              <div key={`${year}-${month}`} style={s.monthBlock}>
                <div style={s.monthHeader}>
                  <div style={s.monthName}>{hebrewMonths[month]} {year}</div>
                  {mTotal > 0 && <div style={s.monthStats(perfect)}>{mGood}/{mTotal} ✓</div>}
                </div>
                <div style={s.dayLabelsRow}>{dayLabels.map(l => <div key={l} style={s.dayLabelCell}>{l}</div>)}</div>
                <div style={s.daysGrid}>
                  {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                  {days.map(({ date }) => {
                    const d = new Date(date); d.setHours(0,0,0,0)
                    const key = formatDate(d)
                    const status = getDayStatus(d)
                    const isToday = formatDate(d) === formatDate(today)
                    const clickable = isParent && status !== 'future'
                    const cellStyle = s.dayCell(status, isToday, clickable)

                    return (
                      <div
                        key={key}
                        style={cellStyle}
                        onClick={() => clickable && openChecklist(key)}
                        title={key}
                      >
                        {d.getDate()}
                        {status === 'good' && <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 7, color: '#00e5ff' }}>✓</span>}
                        {status === 'partial' && <span style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', fontSize: 7, color: '#ffd700' }}>~</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Legend */}
          <div style={s.legend}>
            <div style={s.legendItem}><div style={s.legendDot('linear-gradient(135deg,#005580,#0077bb)', '#00aadd')} />אזור בטוח ✓</div>
            <div style={s.legendItem}><div style={s.legendDot('linear-gradient(135deg,#664400,#886600)', '#aa8800')} />חלקי ~</div>
            <div style={s.legendItem}><div style={s.legendDot('linear-gradient(135deg,#4a1a77,#31105a)', '#7a3faa')} />The Storm</div>
            <div style={s.legendItem}><div style={s.legendDot('#2a2050', '#3a2d6a')} />עוד לא הגיע</div>
          </div>

          {/* Victory */}
          <div style={s.sectionTitle}>🏆 הפרס הגדול</div>
          <div style={s.victorySection}>
            {!isComplete ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 48, filter: 'grayscale(1)', opacity: 0.4 }}>🖥️</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 15, fontWeight: 700, color: '#b0a0d0' }}>מחשב גיימינג</div>
                <div style={{ fontSize: 12, color: '#b0a0d0', opacity: 0.7, maxWidth: 240, lineHeight: 1.5, textAlign: 'center' }}>השלם את 90 הימים כדי לפתוח את הפרס האולטימטיבי!</div>
                <div style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 13, color: '#ffd700', marginTop: 4 }}>{goodCount} / {TOTAL_DAYS} ימים</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, fontSize: 20 }}>🎉 ⭐ 🏆 ⭐ 🎉</div>
                <div style={{ fontSize: 64 }}>🖥️</div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg,#ffd700,#ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>VICTORY ROYALE!</div>
                <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6, textAlign: 'center' }}>🎊 כל הכבוד! השלמת את כל 90 הימים!<br />הגיע הזמן לקבל את מחשב הגיימינג שלך! 🖥️⚡</div>
                <div style={{ display: 'flex', gap: 8, fontSize: 20 }}>🎮 🌟 🎮 🌟 🎮</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
