import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { TrendingUp, Mail, Lock, User as UserIcon, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";

const searchSchema = z.object({
  mode: z.enum(["login", "register", "forgot"]).default("login").catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Investa" },
      { name: "description", content: "Access your Investa research terminal." },
    ],
  }),
});

function AuthPage() {
  const { mode } = useSearch({ from: "/auth" });
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("demo@investa.io");
  const [password, setPassword] = useState("demo1234");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard" });
  }, [isAuthenticated, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password, remember);
        toast.success("Welcome back");
      } else if (mode === "register") {
        await register(name || email.split("@")[0], email, password);
        toast.success("Account created");
      } else {
        const { authService } = await import("@/services/auth-service");
        await authService.forgotPassword(email);
        toast.success("Reset link sent to your inbox");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><defs><linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23667eea;stop-opacity:1" /><stop offset="50%" style="stop-color:%23764ba2;stop-opacity:1" /><stop offset="100%" style="stop-color:%23f093fb;stop-opacity:1" /></linearGradient></defs><rect width="1024" height="1024" fill="url(%23skyGrad)" /></svg>')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Glassmorphic card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl hover:bg-white/15 transition-all duration-500">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-lg text-white mx-auto mb-4 hover:bg-white/30 transition-all">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {mode === "login" && "Welcome Back"}
              {mode === "register" && "Join Investa"}
              {mode === "forgot" && "Reset Password"}
            </h1>
            <p className="text-white/70 text-sm">
              {mode === "login" && "Sign in to your research terminal"}
              {mode === "register" && "Create your investment hub today"}
              {mode === "forgot" && "Enter your email to reset your password"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <GlassmorphicField
                icon={<UserIcon className="h-5 w-5" />}
                type="text"
                placeholder="Full name"
                value={name}
                onChange={setName}
              />
            )}

            <GlassmorphicField
              icon={<Mail className="h-5 w-5" />}
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={setEmail}
              required
            />

            {mode !== "forgot" && (
              <div className="relative">
                <GlassmorphicField
                  icon={<Lock className="h-5 w-5" />}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={setPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-white/70 hover:text-white/90 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded accent-white/50 bg-white/10 border-white/20 cursor-pointer"
                  />
                  Remember me
                </label>
                <Link
                  to="/auth"
                  search={{ mode: "forgot" }}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  Forgot?
                </Link>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-5 w-5 animate-spin" />}
              {mode === "login" && "Sign In"}
              {mode === "register" && "Create Account"}
              {mode === "forgot" && "Send Reset Link"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/20" />
            <span className="text-white/60 text-xs">OR</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>

          {/* Links */}
          <div className="text-center text-sm text-white/70">
            {mode === "login" && (
              <>
                Don't have an account?{" "}
                <Link
                  to="/auth"
                  search={{ mode: "register" }}
                  className="text-white font-semibold hover:text-blue-200 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
            {mode === "register" && (
              <>
                Already have an account?{" "}
                <Link
                  to="/auth"
                  search={{ mode: "login" }}
                  className="text-white font-semibold hover:text-blue-200 transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
            {mode === "forgot" && (
              <>
                Back to{" "}
                <Link
                  to="/auth"
                  search={{ mode: "login" }}
                  className="text-white font-semibold hover:text-blue-200 transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Bottom branding */}
        <div className="text-center mt-6 text-white/50 text-xs">
          © {new Date().getFullYear()} Investa. Market data delayed. Not investment advice.
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

function GlassmorphicField({
  icon,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="relative flex items-center gap-3 backdrop-blur-md bg-white/10 border border-white/20 px-4 py-3 rounded-lg hover:bg-white/15 focus-within:bg-white/20 focus-within:border-white/40 transition-all duration-300 hover:border-white/30">
      <span className="text-white/80">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/50 focus:placeholder:text-white/30"
      />
    </label>
  );
}

