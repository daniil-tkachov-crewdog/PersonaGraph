// AccountPage — placeholder for v1.0.
// The account area (login, sync-across-devices, profile) is not part of this
// release; the page exists so navigation is complete and the roadmap is
// visible. Marked "coming soon" per the spec.

import { useSettingsStore } from '../state/settingsStore.js';

export default function AccountPage() {
  const setView = useSettingsStore((s) => s.setView);
  return (
    <div className="account-page">
      <header className="page-head">
        <button className="btn ghost" onClick={() => setView('graph')}>
          ‹ Back
        </button>
        <h1>Account</h1>
      </header>
      <div className="placeholder">
        <p className="soon big">Coming soon</p>
      </div>
    </div>
  );
}
