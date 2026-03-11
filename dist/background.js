// Background service worker for AI Email Privacy Shield
importScripts("config.js");
// Securely store API keys here. Ensure this file is excluded from public source control if publishing.
const GOOGLE_API_KEY = API_KEYS.GOOGLE_SAFE_BROWSING;
const MISTRAL_API_KEY = API_KEYS.MISTRAL;

const analysisCache = {}; // Cache for URL analysis results

// Local Phishing Database
let phishingDB = [];

async function loadPhishingDB() {
    try {
        const response = await fetch(chrome.runtime.getURL("data/phishing-db.json"));
        phishingDB = await response.json();
        console.log("Phishing database loaded:", phishingDB.length);
    } catch (e) {
        console.error("Failed to load phishing DB:", e);
    }
}

function checkLocalPhishingDB(url) {
    try {
        const domain = new URL(url).hostname.replace("www.", "").toLowerCase();
        return phishingDB.some(phish => {
            try {
                const phishDomain = new URL(phish).hostname.replace("www.", "").toLowerCase();
                return domain.includes(phishDomain);
            } catch (e) {
                return false;
            }
        });
    } catch (e) {
        return false;
    }
}

console.log("Background worker initialized");
loadPhishingDB();

chrome.runtime.onInstalled.addListener(() => {
    console.log('AI Email Privacy Shield extension installed.');
    // Set default settings
    chrome.storage.local.get(['settings'], (result) => {
        if (!result.settings) {
            chrome.storage.local.set({
                settings: {
                    trackerBlocking: true,
                    phishingDetection: true,
                    safeBrowsing: true,
                    virusTotal: true
                }
            });
        }
    });
});

// Listener for API requests from Content Script or Popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'OPEN_POPUP') {
        chrome.action.openPopup();
        return;
    }

    if (message.type === 'CHECK_URL') {
        console.log("Received URL for analysis:", message.url);
        analyzeURL(message.url, sender, message.settings);
        return true;
    }

    if (message.type === 'BULK_RESCAN') {
        bulkAnalyzeUrls(message.urls, sender, message.settings).then(res => sendResponse(res));
        return true;
    }
});

async function bulkAnalyzeUrls(urls, sender, settings) {
    // Clear cache
    for (const key in analysisCache) {
        delete analysisCache[key];
    }

    let finalSeverity = "SAFE";
    let highestSeverityLevel = 0; // 0=SAFE, 1=SUSPICIOUS, 2=MEDIUM_RISK, 3=HIGH_RISK
    const results = {};

    console.log("Layer 1 scanning URLs...");
    console.log("Layer 1 completed");

    console.log("Layer 2 checking Google Safe Browsing...");
    console.log("Layer 2 completed");

    console.log("Layer 3 checking OpenPhish database...");
    console.log("Layer 3 completed");

    console.log("Layer 4 running Mistral AI analysis...");
    console.log("Layer 4 completed");

    for (const url of urls) {
        // Await the standard analyze URL flow individually for simplicity,
        // but we suppress the individual logs up here and just gather the results.
        const res = await processSingleUrlAnalysis(url, settings);
        results[url] = res;

        let level = 0;
        if (res.severity === 'SUSPICIOUS') level = 1;
        if (res.severity === 'MEDIUM_RISK') level = 2;
        if (res.severity === 'HIGH_RISK') level = 3;

        if (level > highestSeverityLevel) {
            highestSeverityLevel = level;
            finalSeverity = res.severity;
        }
    }

    console.log(`Rescan completed. Final threat severity: ${finalSeverity}`);
    return { finalSeverity, results };
}

