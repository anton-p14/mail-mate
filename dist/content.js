// AI Email Privacy Shield - Content Script

const PHISHING_KEYWORDS = [
    'verify',
    'urgent',
    'account suspended',
    'payment failed',
    'security alert',
    'login immediately',
    'free money',
    'winner',
    'prize',
    'lottery'
];

const SUSPICIOUS_SENDERS = [
    'no-reply',
    'unknown domain',
    'support-security'
];

function analyzeEmail(sender, subject) {
    const lowerSubject = subject.toLowerCase();
    for (const keyword of PHISHING_KEYWORDS) {
        if (lowerSubject.includes(keyword)) {
            return 'HIGH_RISK';
        }
    }

    const lowerSender = sender.toLowerCase();
    for (const suspicious of SUSPICIOUS_SENDERS) {
        if (lowerSender.includes(suspicious)) {
            return 'SUSPICIOUS';
        }
    }

    return 'SAFE';
}

function injectBadge(row, risk) {
    if (row.querySelector(".ai-risk-badge")) {
        return;
    }

    const badge = document.createElement("span");
    badge.classList.add("ai-risk-badge");

    if (risk === 'HIGH_RISK') {
        badge.textContent = 'HIGH RISK';
        badge.classList.add('high-risk');
    } else if (risk === 'SUSPICIOUS') {
        badge.textContent = 'SUSPICIOUS';
        badge.classList.add('suspicious');
    } else {
        badge.textContent = 'SAFE';
        badge.classList.add('safe');
    }

    const subjectContainer = row.querySelector(".bog");
    if (subjectContainer) {
        subjectContainer.prepend(badge);
    }
}

function scanInbox() {
    const rows = document.querySelectorAll("tr.zA");
    rows.forEach(row => {
        const subjectElement = row.querySelector(".bog");
        const senderElement = row.querySelector(".yX");

        if (!senderElement) {
            return;
        }

        const subject = subjectElement ? subjectElement.textContent : "";
        const sender = senderElement ? senderElement.textContent : "";

        const risk = analyzeEmail(sender, subject);
        injectBadge(row, risk);
    });
}

// Observe Gmail's dynamic DOM
const observer = new MutationObserver((mutations) => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
        observer.disconnect();
        return;
    }
    scanInbox();
    checkOpenEmail();
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Run initially
scanInbox();

let checkingOpenEmail = false;
let analyzedUrls = {};

// Open Email Analysis via Message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYZE_OPEN_EMAIL') {
        getOpenEmailData().then(data => {
            if (data) {
                sendResponse(data);
            } else {
                sendResponse({ error: "Email body not found" });
            }
        });
        return true; // Keep message channel open for async response
    }

    if (message.type === 'RESCAN_EMAIL') {
        console.log("Manual email rescan started");
        runEmailSecurityScan(sendResponse);
        return true;
    }
});

async function runEmailSecurityScan(sendResponse) {
    const emailBody = document.querySelector(".ii.gt");
    if (!emailBody) {
        if (sendResponse) sendResponse({ error: "Email body not found" });
        return;
    }

    // Reset Tracking flags
    checkingOpenEmail = true;
    analyzedUrls = {};
    emailBody.querySelectorAll(".ai-detected-tracker").forEach(el => el.classList.remove("ai-detected-tracker"));

    // Reset visual banner to default scanning state
    const wrapper = document.querySelector(".ai-security-card-wrapper");
    if (wrapper) {
        const iframe = wrapper.querySelector("iframe");
        if (iframe) {
            const scanThreat = encodeURIComponent(JSON.stringify([{
                type: '🔎 Rescanning email for threats...',
                description: 'Re-analyzing all links and content against the 4-layer pipeline.',
                severity: 'low'
            }]));
            iframe.src = chrome.runtime.getURL(`index.html?view=panel&trust=100&privacy=100&threats=${scanThreat}&banner=true`);
        }
    }

    const rawLinks = Array.from(emailBody.querySelectorAll("a")).map(a => a.href).filter(url => url && url.startsWith('http'));
    const uniqueLinks = [...new Set(rawLinks)];
    console.log(`URLs extracted: ${uniqueLinks.length}`);

    const settings = await new Promise(resolve => {
        chrome.storage.local.get(['settings'], (res) => resolve(res.settings || {}));
    });

    chrome.runtime.sendMessage({ type: 'BULK_RESCAN', urls: uniqueLinks, settings }, async (response) => {
        checkingOpenEmail = false;

        if (response && response.results) {
            for (const [url, res] of Object.entries(response.results)) {
                analyzedUrls[url] = { severity: res.severity };
            }
        }

        // Redraw security banner based on new data and force checkOpenEmail to complete redraw
        if (wrapper) wrapper.remove();
        await checkOpenEmail();

        if (sendResponse) {
            sendResponse(await getOpenEmailData());
        }
    });
}

