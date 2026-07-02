import { useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { useNavigate } from "react-router-dom";

export default function SettingsView() {
  const { user, logout, setServerUrl, serverUrl } = useAuthStore();
  const navigate = useNavigate();
  const [url, setUrl] = useState(serverUrl);

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="settings-view">
      <h1>Settings</h1>
      <section>
        <h2>Account</h2>
        <p>Signed in as <strong>{user?.displayName}</strong> ({user?.role})</p>
        <button onClick={handleLogout} className="btn btn-danger">Sign Out</button>
      </section>
      <section>
        <h2>Server</h2>
        <label>Server URL</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8000" />
        <button onClick={() => setServerUrl(url)} className="btn btn-primary">Save</button>
      </section>
      <section>
        <h2>About</h2>
        <p>CreateLab v0.1.0 — CoreV2 Summer Camp</p>
        <p>Desktop Client (Tauri 2 + React + TypeScript)</p>
      </section>
    </div>
  );
}