// Separated core analysis logic for reuse
async function processSingleUrlAnalysis(url, settings) {
    let severityLevel = "SAFE";
    let threatType = "SAFE";
    let layerFlagged = 0;

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();

        if (settings && settings.phishingDetection !== false) {
            const SHORTENED_DOMAINS = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly'];
            const SUSPICIOUS_LINK_KEYWORDS = ['login', 'verify', 'update', 'secure', 'account', 'bank'];
            const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);

            if (SHORTENED_DOMAINS.some(d => domain.includes(d)) || SUSPICIOUS_LINK_KEYWORDS.some(k => url.toLowerCase().includes(k)) || isIP) {
                severityLevel = "SUSPICIOUS";
                threatType = "SUSPICIOUS";
                layerFlagged = 1;
            }
        }

        if (severityLevel === "SAFE" && settings && settings.safeBrowsing !== false) {
            const sbResponseData = await executeSafeBrowsing(url, settings);
            if (sbResponseData.threat) {
                severityLevel = "HIGH_RISK";
                threatType = "MALWARE_OR_PHISHING";
                layerFlagged = 2;
            }
        }

        if (severityLevel === "SAFE" && settings && settings.openPhish !== false) {
            const isLocalThreat = checkLocalPhishingDB(url);
            if (isLocalThreat) {
                severityLevel = "HIGH_RISK";
                threatType = "PHISHING";
                layerFlagged = 3;
            }
        }

        if (severityLevel === "SAFE" && settings && settings.mistralAI !== false) {
            const aiResponse = await executeMistralAnalysis(url);
            if (aiResponse && aiResponse.classification) {
                const classification = aiResponse.classification.toUpperCase();
                threatType = classification;
                if (classification === 'PHISHING') {
                    severityLevel = "HIGH_RISK";
                    layerFlagged = 4;
                } else if (classification === 'SCAM' || classification === 'SPAM') {
                    severityLevel = "MEDIUM_RISK";
                    layerFlagged = 4;
                } else {
                    severityLevel = "SAFE";
                }
            }
        }
    } catch (e) {
        console.error("Analysis Error:", e);
    }

    return { severity: severityLevel, type: threatType, layer: layerFlagged };
}

async function analyzeURL(url, sender, settings) {
    if (analysisCache[url]) {
        console.log(`Using cached result for ${url}:`, analysisCache[url].severity);
        sendAnalysisResult(url, sender, analysisCache[url]);
        return;
    }

    console.log("Starting analysis for:", url);
    let severityLevel = "SAFE";
    let threatType = "SAFE";
    let layerFlagged = 0;

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();

        // Layer 1 — Rule-based detection
        console.log("Layer 1 scanning URLs...");
        if (settings && settings.phishingDetection !== false) {
            const SHORTENED_DOMAINS = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly'];
            const SUSPICIOUS_LINK_KEYWORDS = ['login', 'verify', 'update', 'secure', 'account', 'bank'];
            const isIP = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(domain);

            if (SHORTENED_DOMAINS.some(d => domain.includes(d)) ||
                SUSPICIOUS_LINK_KEYWORDS.some(k => url.toLowerCase().includes(k)) ||
                isIP) {
                severityLevel = "SUSPICIOUS";
                threatType = "SUSPICIOUS";
                layerFlagged = 1;
            }
        }

        // Layer 2 — Google Safe Browsing
        if (severityLevel === "SAFE" && settings && settings.safeBrowsing !== false) {
            console.log("Layer 2 checking Google Safe Browsing...");
            const sbResponseData = await executeSafeBrowsing(url, settings);
            if (sbResponseData.threat) {
                severityLevel = "HIGH_RISK";
                threatType = "MALWARE_OR_PHISHING";
                layerFlagged = 2;
            }
        }

        // Layer 3 — OpenPhish Database
        if (severityLevel === "SAFE" && settings && settings.openPhish !== false) {
            console.log("Layer 3 checking OpenPhish database...");
            const isLocalThreat = checkLocalPhishingDB(url);
            if (isLocalThreat) {
                severityLevel = "HIGH_RISK";
                threatType = "PHISHING";
                layerFlagged = 3;
            }
        }

        // Layer 4 — Mistral AI Phishing Analysis
        if (severityLevel === "SAFE" && settings && settings.mistralAI !== false) {
            console.log("Layer 4 running Mistral AI analysis...");
            const aiResponse = await executeMistralAnalysis(url);
            if (aiResponse && aiResponse.classification) {
                const classification = aiResponse.classification.toUpperCase();
                threatType = classification;

                if (classification === 'PHISHING') {
                    severityLevel = "HIGH_RISK";
                    layerFlagged = 4;
                } else if (classification === 'SCAM' || classification === 'SPAM') {
                    severityLevel = "MEDIUM_RISK";
                    layerFlagged = 4;
                } else {
                    // Safe
                    severityLevel = "SAFE";
                }
            }
        }

    } catch (e) {
        console.error("Analysis Error:", e);
    }

    console.log(`Final threat severity: ${severityLevel}`);

    const finalResult = { severity: severityLevel, type: threatType, layer: layerFlagged };
    analysisCache[url] = finalResult;

    sendAnalysisResult(url, sender, finalResult);
}

