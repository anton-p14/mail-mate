🛡️ AI Email Privacy Shield

"Security" (https://img.shields.io/badge/Security-Phishing%20Protection-red)
"Chrome Extension" (https://img.shields.io/badge/Platform-Chrome%20Extension-blue)
"AI Powered" (https://img.shields.io/badge/AI-Mistral%20Powered-purple)
"License" (https://img.shields.io/badge/License-MIT-green)

AI Email Privacy Shield is a cybersecurity-focused Chrome extension that protects Gmail users from phishing, scam, and malicious links using a multi-layer threat detection pipeline powered by threat intelligence APIs, phishing databases, and AI analysis.

The extension scans links inside Gmail emails in real-time and provides a security banner indicating potential threats.

---

🚀 Features

🔍 Real-time phishing detection
🛡 Multi-layer security architecture
🤖 AI-powered threat analysis
📡 Google Safe Browsing integration
🗂 OpenPhish phishing database detection
🔄 Manual email rescan feature
⚡ Fast and lightweight scanning
🔒 Privacy-first design (no email content sent externally)

---

🧠 Security Detection Pipeline

AI Email Privacy Shield uses a 4-layer security architecture.

Email URL
   │
   ▼
Layer 1 → Rule-based detection
   │
   ▼
Layer 2 → Google Safe Browsing API
   │
   ▼
Layer 3 → OpenPhish Database
   │
   ▼
Layer 4 → Mistral AI Analysis

The system stops scanning as soon as a threat is detected.

---

🔎 Detection Layers

🧩 Layer 1 — Rule-Based Detection

Detects suspicious URLs using heuristic analysis:

• URL shorteners (bit.ly, tinyurl, etc)
• suspicious keywords ("login", "verify", "secure", "update")
• IP-address based links

Severity returned:

SUSPICIOUS

---

🌐 Layer 2 — Google Safe Browsing

URLs are checked against Google's malware and phishing intelligence database.

Severity returned:

HIGH_RISK

---

🗂 Layer 3 — OpenPhish Database

The extension loads a local phishing dataset from:

data/phishing-db.json

Domains are compared with the OpenPhish dataset.

Severity returned:

HIGH_RISK

---

🤖 Layer 4 — AI Security Analysis (Mistral)

If the previous layers return SAFE, the URL is analyzed using Mistral AI.

The AI classifies links as:

SAFE
PHISHING
SCAM
SPAM

Severity mapping:

Classification| Severity
SAFE| SAFE
PHISHING| HIGH_RISK
SCAM| MEDIUM_RISK
SPAM| MEDIUM_RISK

---

🔒 Privacy-First Design

AI Email Privacy Shield follows a privacy-preserving architecture.

✅ Email content is never sent externally
✅ Only extracted URLs are analyzed
✅ No personal data is stored or tracked

This ensures user privacy while maintaining strong phishing protection.

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

"config.js" stores API keys and is excluded from GitHub.

---

⚙️ Configuration

Create a file named:

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

---

2️⃣ Add API keys

Create "config.js" with your API keys.

---

3️⃣ Load extension in Chrome

Open:

chrome://extensions

Enable Developer Mode

Click:

Load Unpacked

Select the project folder.

---

🔗 APIs Used

• Google Safe Browsing API
• Mistral AI
• OpenPhish phishing dataset

---

📊 Example Threat Detection

Example detection output:

🚨 High Risk: Phishing link detected
Layer Triggered: OpenPhish Database
Domain: fake-paypal-login.xyz

---

🧩 Future Improvements

📊 phishing analytics dashboard
🛡 advanced domain reputation scoring
🔄 auto-updating phishing database

---

📜 License

MIT License

---

👨‍💻 Author

Anton P
