# 🚨 SAR Mitigasi

**AI-powered disaster mitigation and response system for Indonesian SAR (Search and Rescue) teams, built for the critical 72-hour golden hour.**

🔗 **Live app:** [https://sar-mitigasi.web.app](https://sar-mitigasi.web.app)
📦 **Repository:** [github.com/gonggongz/sar-mitigation-system](https://github.com/gonggongz/sar-mitigation-system)

Built for the **Google Cloud AI Builder Cup 2026**.

> 🇮🇩 **Ringkasan singkat (Bahasa Indonesia):** SAR Mitigasi adalah sistem deteksi dan prioritas respons bencana yang membantu tim SAR di Indonesia menentukan lokasi paling parah terdampak dalam 72 jam pertama (golden hour) setelah bencana. Sistem ini menggabungkan simulasi anomali sinyal, data cuaca resmi BMKG, dan rekomendasi AI dari Gemini, dengan 3 jalur pelaporan (form web, WhatsApp, dan simulasi). Aplikasi ini sepenuhnya berbahasa Indonesia (dengan opsi toggle ke Bahasa Inggris) karena dirancang untuk relawan dan warga Indonesia sebagai pengguna utamanya. Dokumentasi ini ditulis dalam Bahasa Inggris untuk memenuhi syarat submission kompetisi.

---

## 🧭 The Problem

After a natural disaster strikes — a landslide, flood, tsunami, forest fire, or drought — the first 72 hours (the "golden hour") are the most critical for saving lives. Indonesian SAR teams often struggle to know **which locations are most severely affected first**, especially when:

- Communication infrastructure in the disaster zone may be down
- Reports from the field are scattered, unverified, or arrive too late
- There's no single, real-time source of truth combining incident location, weather risk, and response priority

**SAR Mitigasi** addresses this by giving SAR command teams a live, AI-assisted operational picture — while giving affected citizens a simple way to report, whether through a web form or a WhatsApp message.

## 💡 The Solution

A real-time command dashboard that combines:

- **Anomaly detection** — simulates sudden signal-loss patterns (representing what real telco/BNPB data could provide in production) to flag potential blackout-zone disasters
- **Multi-channel reporting** — citizens and volunteers can report via a web form *or* a free-text WhatsApp message, with Gemini automatically extracting structured data from casual, typo-filled, or incomplete messages
- **AI-powered recommendations** — Gemini combines incident severity, official BMKG weather data, and population impact to generate urgency levels, action plans, logistics estimates, and follow-up disaster warnings — adapting its advice based on whether communication in the area is still active or cut off
- **Verified, real-time coordination** — a role-based dashboard for volunteers/SAR officers to verify reports, track incident handling (teams deployed, logistics delivered, survivors/fatalities), and see everything update live across devices

## 👥 Three Views, One System

### 1. Public Landing Page (no login required)
Built for someone in a panic to find help fast: a large "Report" button, one-tap emergency call, live incident ticker, a privacy-safe public map (no photos, plain-language color legend), and collapsible per-disaster-type safety guides.

### 2. Citizen Report Form
- Select disaster type (landslide, flood, tsunami, forest fire, drought)
- Choose location 3 ways: GPS, search by village name (covers every village in Java), or tap on the map — *location is not auto-filled from GPS alone*, since a reporter may have already evacuated far from the actual incident site
- Damage level, estimated people affected, notes, and photo upload
- Optional name and phone number, stored separately and only visible to verified volunteers

### 3. Volunteer / SAR Command Dashboard (login required)
- Email login restricted to an admin-managed allowlist of registered volunteers
- Live summary cards, a filterable/searchable report list, an interactive map that flies to the selected point, and a detail panel per incident showing:
  - 🌦️ **BMKG weather forecast** and 24-hour heavy-rain risk detection
  - 🤖 **Gemini AI recommendation** — urgency, suggested action, logistics estimate, follow-up disaster warning
  - ✅ **Report verification** — mark valid / duplicate / rejected, with nearby reports (within 5 km) surfaced as supporting or duplicate evidence
  - 🚑 **Incident handling** — status (pending / in progress / resolved), teams deployed, logistics given, survivors and fatalities
- A photo gallery tab for post-incident review, a self-report tab (auto-verified), and a simulation button for demoing signal-loss anomalies across Java's kecamatan and 869 islands

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| Maps | Leaflet (OpenStreetMap + OpenTopoMap layers) |
| Database | Firebase Firestore (realtime) |
| File storage | Firebase Storage (incident photos) |
| Backend | Firebase Cloud Functions (Node.js) |
| Hosting | Firebase Hosting |
| Auth | Firebase Authentication (volunteer allowlist) |
| AI | Google Gemini API (`gemini-2.5-flash`) |
| Weather data | BMKG (Indonesia's official meteorology agency) public API |
| Messaging | WhatsApp via WhatAuto webhook bridge |

## 🏗️ Architecture

```
Citizen / Volunteer
        │
   ┌────┴─────┐
   │           │
Web Form   WhatsApp message
   │           │
   │      WhatAuto (webhook bridge)
   │           │
   │      whatsappWebhook (Cloud Function)
   │           │
   │      Gemini → extracts structured
   │      report data from free text
   │           │
   └─────┬─────┘
         │
    Firestore (titik_anomali)
         │
   ┌─────┴──────┐
   │             │
Public map   Volunteer Dashboard
(read-only)       │
              rekomendasiAI (Cloud Function)
              → calls Gemini server-side
              → combines report + BMKG weather
              → returns urgency, action plan,
                logistics estimate
```

**Key design decision:** Gemini calls run server-side through Cloud Functions (`rekomendasiAI`, `whatsappWebhook`), so the API key never reaches the browser.

## 🔒 Security & Privacy

- Firestore rules: public can only *read* incident points; citizens can only *create* reports in a validated shape; updates and verification are restricted to authenticated, allowlisted volunteers; nothing can be deleted from the client.
- Sensitive fields (reporter phone number, verifier email) are split into a separate, volunteer-only `titik_privat` collection.
- Photos are only viewable by authenticated volunteers (Storage rules), with file size and type limits.
- Duplicate or rejected reports are hidden from the public map and statistics, but the data itself is retained for audit purposes.
- The WhatsApp webhook requires a secret token (`?token=` or `x-webhook-token` header, compared in constant time); requests without a valid token are rejected silently.

## 🌐 Other Features

- **Bilingual (ID/EN) toggle** — switches the entire interface, including AI-generated recommendations and BMKG weather descriptions, since the app is built for Indonesian users but documented here in English for international review
- **Realtime by default** — every volunteer sees the same live data via Firestore's `onSnapshot`, no manual refresh needed
- **Java-wide location data** — every village in Java (24,515) plus 869 islands, each mapped to a BMKG administrative weather code; the data structure is designed to extend to the rest of Indonesia

## 🚀 Getting Started (local development)

```bash
# 1. Clone the repo
git clone https://github.com/gonggongz/sar-mitigation-system.git
cd sar-mitigation-system

# 2. Install the Firebase CLI and log in
npm install -g firebase-tools
firebase login
firebase use --add   # select your Firebase project

# 3. Install dependencies (frontend and Cloud Functions)
npm install
cd functions && npm install && cd ..

# 4. Set up environment variables
cp .env.example .env
# fill in your Firebase web app config in .env

cp functions/.env.example functions/.env
# fill in GEMINI_API_KEY and WEBHOOK_TOKEN in functions/.env

# 5. Run the app locally
npm run dev
```

Deploying requires a Firebase project on the **Blaze (pay-as-you-go)** plan (needed for Cloud Functions), with Firestore, Storage, Hosting, and Authentication (Email/Password) enabled.

```bash
npm run build
firebase deploy   # hosting, functions, Firestore & Storage rules
```

### Registering a volunteer account

There is no sign-up form by design — only administrators can create volunteer accounts:

1. In **Firebase Console → Authentication**, add a user with email and password.
2. Copy that user's **UID**.
3. In **Firestore**, create a document in the `relawan` collection with the UID as the document ID (any fields, e.g. `nama`).

Accounts that can log in but are not in the `relawan` collection are blocked from the dashboard, the AI recommendation function, and photo access.

### Connecting WhatsApp (optional)

Point your webhook bridge (e.g. WhatAuto) to the deployed function URL (printed after `firebase deploy --only functions`) with your token appended:

```
https://<region>-<project-id>.cloudfunctions.net/whatsappWebhook?token=<WEBHOOK_TOKEN>
```

## 🗺️ Roadmap / Future Development

This prototype currently uses **simulated signal-loss data** to demonstrate the anomaly-detection concept. Honest next steps toward a production system:

- Partner with telecom operators or BNPB/Kominfo to access real cell-tower (BTS) outage data
- Integrate official BPS population data for more accurate impact estimates
- Expand WhatsApp-reported locations beyond the current pilot set to full nationwide coverage
- Offline-first support (PWA) so field reports can queue during connectivity loss
- Marker clustering for large-scale incidents, image/voice-note support in WhatsApp reports, and BMKG response caching for resilience during high-traffic events (e.g. major earthquakes)

## 🙏 Acknowledgments

- **BMKG** (Badan Meteorologi, Klimatologi, dan Geofisika) for the public weather API
- **Village location data:** BPS (Statistics Indonesia) via OCHA / Humanitarian Data Exchange (HDX), licensed under [CC BY-IGO](https://creativecommons.org/licenses/by/3.0/igo/)
- **Map tiles:** © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, [OpenTopoMap](https://opentopomap.org) (CC-BY-SA)
- **Google Cloud** and **Hack2skill** for organizing the AI Builder Cup 2026
- Built with the help of Claude (Anthropic) and Gemini (Google)

## 📄 License

This project was built for the Google Cloud AI Builder Cup 2026 hackathon submission.