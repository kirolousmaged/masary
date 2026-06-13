# مصرى — Masary

> Egyptian Net Worth & Wealth Tracker — track gold, EGX stocks, and bank balances in real time.

## Install on Android (direct APK)

1. Go to the **[Releases](../../releases/latest)** tab on this page
2. Download **`masary-debug.apk`**
3. On your phone: **Settings → Security → Install unknown apps** → enable for your browser/Files app
4. Tap the downloaded APK → Install

> The app requests SMS read permission to auto-track CIB, NBE, Banque Misr, and InstaPay notifications. All parsing is 100% on-device — no data leaves your phone.

---

## Features

| Screen | What it does |
|---|---|
| **Onboarding** | 4-step setup: cash balance → gold portfolio → EGX stocks → SMS permission |
| **Dashboard** | Animated total net worth, allocation bar, live breakdowns, recent transactions |
| **Portfolio** | Tabbed view — gold (live karat prices), stocks (real-time ticks), cash (SMS feed) |
| **Markets** | Gold spot prices, EGX top gainers/losers, full 15-ticker table |
| **Insights** | Gold vs EGX30 CAGR chart, value screener (P/E < 15, DY > 4%), momentum leaders |

## Tech Stack

- **Next.js 14** (App Router, static export)
- **Capacitor 6** (Android APK wrapper)
- **Material UI v5** + **Tailwind CSS** (Material Design 3, dark mode)
- **Zustand** (persisted portfolio state)
- **Recharts** (Gold vs EGX30 chart)
- **Framer Motion** (animations)

## Local Development

```bash
npm install
npm run dev          # → http://localhost:3000
```

## Build APK (GitHub Actions)

Push to `main` → GitHub Actions automatically:
1. Builds Next.js static export (`out/`)
2. Generates Capacitor Android project
3. Compiles debug APK with Gradle
4. Publishes APK to GitHub Releases

```bash
git push origin main   # triggers the workflow
```
