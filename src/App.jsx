// App — top-level view switch.
// PersonaGraph has no router; it's a single-window desktop app with three
// mutually exclusive pages. The active page is driven by settingsStore.view so
// any component (e.g. the sidebar's Settings button) can navigate by setting a
// value. Deliberately dumb: no data logic lives here.

import { useSettingsStore } from './state/settingsStore.js';
import GraphPage from './pages/GraphPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AccountPage from './pages/AccountPage.jsx';

export default function App() {
  const view = useSettingsStore((s) => s.view);

  if (view === 'settings') return <SettingsPage />;
  if (view === 'account') return <AccountPage />;
  return <GraphPage />;
}
