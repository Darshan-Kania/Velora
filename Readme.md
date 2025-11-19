# Velora Backend – MailFlare API Server

This is the **official, clean, rewritten, production‑ready README** for the **MailFlare Backend (Velora)**, fully updated according to the complete system description you provided above.

---

# 🚀 Velora – Backend API for MailFlare

**Velora** is the backend engine powering **MailFlare**, the AI‑driven email productivity platform. Built with **Node.js + Express**, Velora manages authentication, secure Gmail integration, webhook ingestion, AI processing pipelines, cron jobs, encryption, and API delivery to the React frontend.

Velora connects Google OAuth, Gmail API, Google Pub/Sub, N8N AI workflows, MongoDB Atlas, and AWS infrastructure into one secure and scalable API service.

---

# 📌 Features

### 🔐 Authentication

* Google OAuth 2.0 login
* JWT-based session tokens (httpOnly cookie)
* Encrypted OAuth access & refresh tokens
* Automatic token refresh (cron)

### 📬 Gmail Integration

* Gmail Watch API
* Google Pub/Sub webhook handling
* History API incremental sync
* Real-time email ingestion
* Full email metadata + body fetching

### 🧠 AI Processing

* Integration with N8N (DigitalOcean) using JWT-authenticated webhooks
* Google Gemini for:

  * Email summarization
  * Context-aware reply suggestions (3 tones)
* Dual LLM chain load balancing
* Batch summarization every 30 seconds

### 🗄 Database Layer

* MongoDB Atlas
* AES‑256‑GCM encryption for sensitive fields
* Collections:

  * users
  * userconfigs
  * emails
  * summarizedemails
  * replybackemails

### ⚙️ Cron Jobs

| Job                 | Interval     | Purpose                        |
| ------------------- | ------------ | ------------------------------ |
| Email Summarization | Every 30 sec | AI processing pipeline         |
| Token Refresh       | Every 25 min | Keeps Gmail access valid       |
| Gmail Watch Renewal | Daily        | Ensures push notifications run |

### 📊 Dashboard / Analytics (API)

* Inbox, unread, and today’s count
* Activity graph API
* Top contacts API

### 🔒 Security

* AES‑256‑GCM encryption for email content
* HTTPS/TLS via Nginx + Certbot
* Access control middleware
* Pub/Sub message signature validation
* Secure cookies

---

# 🛠 Tech Stack

### Backend

* Node.js + Express 5
* MongoDB + Mongoose
* Passport.js (Google OAuth)
* Google APIs SDK (gmail + oauth)
* JWT (jsonwebtoken)
* Winston (with daily rotate logs)
* Node-Cron
* Nginx + PM2 (production)

### External Services

* Gmail API
* Google OAuth 2.0
* Google Cloud Pub/Sub
* N8N AI Workflow Engine
* Google Gemini
* AWS EC2
* MongoDB Atlas
* AWS Amplify (Frontend)

---

# 🏛 System Architecture

Velora acts as the **central backend** in the MailFlare ecosystem:

* Receives login requests → OAuth flow with Google
* Receives Gmail push notifications → Fetches new messages
* Encrypts + stores email data in MongoDB
* Queues unsummarized emails for AI
* Sends email batches to N8N → Gemini processes summary + replies
* Provides dashboard REST APIs to Lyra frontend

---

# 📡 API Documentation

## 🔐 Authentication

**GET /auth/google** – Start OAuth login

**GET /auth/google/callback** – Process tokens → issue JWT → create user

**GET /auth/status** – Check login session

**PATCH /auth/logout** – End session

---

## 📬 Email APIs

**GET /emails?page&limit** – Paginated emails

**GET /emails/:id** – Full email with summary + AI replies

**PATCH /emails/:id/read** – Mark as read

**PATCH /emails/:id/important** – Toggle important flag

**POST /emails/:id/reply** – Send reply with Gmail API

---

## 📊 Dashboard APIs

**GET /dashboard/userProfile** – User profile

**GET /dashboard/EmailCount?label=unread/today** – Counts

**GET /dashboard/activity** – Graph data

**GET /dashboard/topContacts** – Frequent senders

---

## 📩 Gmail Webhook

**POST /gmail/notifications** – Receives Pub/Sub messages

* Decodes message
* Fetches updated email via Gmail History API
* Stores encrypted email

---

# 🔧 Setup & Installation

## 1️⃣ Clone & Install

```bash
cd Velora
npm install
```

## 2️⃣ Configure Environment

Create `.env`:

```env
PORT=3001
FRONTEND_URL=https://mailflare.tech

# MongoDB
MONGO_URI=your_mongodb

# Google OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=https://api.mailflare.tech/auth/google/callback

# Pub/Sub
GOOGLE_PUBSUB_TOPIC=projects/.../topics/mailflare-inbox-updates

# JWT
JWT_SECRET=your_secret

# Encryption
ENCRYPTION_KEY=32_byte_hex_key

# N8N
N8N_BASE_URL=https://n8n.mailflare.tech
N8N_JWT_SECRET=xxx
```

## 3️⃣ Start Server

```bash
npm start
```

---

# 🧠 AI Processing Flow (Backend → N8N → Backend)

1. Cron checks for `toSummarize == true`
2. Decrypt email body
3. Select LLM chain (load balanced)
4. Send POST request to N8N webhook
5. N8N calls Google Gemini
6. Returns: summary + 3 reply suggestions
7. Backend encrypts + stores results
8. Email becomes available on Lyra dashboard

---

# 📁 Project Structure

```
Velora/
├── controllers/
├── services/
├── models/
├── middleware/
├── routes/
├── utils/
│   ├── encryption.js
│   ├── logger.js
│   ├── cronJobs.js
├── logs/
└── server.js
```

---

# 🔐 Security Details

* AES‑256‑GCM encryption for email fields
* OAuth tokens encrypted before DB
* JWT stored in httpOnly cookie
* HTTPS enforced
* N8N webhook protected with signed JWT
* Only backend can access MongoDB (IP restrictions)
* Pub/Sub message validation

---

# 📜 Logging (Winston)

* Daily rotate logs
* JSON logs with timestamps
* Separate error/info logs
* Retention: 14 days

---

# 🌐 Deployment Guide

### Backend (AWS EC2)

* Node.js
* PM2 (process manager)
* Nginx reverse proxy
* Certbot SSL

### Frontend (Amplify)

* Auto builds from Git
* Global CDN
* Custom domain

### N8N (DigitalOcean)

* Runs workflow engine
* Gemini integration
* SSL + Nginx

---

# 🧭 Roadmap

* Redis caching
* WebSocket live updates
* Deduplication of webhook events
* Outlook/Microsoft 365 support
* Multi-language summarization

---

# 🤝 Contributing

PRs welcome! Please follow code style and include detailed explanations.

---

# 📧 Contact

**Developer:** Darshan Kania
**Email:** [darshankania2604@gmail.com](mailto:darshankania2604@gmail.com)

---

Velora powers **MailFlare** — Illuminate Your Inbox ⚡
