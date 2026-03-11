import { Shield, User, Eye, Link as LinkIcon, AlertTriangle, FileWarning, ScanLine, FileText, Settings, ArrowLeft, CheckCircle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { useState, useEffect } from 'react';

declare const chrome: any;

interface ThreatSummary {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface LinkThreat {
  url: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
}

interface ExtensionData {
  isValidPage: boolean;
  isEmailOpen: boolean;
  senderEmail?: string;
  senderName?: string;
  domain?: string;
  trustScore: number;
  privacyScore: number;
  threats: ThreatSummary[];
  trackingPixelsDetected?: number;
  suspiciousLinks?: LinkThreat[];
}

export function ExtensionPopup() {
  const [extData, setExtData] = useState<ExtensionData>({
    isValidPage: true,
    isEmailOpen: false,
    trustScore: 0,
    privacyScore: 0,
    threats: []
  });

  const [view, setView] = useState<'main' | 'report' | 'settings'>('main');
  const [scanning, setScanning] = useState(false);
  const [settings, setSettings] = useState({
    trackerBlocking: true, // Internal only, not in UI
    phishingDetection: true,
    safeBrowsing: true,
    openPhish: true,
    mistralAI: true
  });

  useEffect(() => {
    console.log("Popup opened – requesting email analysis");
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.storage.local.get(['settings'], (res: any) => {
        if (res.settings) setSettings(res.settings);
      });
      scanCurrentEmail();
    }
  }, []);

  const scanCurrentEmail = (isRescan: boolean = false) => {
    setScanning(true);
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id || !activeTab.url?.includes('mail.google.com')) {
          setExtData({ ...extData, isValidPage: false, isEmailOpen: false });
          setScanning(false);
          return;
        }

        const messageType = isRescan ? 'RESCAN_EMAIL' : 'ANALYZE_OPEN_EMAIL';
        chrome.tabs.sendMessage(activeTab.id, { type: messageType }, (response: any) => {
          if (chrome.runtime.lastError || !response || response.error) {
            setExtData({ ...extData, isValidPage: true, isEmailOpen: false });
            setScanning(false);
            return;
          }

          const newThreats: ThreatSummary[] = [];
          if (response.trackingPixelsDetected > 0) {
            newThreats.push({
              type: 'Tracking Pixel Blocked',
              description: `${response.trackingPixelsDetected} hidden tracker(s) neutralised`,
              severity: 'medium'
            });
          }

          if (response.suspiciousLinks && response.suspiciousLinks.length > 0) {
            const getSevLevel = (sev: string) => sev === 'high' ? 3 : (sev === 'medium' ? 2 : 1);
            const sortedLinks = [...response.suspiciousLinks].sort((a, b) => getSevLevel(b.severity) - getSevLevel(a.severity));
            const topLink = sortedLinks[0];

            newThreats.push({
              type: topLink.message,
              description: `${response.suspiciousLinks.length} suspicious link(s) detected`,
              severity: topLink.severity as 'low' | 'medium' | 'high'
            });
          }

          if (response.trustScore < 80 && newThreats.length === 0) {
            newThreats.push({
              type: 'Suspicious Sender',
              description: `Sender failed security checks`,
              severity: 'high'
            });
          }

          setExtData({
            isValidPage: true,
            isEmailOpen: true,
            senderEmail: response.sender,
            senderName: response.sender.split('@')[0],
            domain: response.domain,
            trustScore: response.trustScore,
            privacyScore: response.privacyScore,
            threats: newThreats,
            trackingPixelsDetected: response.trackingPixelsDetected,
            suspiciousLinks: response.suspiciousLinks || []
          });
          setScanning(false);
        });
      });
    } else {
      setScanning(false);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ settings: newSettings });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-400';
      case 'medium': return 'text-orange-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getThreatIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('tracking') || t.includes('pixel')) return Eye;
    if (t.includes('link') || t.includes('domain')) return LinkIcon;
    if (t.includes('phish') || t.includes('keyword')) return AlertTriangle;
    return ShieldAlert;
  };

  const { isValidPage, isEmailOpen, senderEmail, senderName, domain, trustScore, privacyScore, threats, suspiciousLinks, trackingPixelsDetected } = extData;

  // Header component reused across views
  const Header = () => (
    <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 shrink-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="bg-white rounded-lg p-2 shadow-inner">
          <Shield className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">AI Email Privacy Shield</h1>
          <p className="text-xs text-blue-200">Protecting your inbox</p>
        </div>
      </div>
    </div>
  );

  // --- Settings View ---
  if (view === 'settings') {
    return (
      <div className="w-[380px] h-[600px] bg-gray-950 text-white flex flex-col font-sans">
        <Header />
        <div className="flex-1 p-5 overflow-y-auto">
          <button onClick={() => setView('main')} className="flex items-center text-sm text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Analysis
          </button>
          <h2 className="text-xl font-semibold mb-6 text-white border-b border-gray-800 pb-2">Protection Settings</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-200">Layer 1: Phishing Detection</p>
                <p className="text-xs text-gray-400">Rule-based URL verification.</p>
              </div>
              <input type="checkbox" checked={settings.phishingDetection} onChange={() => toggleSetting('phishingDetection')} className="w-4 h-4 accent-blue-600 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-200">Layer 2: Google Safe Browsing</p>
                <p className="text-xs text-gray-400">Official database validation.</p>
              </div>
              <input type="checkbox" checked={settings.safeBrowsing} disabled={!settings.phishingDetection} onChange={() => toggleSetting('safeBrowsing')} className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-50" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-200">Layer 3: OpenPhish Database</p>
                <p className="text-xs text-gray-400">Local dataset link matching.</p>
              </div>
              <input type="checkbox" checked={settings.openPhish} disabled={!settings.phishingDetection || !settings.safeBrowsing} onChange={() => toggleSetting('openPhish')} className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-50" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-200">Layer 4: AI Phishing Analysis</p>
                <p className="text-xs text-gray-400">Mistral AI deep scan for unknown links.</p>
              </div>
              <input type="checkbox" checked={settings.mistralAI} disabled={!settings.phishingDetection || !settings.safeBrowsing || !settings.openPhish} onChange={() => toggleSetting('mistralAI')} className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-50" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Detailed Report View ---
  if (view === 'report') {
    return (
      <div className="w-[380px] h-[600px] bg-gray-950 text-white flex flex-col font-sans">
        <Header />
        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          <button onClick={() => setView('main')} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </button>

          <h2 className="text-lg font-semibold border-b border-gray-800 pb-2">Full Security Analysis</h2>

          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Sender Identity</h3>
              <p className="text-sm text-white"><span className="text-gray-500 w-16 inline-block">Email:</span> {senderEmail}</p>
              <p className="text-sm text-white"><span className="text-gray-500 w-16 inline-block">Domain:</span> {domain}</p>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Tracking Intelligence
              </h3>
              <p className="text-sm text-white">
                <span className="font-bold text-blue-400">{trackingPixelsDetected}</span> tracker(s) stripped from this email.
              </p>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Link Analysis
              </h3>
              {suspiciousLinks && suspiciousLinks.length > 0 ? (
                <div className="space-y-3">
                  {suspiciousLinks.map((link, idx) => (
                    <div key={idx} className="bg-gray-950 p-2 rounded border border-gray-800">
                      <p className="text-xs text-red-400 font-medium mb-1 break-all flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> {link.message}
                      </p>
                      <p className="text-[11px] text-gray-400 break-all">{link.url}</p>
                      <p className={`text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded bg-gray-800 ${getSeverityColor(link.severity)}`}>
                        {link.severity.toUpperCase()} SEVERITY
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> No suspicious links found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main View ---
  return (
    <div className="w-[380px] h-[600px] bg-gray-950 text-white flex flex-col font-sans">
      <Header />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!isValidPage ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-6 space-y-4">
            <div className="w-16 h-16 bg-blue-900/40 rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Protection Active</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Open a Gmail email to analyze security. We automatically scan content seamlessly in the background.
            </p>
          </div>
        ) : (
          <>
            {/* Current Email Status */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-3 text-gray-300">Sender Status</h2>

              {isEmailOpen ? (
                <>
                  <div className="mb-4">
                    <div className="text-sm font-medium text-white break-all">{senderName || 'Unknown'}</div>
                    <div className="text-xs text-gray-400 break-all">{senderEmail || 'No email'}</div>
                  </div>
                  <Separator className="my-4 bg-gray-800" />
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Trust Score</span>
                      <span className={`font-semibold text-sm ${getScoreColor(trustScore)}`}>{trustScore}/100</span>
                    </div>
                    <Progress value={trustScore} className="h-2 bg-gray-800 indicator-smooth" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">Privacy Score</span>
                      <span className={`font-semibold text-sm ${getScoreColor(privacyScore)}`}>{privacyScore}/100</span>
                    </div>
                    <Progress value={privacyScore} className="h-2 bg-gray-800 indicator-smooth" />
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-500 flex flex-col items-center">
                  <ScanLine className="w-10 h-10 mb-3 opacity-40 text-blue-400 animate-pulse" />
                  <p className="text-sm">Click into any message to scan</p>
                </div>
              )}
            </div>

            {/* Threat Summary */}
            {isEmailOpen && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-sm">
                <h2 className="text-sm font-semibold mb-3 text-gray-300">Detection Summary</h2>

                {threats.length === 0 ? (
                  <div className="text-center py-5 text-green-400 bg-green-950/20 rounded-lg border border-green-900/30">
                    <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-90" />
                    <p className="text-sm font-medium">Clear! No threats detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {threats.map((threat: ThreatSummary, index: number) => {
                      const Icon = getThreatIcon(threat.type);
                      return (
                        <div key={index} className="bg-gray-800/40 border border-gray-700/60 rounded p-3 flex items-start gap-3">
                          <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${getSeverityColor(threat.severity)}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-xs ${getSeverityColor(threat.severity)}`}>{threat.type}</div>
                            <div className="text-gray-400 text-xs mt-1 leading-snug">{threat.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Navigation */}
      <div className="p-4 bg-gray-900 border-t border-gray-800 space-y-3 shrink-0">
        {isValidPage && isEmailOpen ? (
          <>
            <Button onClick={() => { console.log("Manual email scan triggered"); scanCurrentEmail(true); }} disabled={scanning} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition-all">
              <ScanLine className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Analyzing...' : 'Rescan Email'}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => { console.log("Displaying full analysis report"); setView('report'); }} variant="outline" className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:text-white transition-all">
                <FileText className="w-4 h-4 mr-2 text-gray-400" /> Report
              </Button>
              <Button onClick={() => setView('settings')} variant="outline" className="bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 hover:text-white transition-all">
                <Settings className="w-4 h-4 mr-2 text-gray-400" /> Settings
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={() => setView('settings')} variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-gray-800 py-6 border border-dashed border-gray-700">
            <Settings className="w-4 h-4 mr-2" />
            Open Privacy Settings
          </Button>
        )}
      </div>
    </div>
  );
}