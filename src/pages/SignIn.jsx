import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { toast } from "sonner";
import { FaArrowRight, FaCheckCircle } from "react-icons/fa";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}/api/auth`;

export default function SignIn() {
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // --------------------------------------------------
  // TIMER
  // --------------------------------------------------

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  // --------------------------------------------------
  // SEND OTP
  // --------------------------------------------------

  const sendOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrors({ email: "Email is required" });
      return;
    }

    if (!validateEmail(email.trim())) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/signin-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      /*
       * Backend should return:
       *
       * {
       *   success: true,
       *   isNewUser: true/false,
       *   message: "OTP sent"
       * }
       */

      toast.success("OTP sent to your email 📩");

      setTimer(30);
      setOtp(Array(6).fill(""));
      setStep("otp");

      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);

    } catch (error) {
      toast.error(error.message || "Unable to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // VERIFY OTP
  // --------------------------------------------------

  const verifyOTP = async (code) => {
    if (code.length !== 6) {
      toast.error("Enter the complete 6-digit OTP");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/verify-signin-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      /*
       * Existing user:
       *
       * {
       *   success: true,
       *   isNewUser: false,
       *   token: "..."
       * }
       *
       * New user:
       *
       * {
       *   success: true,
       *   isNewUser: true
       * }
       */

      if (data.isNewUser) {
        toast.success("Email verified! Let's create your account 🎉");

        setStep("details");
        return;
      }

      // Existing user
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      toast.success("Welcome back! 🎉");

      window.location.href = "/";

    } catch (error) {
      toast.error(error.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // OTP INPUT
  // --------------------------------------------------

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[index] = value;

    setOtp(updated);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (!value && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (updated.every((digit) => digit !== "")) {
      verifyOTP(updated.join(""));
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  // --------------------------------------------------
  // RESEND OTP
  // --------------------------------------------------

  const resendOTP = async () => {
    if (timer > 0) return;

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/send-login-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setOtp(Array(6).fill(""));
      setTimer(30);

      toast.success("New OTP sent 📩");

      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 100);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // NEW USER DETAILS
  // --------------------------------------------------

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const completeProfile = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      /*
       * The OTP verification should create/store
       * a temporary verified session/token.
       *
       * This request completes the new user's profile.
       */

      const res = await fetch(`${BACKEND_URL}/complete-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("tempToken") || ""}`,
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || "Unable to create your account"
        );
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      localStorage.removeItem("tempToken");

      toast.success("Account created successfully 🎉");

      window.location.href = "/";

    } catch (error) {
      toast.error(
        error.message || "Unable to complete your account"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // BACK
  // --------------------------------------------------

  const backToEmail = () => {
    setStep("email");
    setOtp(Array(6).fill(""));
    setErrors({});
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <AuthLayout title="Welcome Back">
      <style>{`
        .si-root * {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .si-root {
          animation: fadeIn .4s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .form-group {
          margin-bottom: 14px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .04em;
          color: #6b7280;
          text-transform: uppercase;
          display: block;
          margin-bottom: 6px;
        }

        .form-input {
          width: 100%;
          background: #f8faff;
          border: 1.5px solid rgba(99,102,241,.16);
          border-radius: 12px;
          padding: 13px 16px;
          font-size: 14px;
          font-weight: 500;
          color: #1e1b4b;
          outline: none;
          transition: .2s;
        }

        .form-input:focus {
          background: white;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }

        .form-input.error {
          border-color: #f43f5e;
        }

        .form-error {
          font-size: 12px;
          font-weight: 600;
          color: #f43f5e;
          margin-top: 5px;
        }

        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 0;
          border-radius: 13px;
          font-size: 15px;
          font-weight: 700;
          background: linear-gradient(135deg,#4f46e5,#2563eb);
          color: white;
          border: none;
          cursor: pointer;
          transition: .2s;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(79,70,229,.30);
        }

        .submit-btn:disabled {
          opacity: .6;
          cursor: not-allowed;
          transform: none;
        }

        .otp-section {
          text-align: center;
        }

        .otp-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e1b4b;
          margin-bottom: 8px;
        }

        .otp-desc {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 24px;
          line-height: 1.6;
        }

        .otp-inputs {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .otp-input {
          width: 44px;
          height: 48px;
          text-align: center;
          font-size: 18px;
          font-weight: 700;
          background: #f8faff;
          border: 2px solid rgba(99,102,241,.16);
          border-radius: 12px;
          color: #1e1b4b;
          outline: none;
        }

        .otp-input:focus {
          background: white;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,.12);
        }

        .resend-btn,
        .back-btn {
          border: none;
          background: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          color: #6366f1;
        }

        .resend-btn:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }

        .back-btn {
          width: 100%;
          padding: 11px;
          margin-top: 16px;
          border-radius: 12px;
          background: #eef2ff;
        }

        .back-btn:hover {
          background: #e0e7ff;
        }

        .verified-email {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          color: #15803d;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 18px;
        }

        .details-title {
          font-size: 23px;
          font-weight: 700;
          color: #1e1b4b;
          margin-bottom: 6px;
        }

        .details-desc {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 20px;
        }
      `}</style>

      <div className="si-root">

        {/* =========================================
            EMAIL
        ========================================= */}

        {step === "email" && (
          <form onSubmit={sendOTP}>

            <div className="form-group">
              <label className="form-label">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({});
                }}
                className={`form-input ${
                  errors.email ? "error" : ""
                }`}
                autoComplete="email"
              />

              {errors.email && (
                <div className="form-error">
                  {errors.email}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                "Sending OTP..."
              ) : (
                <>
                  Send OTP
                  <FaArrowRight size={13} />
                </>
              )}
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "#9ca3af",
                marginTop: 14,
              }}
            >
              We'll send a secure 6-digit OTP to your email.
            </p>

          </form>
        )}

        {/* =========================================
            OTP
        ========================================= */}

        {step === "otp" && (
          <div className="otp-section">

            <h2 className="otp-title">
              Verify Your Email
            </h2>

            <p className="otp-desc">
              Enter the 6-digit code sent to
              <br />
              <strong>{email}</strong>
            </p>

            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  className="otp-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) =>
                    handleOtpChange(e.target.value, index)
                  }
                  onKeyDown={(e) =>
                    handleOtpKeyDown(e, index)
                  }
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <p
              style={{
                fontSize: 12,
                color: "#6b7280",
              }}
            >
              {timer > 0 ? (
                <>
                  Resend OTP in{" "}
                  <strong style={{ color: "#6366f1" }}>
                    {timer}s
                  </strong>
                </>
              ) : (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={resendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </p>

            <button
              type="button"
              className="back-btn"
              onClick={backToEmail}
            >
              ← Change Email
            </button>

          </div>
        )}

        {/* =========================================
            NEW USER DETAILS
        ========================================= */}

        {step === "details" && (
          <form onSubmit={completeProfile}>

            <h2 className="details-title">
              Almost there! 🎉
            </h2>

            <p className="details-desc">
              Tell us a little about yourself to finish
              creating your account.
            </p>

            <div className="verified-email">
              <FaCheckCircle size={14} />
              {email}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >

              <div className="form-group">
                <label className="form-label">
                  First Name
                </label>

                <input
                  type="text"
                  name="firstName"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={handleDetailsChange}
                  className={`form-input ${
                    errors.firstName ? "error" : ""
                  }`}
                  autoComplete="given-name"
                />

                {errors.firstName && (
                  <div className="form-error">
                    {errors.firstName}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Last Name
                </label>

                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={handleDetailsChange}
                  className={`form-input ${
                    errors.lastName ? "error" : ""
                  }`}
                  autoComplete="family-name"
                />

                {errors.lastName && (
                  <div className="form-error">
                    {errors.lastName}
                  </div>
                )}
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                "Creating Account..."
              ) : (
                <>
                  Create Account
                  <FaArrowRight size={13} />
                </>
              )}
            </button>

          </form>
        )}

      </div>
    </AuthLayout>
  );
}