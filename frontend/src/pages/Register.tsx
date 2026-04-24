import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await api.post("/api/auth/register", { username, email, password });
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
            Create your workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Set up your DevPad account
          </p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl card-depth p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="reg-username">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="devpad_user"
                required
                className="w-full bg-surface rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground card-depth focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground" htmlFor="reg-email">
                Email
              </label>
              <input
                id="reg-email"
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
              <label className="text-xs text-muted-foreground" htmlFor="reg-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
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
              {/* Strength indicator */}
              <div className="flex gap-1 pt-0.5">
                {[8, 12, 16].map((threshold, i) => (
                  <div
                    key={i}
                    className="h-0.5 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor:
                        password.length >= threshold
                          ? "hsl(var(--primary))"
                          : "hsl(var(--border))",
                    }}
                  />
                ))}
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
                  <UserPlus size={14} />
                  Create account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:opacity-80 transition-opacity"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
