# 🎮 Fortnite Battle Pass Tracker

אפליקציית מעקב התנהגות לבן שלך — בסגנון Fortnite Battle Pass!

---

## 🚀 דפלוי ל-Vercel (צעד אחר צעד)

### שלב 1 — צור חשבון Vercel (אם אין לך)
1. היכנס ל-[vercel.com](https://vercel.com)
2. הירשם עם GitHub / Google

### שלב 2 — העלה את הקוד ל-GitHub
1. היכנס ל-[github.com](https://github.com) → **New repository**
2. שם: `fortnite-tracker` → **Create repository**
3. גרור את כל תוכן התיקיה לדף GitHub (Upload files)
4. לחץ **Commit changes**

### שלב 3 — חבר ל-Vercel
1. ב-Vercel לחץ **Add New → Project**
2. בחר את ה-repo `fortnite-tracker` מ-GitHub
3. לחץ **Deploy** — Vercel יזהה Next.js אוטומטית

### שלב 4 — הוסף Upstash Redis (מסד הנתונים)

1. היכנס ל-[upstash.com](https://upstash.com) → **Sign Up** (חינמי)
2. לחץ **Create Database** → שם: `fortnite-kv` → **Create**
3. אחרי היצירה, לחץ על ה-database → לשונית **REST API**
4. תראה שני ערכים — שמור אותם:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. ב-Vercel → **Settings → Environment Variables**
6. הוסף את שני המשתנים עם הערכים מ-Upstash
7. חזור ל-**Deployments** → לחץ **Redeploy**

### שלב 5 — הכנסו!
אחרי הדפלוי תקבל URL כמו `https://fortnite-tracker-xxx.vercel.app`

---

## 🔐 פרטי כניסה
- **הורה:** david / davidi4524
- **ילד:** כניסה לצפייה בלבד (בלי סיסמא)

---

## 📱 תומך מובייל
עובד מושלם על iPhone ו-Android.
