🛡️Email Privacy Shield

AI Email Privacy Shield is a Chrome extension designed to protect Gmail users from phishing, scam, and malicious links using a multi-layer cybersecurity detection pipeline.

The extension scans URLs inside Gmail emails and analyzes them using threat intelligence APIs, phishing databases, and AI-powered analysis.

---

🚀 Features

- 🛡 Multi-layer phishing detection
- 🌐 Google Safe Browsing integration
- 🗂 OpenPhish phishing database lookup
- 🤖 AI-powered URL analysis using Mistral
- 🔒 Privacy-focused design (email content is never sent externally)
- 🔄 Manual email rescan option
- ⚡ Real-time security banner in Gmail
- 🚀 Lightweight and fast analysis

---

🧠 Security Detection Pipeline

The extension uses a 4-layer threat detection architecture.

Layer 1 — Rule-Based Detection

Detects suspicious links using heuristics such as:

- URL shorteners
- suspicious keywords ("login", "verify", "secure", "update", "account", "bank")
- IP-address based URLs

Severity returned:

"SUSPICIOUS"

---

Layer 2 — Google Safe Browsing API

Checks URLs against Google's malware and phishing intelligence database.

Severity returned:

"HIGH_RISK"

---

Layer 3 — OpenPhish Database

Matches domains against a locally stored phishing dataset.

Severity returned:

"HIGH_RISK"

---

Layer 4 — AI Security Analysis (Mistral)

If the first three layers return SAFE, the URL is analyzed using Mistral AI.

The AI classifies links as:

- SAFE
- PHISHING
- SCAM
- SPAM

Severity mapping:

Classification| Severity
SAFE| SAFE
PHISHING| HIGH_RISK
SCAM| MEDIUM_RISK
SPAM| MEDIUM_RISK

---

🔒 Privacy Design

This extension follows a privacy-first cybersecurity approach.

✔ Email content is never sent to external services
✔ Only extracted URLs are analyzed
✔ No user data is stored or tracked

---

📁 Project Structure

AI-Email-Privacy-Shield
│
├── manifest.json
├── background.js
├── content.js
├── popup.js
│
├── config.js
├── config.example.js
│
├── data
│   └── phishing-db.json
│
├── icons
│
└── README.md

"config.js" contains API keys and is excluded from GitHub.

---

⚙️ Configuration

Create a file called:

config.js

Example configuration:

const API_KEYS = {
  GOOGLE_SAFE_BROWSING: "YOUR_GOOGLE_SAFE_BROWSING_API_KEY",
  MISTRAL: "YOUR_MISTRAL_API_KEY"
};

The extension loads this file using:

importScripts("config.js");

---

🧪 Installation

1️⃣ Clone the repository

git clone https://github.com/yourusername/ai-email-privacy-shield.git

2️⃣ Add API keys

Create a "config.js" file with your API keys.

3️⃣ Load extension in Chrome

Open:

chrome://extensions

Enable Developer Mode

Click:

Load Unpacked

Select the project folder.

---

🔗 APIs Used

- Google Safe Browsing API
- Mistral AI
- OpenPhish phishing dataset

---

🧩 Future Improvements

- 📬 Outlook email protection
- 📊 Advanced domain reputation scoring
- 📈 Phishing analytics dashboard
- 🏢 Enterprise email security
- 🔄 Auto-updating phishing database

---

📜 License

This project is licensed under the MIT License.
