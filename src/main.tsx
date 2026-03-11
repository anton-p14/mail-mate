import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { ExtensionPopup } from "./app/components/ExtensionPopup.tsx";
import { EmailSecurityPanel } from "./app/components/EmailSecurityPanel.tsx";
import "./styles/index.css";

const root = createRoot(document.getElementById("root")!);
const urlParams = new URLSearchParams(window.location.search);
const view = urlParams.get('view');

if (view === 'popup') {
  root.render(<ExtensionPopup isEmailOpen={false} />);
} else if (view === 'panel') {
  const trustScore = Number(urlParams.get('trust')) || 0;
  const privacyScore = Number(urlParams.get('privacy')) || 0;
  let threats = [];
  try {
    threats = JSON.parse(decodeURIComponent(urlParams.get('threats') || '[]'));
  } catch (e) { }

  root.render(
    <EmailSecurityPanel
      senderTrustScore={trustScore}
      emailPrivacyScore={privacyScore}
      threats={threats}
    />
  );
} else {
  root.render(<App />);
}