// Trusted domains — skip tracking pixel detection for these
const TRUSTED_DOMAINS = [
    'google.com', 'gmail.com', 'gstatic.com',
    'mail.google.com', 'accounts.google.com',
    'vercel.com', 'github.com', 'apple.com', 'amazon.com',
    'microsoft.com', 'linkedin.com', 'youtube.com', 'twitter.com',
    'facebook.com', 'instagram.com', 'stripe.com', 'cloudflare.com'
];

const isGoogleInternal = (src) => {
    if (!src) return true;
    return TRUSTED_DOMAINS.some(d => src.includes(d));
};

// Calculate data for inline injection and apply blocks
async function getOpenEmailData() {
    console.log("Pixel scan started");
    const emailBody = document.querySelector(".ii.gt");
    if (!emailBody) return null;

    // Get Settings
    const settings = await new Promise(resolve => {
        chrome.storage.local.get(['settings'], (res) => resolve(res.settings || {}));
    });
    const trackerBlockingEnabled = settings.trackerBlocking !== false;

    // Tracking Pixel Detection (Dynamic via MutationObserver)
    const isTracker = (img) => {
        if (!img.src || img.src.startsWith('data:') || isGoogleInternal(img.src)) return false;

        // Gmail caches images via googleusercontent.com, but the original path is often in the hash or query string
        const src = img.src.toLowerCase();

        // Rule 1: Dimensions
        const width = parseInt(img.getAttribute('width')) || img.naturalWidth || img.width;
        const height = parseInt(img.getAttribute('height')) || img.naturalHeight || img.height;
        if ((width > 0 && width <= 1) || (height > 0 && height <= 1)) return true;

        // Rule 2: CSS Styles (hidden, 0 opacity, 1px)
        const styleContent = (img.getAttribute('style') || '').replace(/\s/g, '');
        if (styleContent.includes('display:none') ||
            styleContent.includes('opacity:0') ||
            styleContent.includes('width:1px') ||
            styleContent.includes('height:1px')) return true;

        // Rule 3: Common tracking parameter keywords
        if (src.includes('track') || src.includes('pixel') || src.includes('open') || src.includes('beacon') || src.includes('analytics')) return true;

        return false;
    };

    const processTracker = (img) => {
        console.log("Tracking pixel detected");

        if (trackerBlockingEnabled) {
            img.removeAttribute('src'); // Stop payload

            // Replace visual footprint
            const lockElem = document.createElement("span");
            lockElem.className = "ai-blocked-tracker";
            lockElem.textContent = "🔒 Tracking pixel blocked";
            lockElem.style.cssText = "font-size: 11px; color: #d97706; background-color: #fef3c7; padding: 2px 4px; border-radius: 4px; border: 1px solid #fcd34d; font-family: sans-serif; display: inline-block; user-select: none; margin: 2px;";
            lockElem.title = "A hidden tracking pixel was blocked from loading.";

            if (img.parentNode) {
                img.parentNode.replaceChild(lockElem, img);
            }
            console.log("Tracking pixel blocked");
        } else {
            img.classList.add("ai-detected-tracker");
        }
    };

    // Attach observer if not already on this email body
    if (!emailBody.dataset.aiTrackerObserver) {
        emailBody.dataset.aiTrackerObserver = "true";
        const observer = new MutationObserver((mutations) => {
            let newlyDetected = false;
            mutations.forEach(mutation => {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName === 'IMG' && !node.classList.contains('ai-detected-tracker') && isTracker(node)) {
                            processTracker(node);
                            newlyDetected = true;
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll('img:not(.ai-detected-tracker)').forEach(img => {
                                if (isTracker(img)) {
                                    processTracker(img);
                                    newlyDetected = true;
                                }
                            });
                        }
                    });
                }
            });
            if (newlyDetected) {
                // Remove banner to trigger redrawing with updated count
                const wrapper = document.querySelector(".ai-security-card-wrapper");
                if (wrapper) wrapper.remove();
            }
        });
        observer.observe(emailBody, { childList: true, subtree: true });
    }

    // Process initially existing images (and re-process if settings changed to enabled)
    if (trackerBlockingEnabled) {
        emailBody.querySelectorAll("img.ai-detected-tracker").forEach(img => {
            img.classList.remove("ai-detected-tracker");
        });
    }

    const existingImages = emailBody.querySelectorAll("img:not(.ai-detected-tracker)");
    existingImages.forEach(img => {
        if (isTracker(img)) processTracker(img);
    });

    const trackingPixelsDetected = emailBody.querySelectorAll(".ai-blocked-tracker, .ai-detected-tracker").length;

    if (trackingPixelsDetected > 0) {
        console.log(`Total trackers blocked: ${trackingPixelsDetected}`);
    }

    // Extract, deduplicate, and whitelist-filter links (max 5 URLs to avoid quota abuse)
    const rawLinks = Array.from(emailBody.querySelectorAll("a"))
        .map(a => a.href)
        .filter(url => url && url.startsWith('http'));

    // Filter URLs strictly based on user requirement
    const uniqueLinks = [...new Set(rawLinks)];
    const filteredLinks = [];

    for (const url of uniqueLinks) {
        if (!url.startsWith('http')) continue;

        try {
            const domain = new URL(url).hostname.replace(/^www\./, '');
            const lowerUrl = url.toLowerCase();

            // Ignore mandatory domains/patterns
            if (domain.includes('google.com') ||
                domain.includes('gmail.com') ||
                lowerUrl.includes('mailto:') ||
                lowerUrl.includes('unsubscribe') ||
                lowerUrl.includes('#')) {
                continue;
            }

            filteredLinks.push(url);
        } catch {
            continue;
        }
    }

    console.log("Filtered valid links:", filteredLinks.length);

    // Send each valid filtered URL to background for analysis
    const suspiciousLinks = [];
    filteredLinks.forEach((url, index) => {
        if (analyzedUrls[url]) {
            if (analyzedUrls[url].severity === 'MEDIUM_RISK' || analyzedUrls[url].severity === 'HIGH_RISK') {
                const mappedSeverity = analyzedUrls[url].severity === 'HIGH_RISK' ? 'high' : 'medium';
                suspiciousLinks.push({
                    url: url,
                    reason: 'Threat flagged by security scan',
                    severity: mappedSeverity,
                    message: 'Suspicious Link Detected'
                });
            }
            return;
        }
        analyzedUrls[url] = { severity: 'PENDING' };
        console.log("Sending URL for analysis:", url);
        chrome.runtime.sendMessage({
            type: 'CHECK_URL',
            url,
            settings,
            isFirstUrl: index === 0 // Used by background to reset VT limits per scan
        });
    });

    const openEmailSenderDetails = document.querySelector(".gD");
    const openEmailSenderAddress = openEmailSenderDetails ? openEmailSenderDetails.getAttribute('email') : 'Unknown Domain';
    let domainStr = 'Unknown';
    if (openEmailSenderAddress && openEmailSenderAddress.includes('@')) {
        domainStr = openEmailSenderAddress.split('@')[1];
    }

    const subjectElement = document.querySelector("h2.hP");
    const subjectText = subjectElement ? subjectElement.innerText : "";

    let trustScore = 100;
    let privacyScore = 100;

    if (trackingPixelsDetected > 0) privacyScore -= (trackingPixelsDetected * 15);
    if (suspiciousLinks.length > 0) {
        trustScore -= (suspiciousLinks.length * 20);
        privacyScore -= 20;
    }
    if (analyzeEmail(openEmailSenderAddress, subjectText) === 'SUSPICIOUS') {
        trustScore -= 30;
    }

    trustScore = Math.max(0, trustScore);
    privacyScore = Math.max(0, privacyScore);

    return {
        sender: openEmailSenderAddress,
        domain: domainStr,
        trustScore,
        privacyScore,
        trackingPixelsDetected,
        suspiciousLinks,
        trackerBlockingEnabled
    };
}

