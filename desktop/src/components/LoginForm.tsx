import { useState } from "react";
import { useAuthStore } from "../stores/authStore";

export default function LoginForm() {
  const { login, register } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password, email || `${username}@createlab.local`);
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err?.message || err?.toString() || "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h1>CreateLab</h1>
      <p className="login-subtitle">CoreV2 Summer Camp</p>
      <label>Username</label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" required />
      {isRegister && (
        <>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
        </>
      )}
      <label>Password</label>
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" required minLength={8} />
      <button type="submit" disabled={loading}>
        {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
      </button>
      {error && <p className="login-error">{error}</p>}
      <button type="button" className="login-toggle" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Sign in" : "New user? Create account"}
      </button>
    </form>
  );
}
