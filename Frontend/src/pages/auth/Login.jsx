import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Store, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext"; // adjust path if needed

/* ---------- FloatingInput (unchanged) ---------- */
const FloatingInput = ({ id, label, type = "text", value, onChange, rightSlot }) => {
  const [focused, setFocused] = useState(false);
  const lifted = focused || value.length > 0;

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={[
          "w-full px-4 pt-5 pb-2 bg-surface border rounded-xl text-body-md text-on-surface outline-none transition-all duration-200",
          rightSlot ? "pr-11" : "pr-4",
          focused
            ? "border-primary ring-2 ring-primary/15 bg-background"
            : "border-outline-variant hover:border-outline"
        ].join(" ")}
      />
      <label
        htmlFor={id}
        style={{ pointerEvents: "none" }}
        className={[
          "absolute left-4 transition-all duration-200 origin-left",
          lifted
            ? `top-2 text-label-sm font-semibold tracking-wide ${focused ? "text-primary" : "text-secondary"}`
            : "top-1/2 -translate-y-1/2 text-body-md text-secondary"
        ].join(" ")}
      >
        {label}
      </label>
      {rightSlot && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
      )}
    </div>
  );
};

export default function Login() {
  const navigate = useNavigate();
  const { login ,user, loading: isloading } = useAuth(); // from your AuthContext


  useEffect(() => {
  if (!isloading && user) {
    navigate('/dashboard', { replace: true });
  }
}, [user, isloading, navigate]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quick client‑side validation
  const validate = () => {
    if (!formData.email.includes("@") || !formData.email.includes("."))
      return "Please enter a valid email address.";
    if (formData.password.length < 6)
      return "Password must be at least 6 characters.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(formData.email, formData.password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans antialiased bg-background">
      {/* ── Left Panel (brand, bg-primary) ── */}
      <div className="hidden lg:flex lg:w-[55%] bg-primary relative flex-col items-center justify-center p-16 overflow-hidden">
        {/* Decorative glow */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 600,
            height: 320,
            background: "rgba(255,255,255,0.03)",
            borderRadius: "50%",
            filter: "blur(100px)",
            pointerEvents: "none",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-xl bg-on-primary/10 backdrop-blur flex items-center justify-center shadow-lg"
              style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
            >
              <Store className="text-on-primary w-5 h-5" />
            </div>
            <span className="text-on-primary text-h2 font-bold tracking-tight">
              M.SANGWA SHOP DESK
            </span>
          </div>

          <h1 className="text-on-primary text-h1 font-bold leading-tight mb-4">
            Your store,{" "}
            <span className="text-primary-container">fully in control.</span>
          </h1>
          <p className="text-on-primary/70 text-body-lg max-w-xs leading-relaxed">
            Manage inventory, track sales, and streamline operations — all in one place.
          </p>
        </div>

        {/* Illustration */}
        <div className="relative z-10 mt-12 w-full max-w-md rounded-2xl overflow-hidden border border-on-primary/10 shadow-2xl">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0-mtS8uvIYu70JZSizX894Xu0QIZ0d_AthT8N2jIgvEwE_adYevlXsLSuNUCtlB-B1_i2aiwmzepqyIfY4FBMbEbg1qBKa2poUFhlRscVn1LyQ-g-BI0i4dV1-gVoqB-eRLHV8ClyBkDTqNOQKAbuLAwct6iX9wVsHmHEGjGqBsV6C-44h4rz6QyZICkGj9ra0tpdOMHzxzIEqs1fR33KOiyG77OwGatR8SBotqKYXxA0Cm5avxPk5Ep_A9uNZTQlICaQ1GpFh1LL"
            alt="Retail dashboard illustration"
            className="w-full object-cover"
          />
        </div>

        {/* Stats */}
        <div className="relative z-10 mt-stack-lg flex items-center gap-gutter text-label-sm text-on-primary/60">
          <span>
            <span className="text-on-primary font-semibold">10K+</span> products tracked
          </span>
          <span className="w-px h-3 bg-on-primary/20 inline-block" />
          <span>
            <span className="text-on-primary font-semibold">99.9%</span> uptime SLA
          </span>
          <span className="w-px h-3 bg-on-primary/20 inline-block" />
          <span>
            <span className="text-on-primary font-semibold">SOC 2</span> compliant
          </span>
        </div>
      </div>

      {/* ── Right Panel (form, light) ── */}
      <div className="w-full lg:w-[45%] bg-surface flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 px-6 py-4 bg-primary">
          <div className="w-8 h-8 rounded-lg bg-on-primary/10 flex items-center justify-center">
            <Store className="text-on-primary w-4 h-4" />
          </div>
          <span className="text-on-primary text-h2 font-bold">ShopDesk</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-8 py-12 lg:px-16">
          <div className="w-full max-w-sm">
            <div className="mb-stack-lg">
              <h2 className="text-h2 font-bold text-on-surface mb-1">Welcome back</h2>
              <p className="text-body-md text-secondary">Sign in to your ShopDesk account</p>
            </div>

            {error && (
              <div
                className="mb-stack-md px-4 py-3 bg-error-container text-on-error-container text-body-md rounded-xl"
                style={{ animation: "shake 0.4s ease" }}
              >
                {error}
              </div>
            )}

            <div className="space-y-4" onKeyDown={handleKey}>
              <FloatingInput
                id="email"
                label="Email address"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setError("");
                }}
              />

              <FloatingInput
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError("");
                }}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-secondary hover:text-on-surface transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 rounded border-outline-variant accent-primary"
                  />
                  <span className="text-body-md text-secondary">Remember me</span>
                </label>
                <a href="#" className="text-body-md font-medium text-primary">
                  Forgot password?
                </a>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 mt-2 text-on-primary text-label-md font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed bg-primary hover:brightness-110 active:scale-[0.98]"
                style={{ boxShadow: "0 4px 14px rgba(15,23,42,0.25)" }}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-on-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="text-label-sm text-secondary">or continue with</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-surface border border-outline hover:bg-secondary-container hover:border-outline text-on-surface text-label-md font-medium py-3 rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <p className="mt-stack-lg text-center text-label-md text-secondary">
              Don't have an account?{" "}
              <span className="text-on-surface font-semibold">
                Contact your administrator
              </span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-5px)}
          40%,80%{transform:translateX(5px)}
        }
      `}</style>
    </div>
  );
}