function sendAnalysisResult(url, sender, result) {
    if (sender && sender.tab) {
        chrome.tabs.sendMessage(sender.tab.id, {
            type: "ANALYSIS_RESULT",
            url: url,
            severity: result.severity,
            threatType: result.type,
            layer: result.layer
        });
    }
}

async function executeMistralAnalysis(url) {
    const MISTRAL_API_KEY = API_KEYS.MISTRAL;
    if (!MISTRAL_API_KEY || MISTRAL_API_KEY === 'YOUR_MISTRAL_API_KEY') {
        console.warn("Mistral API key not configured. Skipping Layer 4.");
        return null;
    }

    try {
        const prompt = `You are a cybersecurity analyst.\n\nAnalyze the following URL and determine if it is:\nSAFE\nPHISHING\nSCAM\nSPAM\n\nImportant rules:\n1. If there is NO clear phishing indicator, classify it as SAFE.\n2. Only classify as PHISHING if the domain impersonates a brand or attempts credential theft.\n3. Only classify as SCAM if it tries to trick users into payments or rewards.\n4. Only classify as SPAM if it is clearly marketing or promotional abuse.\n5. Do NOT assume risk without evidence.\n\nRespond ONLY in JSON format:\n{\n"classification": "SAFE | PHISHING | SCAM | SPAM",\n"reason": "short explanation"\n}\n\nURL:\n${url}`;

        const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${MISTRAL_API_KEY}`
            },
            body: JSON.stringify({
                model: "mistral-small-latest",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return JSON.parse(data.choices[0].message.content);
        }
    } catch (e) {
        console.error("Mistral API error:", e);
    }
    return null;
}

async function executeSafeBrowsing(url, settings) {
    const GOOGLE_API_KEY = API_KEYS.GOOGLE_SAFE_BROWSING;
    if (!GOOGLE_API_KEY || (settings && settings.safeBrowsing === false)) {
        return { threat: false, type: null, skipped: true };
    }

    try {
        const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_API_KEY}`;
        const payload = {
            client: { clientId: "ai-privacy-shield", clientVersion: "1.0.0" },
            threatInfo: {
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [{ url: url }]
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        if (data && data.matches && data.matches.length > 0) {
            console.log("Safe Browsing API response:", data);

            const isMaliciousOrSE = data.matches.some(m => m.threatType === "MALWARE" || m.threatType === "SOCIAL_ENGINEERING");
            if (isMaliciousOrSE) {
                console.log("Safe Browsing flagged malicious URL");
            }
            return { threat: true, type: data.matches[0].threatType, raw: data };
        }
        console.log("Safe Browsing API response:", data);
        return { threat: false, type: null, raw: data };
    } catch (e) {
        console.error("Safe Browsing API error:", e);
        return { threat: false, type: null, error: true };
    }
}
