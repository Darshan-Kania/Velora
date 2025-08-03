# 📬 MailFlare — Your Smart AI-Powered Email Assistant! ✨

Welcome to **MailFlare**, the future of email management! 🚀 Imagine having **all your emails summarized** before you even open your inbox — with suggested replies ready to go at the click of a button. MailFlare uses cutting-edge AI to save your time, boost your productivity, and keep your inbox under control. 🎯

---

## 🔥 What is MailFlare?

MailFlare is a smart mailing system built on the MERN stack:

* **Frontend:** Lyra
* **Backend:** Velora
* **AI Workflows:** n8n automation for email summarization & reply drafts
* **Database:** MongoDB to securely store emails, summaries & draft replies
* **Security:** Strong encryption, authentication, and privacy-first design
* **Authentication:** Google OAuth for secure user login
* **Hosting:** Hosted on AWS for reliable and scalable deployment
* **Logging:** Winston logger with daily log rotation and error-level separation

**Key Features:**

* 📩 Fetches all incoming emails via a secure webhook
* 🧠 Summarizes emails using AI workflows in n8n
* ✍️ Generates intelligent draft replies for you
* 🚫 Allows filtering emails by sender ID to exclude AI processing
* 📋 User dashboard to view summaries, filter emails & send replies with one click
* 🔒 End-to-end secure handling — your data stays private and protected!
* 🔑 Secure Google OAuth sign-in to protect user accounts
* ☁️ Robust cloud hosting on AWS ensuring uptime and scalability
* 📜 Logging with Winston and Daily Rotate File — stores logs by date, compresses old logs, and tracks errors & events

---

## 🛠 Installation, Hosting & Setup

1. **Clone the backend Velora repo**
2. Configure `.env` with your email credentials, webhook secrets, n8n API keys, MongoDB URI, and Google OAuth credentials
3. Set up your email provider to forward incoming emails to your backend’s webhook endpoint
4. Deploy your MongoDB (preferably MongoDB Atlas)
5. Deploy backend and frontend on AWS EC2 or Lightsail:

   * Create and configure an EC2 instance or Lightsail VM
   * Install Node.js, NPM, and Git
   * Clone your repos, install dependencies (`npm install`), and build frontend (`npm run build`)
   * Use Nginx as a reverse proxy and PM2 to keep apps running
   * Configure HTTPS with Let’s Encrypt SSL certificates
6. Set up Google OAuth Credentials in Google Cloud Console, get Client ID & Secret
7. Integrate Google OAuth in your backend (Velora) and frontend (Lyra) for secure login
8. Deploy and configure n8n workflows for:

   * Email summarization
   * Draft reply generation
9. Setup Winston Logging:

   * Install `winston` and `winston-daily-rotate-file`
   * Configure logger with timestamped format and rotation logic
   * Store logs in `/logs/%DATE%.log` and rotate them daily, keep for 14 days
   * Log both to file and console in production
10. Start backend server and connect your frontend Lyra app
11. Launch frontend and log in to your dashboard with Google account

---

## 🚦 How It Works (Step-by-Step)

1. Incoming email arrives → forwarded securely to MailFlare backend webhook
2. Backend validates & filters email based on user-defined **sender exclusion list**
3. Allowed emails are passed to n8n workflows:

   * Summarized by AI
   * Draft reply generated
4. Store summary & reply draft in MongoDB
5. User sees emails & summaries in the dashboard, with drafts ready to send
6. User clicks **Send** → backend sends the reply email for you
7. User logs in securely each time via Google OAuth
8. Winston logs every email fetch, processing step, and errors to log files by date

---

## 🖼 Dashboard Highlights

* ✨ View all incoming emails with neat AI summaries
* 🚫 Easily add/remove email addresses from the **AI-exempt filter** — emails from these senders won’t be processed or summarized
* 📧 Preview and edit AI-generated draft replies
* 📨 One-click send button to reply instantly
* 🔒 Fully secure and private — no data leaks!
* 🔑 Google sign-in for seamless & secure access

---

## 🔐 Security & Privacy

At MailFlare, your privacy is our priority:

* Use of encrypted HTTPS for all API communication
* Secure JWT-based user authentication alongside Google OAuth
* Webhook validation with secret tokens & signatures
* Least privileged API keys for AI & n8n integrations only
* Data encrypted at rest in MongoDB
* No data shared with external parties without your consent
* AWS hosting with security best practices, firewall, and monitoring
* Logging system that tracks activity without exposing private data

---

## 🎯 Future Plans & Enhancements

* Multi-language summarization & replies 🌍
* Customizable AI context & summary length settings 🎛️
* Email categorization and priority tagging ⚡
* Smart reminders & follow-up actions 🗓️
* Additional social login options beyond Google OAuth 🔄

---

## ❤️ Contributing

Found a bug or have a feature idea? Pull requests & issues are welcome! Let's make MailFlare the smartest inbox companion together. 🙌

---

## 📧 Contact

For support or feedback, reach out at **[darshankania2604@gmail.com](mailto:darshankania2604@gmail.com)**

---

**MailFlare** — Light up your Inbox 🌟, save time & stay ahead of the mail flood!
