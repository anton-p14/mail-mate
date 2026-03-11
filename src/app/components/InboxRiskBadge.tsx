import { Shield, ShieldAlert, ShieldX } from 'lucide-react';

type RiskLevel = 'safe' | 'suspicious' | 'high-risk';

interface InboxRiskBadgeProps {
  riskLevel: RiskLevel;
}

export function InboxRiskBadge({ riskLevel }: InboxRiskBadgeProps) {
  const config = {
    safe: {
      icon: Shield,
      label: 'SAFE',
      bgColor: 'bg-green-500',
      textColor: 'text-white',
    },
    suspicious: {
      icon: ShieldAlert,
      label: 'SUSPICIOUS',
      bgColor: 'bg-yellow-500',
      textColor: 'text-gray-900',
    },
    'high-risk': {
      icon: ShieldX,
      label: 'HIGH RISK',
      bgColor: 'bg-red-500',
      textColor: 'text-white',
    },
  };

  const { icon: Icon, label, bgColor, textColor } = config[riskLevel];

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${bgColor} ${textColor} text-xs font-medium`}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}
