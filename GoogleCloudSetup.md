# ☁️ Google Cloud Setup for MailFlare

## ✅ 1. Google OAuth Setup

**Goal:** Let users securely sign in and authorize access to their Gmail.

### Steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/).

2. Create a new project (e.g., `Velora`).

3. Go to **APIs & Services > OAuth consent screen**:

   * Choose **External**.
   * Fill in:

     * **App name**
     * **User support email**
     * **Developer contact email**
   * Scopes to include:

     * `https://www.googleapis.com/auth/gmail.readonly`
     * `https://www.googleapis.com/auth/gmail.send`
     * `https://www.googleapis.com/auth/userinfo.profile`
     * `https://www.googleapis.com/auth/userinfo.email`
   * Add your frontend domain in **Authorized domains** (e.g., `mailflare.tech`).

4. Go to **Credentials > Create credentials > OAuth Client ID**

   * Choose **Web Application**
   * Add:

     * **Authorized redirect URIs**: `https://mailflare.tech/auth/google/callback`
     * **Authorized JavaScript origins**: `https://mailflare.tech`

5. Save the **Client ID** and **Client Secret**.

---

## ✅ 2. Gmail API Setup

**Goal:** Programmatically read/send/summarize emails using Gmail API.

### Steps:

1. Enable **Gmail API** for your project:

   * Go to **APIs & Services > Library**
   * Search “Gmail API” → Enable

2. Ensure OAuth scopes are correctly added (see above).

3. Users must authorize these scopes through your OAuth flow.

---

## ✅ 3. Pub/Sub for Gmail Push Notifications (Webhooks)

**Goal:** Gmail notifies your backend (Velora) when a new email arrives.

### Steps:

1. Enable **Pub/Sub API**:

   * Go to **APIs & Services > Library** → Search and enable “Pub/Sub API”

2. Create a **Pub/Sub topic**:

   * Go to **Pub/Sub > Topics > Create topic**
   * Name it: `mailflare-inbox-updates`
   * Enable **message retention**

3. Create a **Subscription**:

   * Type: **Push**
   * Webhook endpoint: `https://velora.mailflare.tech/api/google/pubsub`
   * Secure the endpoint using JWT token or API key

4. Grant Gmail permission to publish:

   * Add Gmail service account `gmail-api-push@system.gserviceaccount.com`
   * Role: **Publisher** to your topic

5. Register the Watch:

   * Use Gmail API `watch()` endpoint
   * Request Body Example:

```json
{
  "labelIds": ["INBOX"],
  "topicName": "projects/your-project-id/topics/mailflare-inbox-updates"
}
```

---

This configuration enables secure authentication, Gmail access, and real-time email update notifications for MailFlare.
