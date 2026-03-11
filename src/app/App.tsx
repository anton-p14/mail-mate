import { useState } from 'react';
import { InboxRiskBadge } from './components/InboxRiskBadge';
import { EmailSecurityPanel } from './components/EmailSecurityPanel';
import { ExtensionPopup } from './components/ExtensionPopup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

export default function App() {
  // Mock data for demonstrations
  const mockThreats = [
    {
      type: 'Tracking Pixel Detected',
      description: '3 hidden tracking pixels found in email body',
      severity: 'medium' as const,
    },
    {
      type: 'Suspicious Links Found',
      description: 'Link domain does not match sender domain',
      severity: 'high' as const,
    },
    {
      type: 'Phishing Language Detected',
      description: 'Urgent action request with suspicious wording',
      severity: 'high' as const,
    },
  ];

  const mockPopupThreats = [
    {
      type: 'Hidden tracking pixel',
      description: 'Embedded tracking beacon detected',
      severity: 'medium' as const,
    },
    {
      type: 'Suspicious domain',
      description: 'Link leads to untrusted domain',
      severity: 'high' as const,
    },
    {
      type: 'Phishing keywords detected',
      description: 'Urgency language patterns identified',
      severity: 'high' as const,
    },
    {
      type: 'Unsafe link',
      description: 'URL shortener detected',
      severity: 'low' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            AI Email Privacy Shield
          </h1>
          <p className="text-gray-400 text-lg mb-2">
            Chrome Extension Overlay Components
          </p>
          <p className="text-gray-500 text-sm">
            Small UI components designed to overlay on top of Gmail
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 mb-8 bg-gray-800/50">
            <TabsTrigger value="badges" className="data-[state=active]:bg-blue-600">
              Inbox Badges
            </TabsTrigger>
            <TabsTrigger value="panel" className="data-[state=active]:bg-blue-600">
              Security Card
            </TabsTrigger>
            <TabsTrigger value="popup" className="data-[state=active]:bg-blue-600">
              Extension Popup
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="badges" className="space-y-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-3">Inbox Risk Badge Component</h2>
                <p className="text-gray-400 mb-2">
                  Small pill-shaped badges (20-24px height) that appear inline next to email subjects in Gmail.
                </p>
                <p className="text-gray-500 text-sm">
                  Minimal design to fit within Gmail email rows without breaking layout.
                </p>
              </div>

              {/* Badge Showcase */}
              <div className="grid gap-6">
                {/* Safe Badge */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-green-400 mb-1">Safe Email</h3>
                      <p className="text-sm text-gray-500">Trusted sender, no threats detected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded">
                    <span className="text-gray-900 text-sm">Your order has been shipped</span>
                    <InboxRiskBadge riskLevel="safe" />
                  </div>
                </div>

                {/* Suspicious Badge */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-400 mb-1">Suspicious Email</h3>
                      <p className="text-sm text-gray-500">Warning signs detected, proceed with caution</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded">
                    <span className="text-gray-900 text-sm">Limited Time: 50% OFF - Act Now!</span>
                    <InboxRiskBadge riskLevel="suspicious" />
                  </div>
                </div>

                {/* High Risk Badge */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-red-400 mb-1">High Risk Email</h3>
                      <p className="text-sm text-gray-500">Phishing attempt or malicious content detected</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white p-4 rounded">
                    <span className="text-gray-900 text-sm">URGENT: Your account will be suspended</span>
                    <InboxRiskBadge riskLevel="high-risk" />
                  </div>
                </div>

                {/* All Badges Together */}
                <div className="bg-gray-900/30 border border-gray-800 rounded-lg p-8">
                  <h3 className="text-lg font-semibold mb-4">All Badge Variants</h3>
                  <div className="flex flex-wrap gap-4 bg-white p-6 rounded">
                    <InboxRiskBadge riskLevel="safe" />
                    <InboxRiskBadge riskLevel="suspicious" />
                    <InboxRiskBadge riskLevel="high-risk" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="panel" className="flex justify-center">
            <div className="max-w-4xl w-full space-y-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-3">Email Security Analysis Popup Card</h2>
                <p className="text-gray-400 mb-2">
                  Floating popup card (350-380px width) that overlays above email content when an email is opened.
                </p>
                <p className="text-gray-500 text-sm">
                  Compact popup window with dark theme, displaying security analysis and threat detection.
                </p>
              </div>

              {/* Floating Card Examples */}
              <div className="space-y-8">
                {/* High Risk Example */}
                <div className="relative">
                  <div className="text-center mb-4">
                    <span className="inline-block bg-red-900/30 border border-red-800 text-red-400 px-4 py-1 rounded-full text-sm">
                      High Risk Email Detected
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <EmailSecurityPanel
                      senderTrustScore={25}
                      emailPrivacyScore={15}
                      threats={mockThreats}
                    />
                  </div>
                </div>

                {/* Safe Example */}
                <div className="relative">
                  <div className="text-center mb-4">
                    <span className="inline-block bg-green-900/30 border border-green-800 text-green-400 px-4 py-1 rounded-full text-sm">
                      Safe Email
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <EmailSecurityPanel
                      senderTrustScore={95}
                      emailPrivacyScore={88}
                      threats={[]}
                    />
                  </div>
                </div>

                {/* Medium Risk Example */}
                <div className="relative">
                  <div className="text-center mb-4">
                    <span className="inline-block bg-yellow-900/30 border border-yellow-800 text-yellow-400 px-4 py-1 rounded-full text-sm">
                      Minor Threats Detected
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <EmailSecurityPanel
                      senderTrustScore={72}
                      emailPrivacyScore={65}
                      threats={[
                        {
                          type: 'Tracking Pixel Detected',
                          description: '1 hidden tracking pixel found',
                          severity: 'low',
                        },
                      ]}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="popup" className="flex justify-center">
            <div className="max-w-5xl w-full space-y-8">
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
                <h2 className="text-2xl font-semibold mb-3">Chrome Extension Popup Window</h2>
                <p className="text-gray-400 mb-2">
                  Popup window (380x500-600px) that appears when clicking the extension icon in Chrome.
                </p>
                <p className="text-gray-500 text-sm">
                  Modern cybersecurity dashboard with risk indicators and threat summary.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* With Threats */}
                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-2">Active Threat Detection</h3>
                    <p className="text-sm text-gray-500">When viewing a suspicious email</p>
                  </div>
                  <div className="flex justify-center">
                    <div className="shadow-2xl rounded-lg overflow-hidden">
                      <ExtensionPopup
                        isEmailOpen={true}
                        senderEmail="security@paypaI.com"
                        senderName="PayPal Security"
                        trustScore={25}
                        privacyScore={15}
                        threats={mockPopupThreats}
                      />
                    </div>
                  </div>
                </div>

                {/* Safe Email */}
                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-2">Safe Email Status</h3>
                    <p className="text-sm text-gray-500">When viewing a trusted email</p>
                  </div>
                  <div className="flex justify-center">
                    <div className="shadow-2xl rounded-lg overflow-hidden">
                      <ExtensionPopup
                        isEmailOpen={true}
                        senderEmail="noreply@amazon.com"
                        senderName="Amazon"
                        trustScore={95}
                        privacyScore={88}
                        threats={[]}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* No Email Open State */}
              <div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mb-2">Idle State</h3>
                  <p className="text-sm text-gray-500">When no email is currently open</p>
                </div>
                <div className="flex justify-center">
                  <div className="shadow-2xl rounded-lg overflow-hidden">
                    <ExtensionPopup isEmailOpen={false} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