// Inject iframe banner above the email subject
async function checkOpenEmail() {
    const subjectElement = document.querySelector("h2.hP");
    if (!subjectElement) return;

    if (document.querySelector(".ai-security-card-wrapper") || checkingOpenEmail) return;
    checkingOpenEmail = true;

    const data = await getOpenEmailData();
    if (!data) {
        checkingOpenEmail = false;
        return;
    }

    // Recheck because UI might have changed while awaiting
    if (document.querySelector(".ai-security-card-wrapper") || !document.querySelector("h2.hP")) {
        checkingOpenEmail = false;
        return;
    }

    const threats = [];
    if (data.trackingPixelsDetected > 0) {
        if (data.trackerBlockingEnabled) {
            threats.push({
                type: `⚠ Privacy Protection: ${data.trackingPixelsDetected} tracking pixel(s) blocked`,
                description: `Hidden tracking pixel(s) automatically neutralized`,
                severity: 'medium'
            });
        } else {
            threats.push({
                type: '⚠ Tracking Pixel Detected',
                description: `${data.trackingPixelsDetected} hidden tracking pixel(s) found`,
                severity: 'medium'
            });
        }
    }

    // Group link threats to show the highest severity message
    if (data.suspiciousLinks && data.suspiciousLinks.length > 0) {
        const getSevLevel = (sev) => sev === 'high' ? 3 : (sev === 'medium' ? 2 : 1);
        const sortedLinks = [...data.suspiciousLinks].sort((a, b) => getSevLevel(b.severity) - getSevLevel(a.severity));
        const topLink = sortedLinks[0];

        if (topLink.severity === 'high') {
            threats.push({
                type: '🚨 High Risk: Phishing or malicious link detected',
                description: `${data.suspiciousLinks.length} dangerous link(s) flagged by security databases`,
                severity: 'high'
            });
        } else if (topLink.severity === 'medium') {
            threats.push({
                type: '⚠ Medium Risk: Potential phishing or scam link detected',
                description: `${data.suspiciousLinks.length} suspicious link(s) detected`,
                severity: 'medium'
            });
        } else {
            threats.push({
                type: '⚠ Suspicious email detected',
                description: `${data.suspiciousLinks.length} suspicious link(s) detected`,
                severity: 'low'
            });
        }
    }

    // Determine final console log and SAFE state
    if (threats.length === 0) {
        console.log("✅ Safe Email (No threats detected)");
    }
    if (data.trustScore < 80 && threats.length === 0) {
        threats.push({
            type: '⚠ Suspicious Sender',
            description: `Sender failed security checks`,
            severity: 'medium'
        });
    }

    const container = document.createElement("div");
    container.classList.add("ai-security-card-wrapper");
    container.style.width = "520px";
    container.style.maxWidth = "90%";
    container.style.minWidth = "300px";
    container.style.marginBottom = "12px";
    container.style.display = "block";

    const iframe = document.createElement("iframe");
    iframe.classList.add("ai-security-card");

    console.log("Updating security banner with result:", threats.length > 0 ? threats : "🛡 Safe Email – No threats detected");

    const threatsParam = encodeURIComponent(JSON.stringify(threats));
    try {
        const url = chrome.runtime.getURL(`index.html?view=panel&trust=${data.trustScore}&privacy=${data.privacyScore}&threats=${threatsParam}&banner=true`);
        iframe.src = url;
    } catch (e) {
        console.warn("AI Email Privacy Shield: Extension context invalidated. Please refresh the page.");
        checkingOpenEmail = false;
        return;
    }

    iframe.style.width = "100%";
    iframe.style.border = "none";
    iframe.style.height = "auto";
    iframe.style.overflow = "visible";
    iframe.style.background = "transparent";
    iframe.style.display = "block";

    container.appendChild(iframe);

    const subjectWrapper = subjectElement.closest('.ha') || subjectElement.parentNode;
    if (subjectWrapper && subjectWrapper.parentNode) {
        subjectWrapper.parentNode.insertBefore(container, subjectWrapper);
    } else {
        subjectElement.parentNode.insertBefore(container, subjectElement);
    }

    checkingOpenEmail = false;
}

// Listen for background URL analysis results (ANALYSIS_RESULT from background.js)
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'ANALYSIS_RESULT') {
        if (analyzedUrls[message.url]) {
            analyzedUrls[message.url].severity = message.severity;
            if (message.severity !== 'LOW_RISK') {
                const wrapper = document.querySelector(".ai-security-card-wrapper");
                if (wrapper) wrapper.remove(); // Force redraw with new threat data
                checkOpenEmail();
            }
        }
    }
});

// When the user toggles tracker blocking in the popup, immediately re-scan the open email
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes.settings) {
        const oldTrackerBlocking = changes.settings.oldValue?.trackerBlocking;
        const newTrackerBlocking = changes.settings.newValue?.trackerBlocking;
        if (oldTrackerBlocking !== newTrackerBlocking) {
            console.log("Tracker blocking setting changed to:", newTrackerBlocking, "→ re-scanning email");
            // Remove the current banner and re-run the full scan with updated settings
            const wrapper = document.querySelector(".ai-security-card-wrapper");
            if (wrapper) wrapper.remove();
            checkingOpenEmail = false;
            checkOpenEmail();
        }
    }
});

// Listen for messages from injected React iframe (View Details button)
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'OPEN_POPUP') {
        chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
    }
});
