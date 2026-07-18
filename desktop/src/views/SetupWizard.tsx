import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import {
  Sparkles, Server, Wifi, CheckCircle, ArrowRight, ArrowLeft,
  Monitor, Cpu, Gamepad2, Calculator, Fish, Bot, Loader2, XCircle
} from "lucide-react";

type Step = "welcome" | "server" | "ready";

export default function SetupWizard() {
  const [step, setStep] = useState<Step>("welcome");
  const [serverUrl, setServerUrl] = useState("http://localhost:8000");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "fail">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();
  const authStore = useAuthStore();

  // Mark setup as done when user completes it
  const finishSetup = () => {
    localStorage.setItem("createlab-setup-complete", "true");
    authStore.setServerUrl(serverUrl);
    navigate("/login");
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult("idle");
    setErrorMsg("");
    try {
      const url = serverUrl.replace(/\/$/, "");
      const response = await fetch(`${url}/api/v1/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        setTestResult("success");
      } else {
        setTestResult("fail");
        setErrorMsg(`Server returned ${response.status}. Is the CreateLab server running?`);
      }
    } catch (e: any) {
      setTestResult("fail");
      setErrorMsg(
        e.name === "TimeoutError"
          ? "Connection timed out. Make sure the server is running and the URL is correct."
          : "Cannot reach the server. Check the URL and your network connection."
      );
    }
    setTesting(false);
  };

  const steps: Record<Step, number> = { welcome: 0, server: 1, ready: 2 };
  const currentStep = steps[step];
  const totalSteps = 3;

  return (
    <div className="h-full flex items-center justify-center bg-surface p-6">
      <div className="w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-3 mb-10">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i <= currentStep
                  ? "bg-accent scale-110"
                  : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Step: Welcome */}
        {step === "welcome" && (
          <div className="fade-in space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                <Sparkles size={32} className="text-accent" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary">Welcome to CreateLab</h1>
              <p className="text-text-secondary text-sm leading-relaxed max-w-sm mx-auto">
                Your educational development platform for the CoreV2 Summer Camp.
                Build games, robots, and gadgets — with AI mentorship guiding you.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Gamepad2, label: "Platformer", desc: "Retro game dev" },
                { icon: Fish, label: "Fishing", desc: "Simulation" },
                { icon: Bot, label: "Robotics", desc: "Embedded systems" },
                { icon: Calculator, label: "Calculator", desc: "Math & logic" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt border border-border"
                >
                  <item.icon size={20} className="text-accent shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-text-primary">{item.label}</p>
                    <p className="text-[10px] text-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("server")}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step: Server connection */}
        {step === "server" && (
          <div className="fade-in space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                <Server size={28} className="text-accent" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">Connect to Server</h2>
              <p className="text-text-secondary text-sm">
                Enter the address of the CreateLab classroom server.
                Your instructor will provide this URL.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">
                  Server URL
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => {
                    setServerUrl(e.target.value);
                    setTestResult("idle");
                    setErrorMsg("");
                  }}
                  placeholder="http://192.168.1.100:8000"
                  className="input-field"
                />
              </div>

              <button
                onClick={testConnection}
                disabled={testing || !serverUrl.trim()}
                className="w-full py-2.5 rounded-lg border border-border bg-surface-alt hover:bg-surface-hover text-text-primary text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : testResult === "success" ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : testResult === "fail" ? (
                  <XCircle size={16} className="text-red-400" />
                ) : (
                  <Wifi size={16} />
                )}
                {testing ? "Testing..." : testResult === "success" ? "Connected!" : testResult === "fail" ? "Failed" : "Test Connection"}
              </button>

              {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  <XCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {testResult === "success" && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
                  <CheckCircle size={14} className="shrink-0 mt-0.5" />
                  <span>Server is reachable! You're ready to continue.</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("welcome")}
                className="flex-1 py-2.5 rounded-xl border border-border bg-surface-alt hover:bg-surface-hover text-text-primary text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                onClick={() => {
                  authStore.setServerUrl(serverUrl);
                  setStep("ready");
                }}
                disabled={testResult !== "success"}
                className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step: Ready */}
        {step === "ready" && (
          <div className="fade-in space-y-8 text-center">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle size={36} className="text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-text-primary">You're All Set!</h2>
              <p className="text-text-secondary text-sm max-w-sm mx-auto leading-relaxed">
                CreateLab is connected to the classroom server at{" "}
                <code className="px-1.5 py-0.5 rounded bg-surface-alt text-accent text-xs font-mono">
                  {serverUrl}
                </code>
                . Sign in or create an account to get started.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={finishSetup}
                className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                Continue to Sign In
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => setStep("server")}
                className="w-full py-2.5 rounded-xl text-text-muted hover:text-text-primary text-sm transition-colors"
              >
                Change server URL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
