import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/utils/api";
import { Terminal, Eye, EyeOff, Server } from "lucide-react";

export default function LoginView() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serverUrl, setServerUrl] = useState(
    useAuthStore.getState().serverUrl
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const authStore = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      authStore.setServerUrl(serverUrl);

      let response;
      if (mode === "login") {
        response = await authApi.login(username, password);
      } else {
        response = await authApi.register(username, email, password);
      }

      const { access_token, refresh_token } = response.data;
      authStore.setTokens(access_token, refresh_token);

      const meResponse = await authApi.getMe();
      const userData = meResponse.data;
      authStore.setUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        displayName: userData.display_name,
        role: userData.role,
      });
    } catch (err: any) {
      const msg =
        err.response?.data?.detail || err.message || "An error occurred";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-surface">
      <div className="w-full max-w-sm mx-auto fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-alt border border-border mb-4">
            <Terminal size={32} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">CreateLab</h1>
          <p className="text-sm text-text-muted mt-1">
            CoreV2 Summer Camp Platform
          </p>
        </div>

        {/* Server URL */}
        <div className="mb-6">
          <label className="text-xs text-text-muted flex items-center gap-1 mb-1.5">
            <Server size={12} />
            Server URL
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
            placeholder="http://localhost:8443"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-text-muted mb-1.5 block">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="Enter username"
              required
              minLength={3}
            />
          </div>

          {mode === "register" && (
            <div className="fade-in">
              <label className="text-xs text-text-muted mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                placeholder="Enter email"
                required
              />
            </div>
          )}

          <div>
            <label className="text-xs text-text-muted mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-alt border border-border rounded-lg px-3 py-2.5 pr-10 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                placeholder="Enter password"
                required
                minLength={mode === "register" ? 8 : 1}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : "Create Account"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-center mt-6">
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="text-xs text-text-muted hover:text-accent transition-colors"
          >
            {mode === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
