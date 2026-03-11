import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Shield, Eye, Link as LinkIcon, AlertTriangle, FileWarning, X } from 'lucide-react';

interface ThreatItem {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

interface EmailSecurityPanelProps {
  senderTrustScore: number;
  emailPrivacyScore: number;
  threats: ThreatItem[];
  onClose?: () => void;
}

export function EmailSecurityPanel({
  senderTrustScore,
  emailPrivacyScore,
  threats,
  onClose,
}: EmailSecurityPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'text-yellow-500';
      case 'medium':
        return 'text-orange-500';
      case 'high':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getThreatIcon = (type: string) => {
    if (type.toLowerCase().includes('tracking')) return Eye;
    if (type.toLowerCase().includes('link')) return LinkIcon;
    if (type.toLowerCase().includes('phishing')) return AlertTriangle;
    if (type.toLowerCase().includes('attachment')) return FileWarning;
    return Shield;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const isBannerMode = new URLSearchParams(window.location.search).get('banner') === 'true';

  if (!isBannerMode) {
    return (
      <div className="w-full max-w-[400px] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-semibold text-sm">
              AI Email Privacy Shield – Email Security Report
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Scores */}
        <div className="space-y-4 mb-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Sender Trust Score</span>
              <span className={`font-semibold text-sm ${getScoreColor(senderTrustScore)}`}>
                {senderTrustScore}/100
              </span>
            </div>
            <Progress value={senderTrustScore} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Email Privacy Score</span>
              <span className={`font-semibold text-sm ${getScoreColor(emailPrivacyScore)}`}>
                {emailPrivacyScore}/100
              </span>
            </div>
            <Progress value={emailPrivacyScore} className="h-2" />
          </div>
        </div>

        {/* Threat Detection Section */}
        <div className="mb-5">
          <h4 className="text-gray-300 font-medium text-sm mb-3">Threat Detection</h4>
          <div className="space-y-2">
            {threats.length === 0 ? (
              <div className="text-green-400 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>No threats detected</span>
              </div>
            ) : (
              threats.map((threat, index) => {
                const Icon = getThreatIcon(threat.type);
                return (
                  <div
                    key={index}
                    className="bg-gray-800 border border-gray-700 rounded p-3 flex items-start gap-3"
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${getSeverityColor(threat.severity)}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${getSeverityColor(threat.severity)}`}>
                        {threat.type}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">{threat.description}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
            View Detailed Report
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
              Block Trackers
            </Button>
            <Button variant="outline" className="flex-1 bg-red-900/30 border-red-800 text-red-400 hover:bg-red-900/50">
              Report Phishing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Banner Mode Layout ---
  return (
    <div
      className="ai-security-card font-sans box-border"
      style={{
        width: '520px',
        maxWidth: '90%',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        background: 'rgba(255, 255, 255, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '14px 18px',
        borderRadius: '10px',
        height: 'auto',
        overflow: 'visible'
      }}
    >
      {threats.length === 0 ? (
        <div className="flex items-center gap-[6px] text-green-700 text-[13px] font-medium">
          <Shield className="w-4 h-4" />
          Safe Email (No threats detected)
        </div>
      ) : (
        threats.map((threat, index) => {
          const Icon = getThreatIcon(threat.type);
          return (
            <div key={index} className="flex items-center gap-[6px] text-[13px] text-gray-800">
              <Icon className={`w-4 h-4 ${getSeverityColor(threat.severity)}`} />
              <span className={`font-medium ${getSeverityColor(threat.severity)}`}>{threat.type}</span>
            </div>
          );
        })
      )}

      {/* Action Button */}
      <div className="mt-1 text-left">
        <Button onClick={() => window.parent.postMessage({ type: 'OPEN_POPUP' }, '*')} variant="outline" className="h-[28px] px-3 text-xs bg-white/50 border-gray-300 text-gray-700 hover:bg-white hover:text-gray-900 inline-flex w-fit items-center justify-center backdrop-blur-sm">
          View Details
        </Button>
      </div>
    </div>
  );
}