import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 mb-4">
            <span className="text-primary text-lg font-bold font-mono">D</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Sign in to your DevPad workspace
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl card-depth p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-surface rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground card-depth focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface rounded-md px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground card-depth focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="font-mono text-xs tracking-widest animate-pulse">
                  ···
                </span>
              ) : (
                <>
                  <LogIn size={14} />
                  Sign in
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          No account?{" "}
          <Link
            to="/register"
            className="text-primary hover:opacity-80 transition-opacity"
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
