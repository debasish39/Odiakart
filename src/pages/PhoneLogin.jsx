import { useEffect, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  FaArrowRight,
  FaCheckCircle,
  FaGift,
  FaPhoneAlt,
  FaShieldAlt,
} from "react-icons/fa";

import { toast } from "sonner";

const BACKEND_URL = `${import.meta.env.VITE_BACKEND_URL}/api/auth`;
const REFERRAL_STORAGE_KEY = "odikart_referral_code";

export default function PhoneLogin() {
  /* =====================================================
     NAVIGATION
  ===================================================== */

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const referralFromUrl = searchParams.get("ref")?.trim().toUpperCase() || "";

  const [referralCode, setReferralCode] = useState(() => {
    if (referralFromUrl) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, referralFromUrl);
      return referralFromUrl;
    }

    return (
      localStorage.getItem(REFERRAL_STORAGE_KEY)?.trim().toUpperCase() || ""
    );
  });

  const recaptchaVerifierRef = useRef(null);
  const recaptchaWidgetIdRef = useRef(null);
  const otpRefs = useRef([]);

  /* =====================================================
     STATE
  ===================================================== */

  const [step, setStep] = useState("phone");

  const [phone, setPhone] = useState("+91 ");

  const [otp, setOtp] = useState(
    Array(6).fill("")
  );

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);

  const [timer, setTimer] = useState(0);

  const [confirmationResult, setConfirmationResult] =
    useState(null);

  const [firebaseUser, setFirebaseUser] =
    useState(null);

  const [firebaseIdToken, setFirebaseIdToken] =
    useState(null);

  /* =====================================================
     REFERRAL CODE
  ===================================================== */

  useEffect(() => {
    if (!referralFromUrl) return;

    localStorage.setItem(
      REFERRAL_STORAGE_KEY,
      referralFromUrl
    );

    setReferralCode(referralFromUrl);
  }, [referralFromUrl]);

  /* =====================================================
     TIMER
  =====================================================

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* =====================================================
     RECAPTCHA CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      try {
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
        }
      } catch (error) {
      }

      recaptchaVerifierRef.current = null;
      recaptchaWidgetIdRef.current = null;
    };
  }, []);

  /* =====================================================
     PHONE VALIDATION
  ===================================================== */

  const validatePhone = () => {
    const cleanedPhone = phone
      .replace(/\s/g, "")
      .trim();

    if (!cleanedPhone) {
      setErrors({
        phone: "Phone number is required",
      });

      return false;
    }

    if (!/^\+91[6-9]\d{9}$/.test(cleanedPhone)) {
      setErrors({
        phone:
          "Enter a valid Indian mobile number",
      });

      return false;
    }

    setErrors({});

    return true;
  };

  /* =====================================================
     SETUP RECAPTCHA
     
     IMPORTANT:
     - Create verifier only once.
     - Reuse it for resend.
     - Do NOT recreate it every time.
  ===================================================== */

  const setupRecaptcha = async () => {
    /* Already initialized */
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }

    const container =
      document.getElementById(
        "recaptcha-container"
      );

    if (!container) {
      throw new Error(
        "reCAPTCHA container not found."
      );
    }

    /*
     * Remove any old DOM rendering that may
     * have survived from a previous attempt.
     */
    container.innerHTML = "";

    const verifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",

        callback: () => {
        },

        "expired-callback": () => {

          toast.error(
            "reCAPTCHA expired. Please try again."
          );
        },

        "error-callback": () => {
        },
      }
    );

    recaptchaVerifierRef.current = verifier;

    try {
      const widgetId =
        await verifier.render();

      recaptchaWidgetIdRef.current =
        widgetId;

      return verifier;
    } catch (error) {

      try {
        verifier.clear();
      } catch (error) {
      }

      recaptchaVerifierRef.current = null;
      recaptchaWidgetIdRef.current = null;

      throw error;
    }
  };

  /* =====================================================
     RESET RECAPTCHA
     
     Firebase recommends resetting/reusing the
     verifier instead of creating a new verifier.
  ===================================================== */

  const resetRecaptcha = () => {
    try {
      const widgetId =
        recaptchaWidgetIdRef.current;

      if (
        widgetId !== null &&
        widgetId !== undefined &&
        window.grecaptcha
      ) {
        window.grecaptcha.reset(
          widgetId
        );
      }
    } catch (error) {
    }
  };

  /* =====================================================
     DESTROY RECAPTCHA
     
     Used only when completely necessary.
  ===================================================== */

  const destroyRecaptcha = () => {
    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
      }
    } catch (error) {
    }

    recaptchaVerifierRef.current = null;
    recaptchaWidgetIdRef.current = null;

    const container =
      document.getElementById(
        "recaptcha-container"
      );

    if (container) {
      container.innerHTML = "";
    }
  };

  /* =====================================================
     SEND OTP
  ===================================================== */

  const sendOTP = async (e) => {
    e.preventDefault();

    if (!validatePhone()) return;

    setLoading(true);

    try {
      const cleanedPhone = phone
        .replace(/\s/g, "")
        .trim();

      /*
       * Create reCAPTCHA only once.
       */
      const appVerifier =
        await setupRecaptcha();

      /*
       * Firebase sends OTP.
       */
      const confirmation =
        await signInWithPhoneNumber(
          auth,
          cleanedPhone,
          appVerifier
        );

      setConfirmationResult(
        confirmation
      );

      setTimer(30);

      setOtp(
        Array(6).fill("")
      );

      setStep("otp");

      toast.success(
        "OTP sent successfully 📱"
      );

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (error) {

      /*
       * Reset reCAPTCHA instead of
       * immediately creating another verifier.
       */
      resetRecaptcha();

      let message =
        "Unable to send OTP";

      switch (error?.code) {
        case "auth/invalid-phone-number":
          message =
            "Invalid phone number.";
          break;

        case "auth/too-many-requests":
          message =
            "Too many attempts. Please try again later.";
          break;

        case "auth/quota-exceeded":
          message =
            "SMS quota exceeded. Please try again later.";
          break;

        case "auth/operation-not-allowed":
          message =
            "Phone authentication is not enabled in Firebase.";
          break;

        case "auth/invalid-app-credential":
          message =
            "Firebase reCAPTCHA verification failed. Check your Firebase configuration and authorized domain.";
          break;

        case "auth/captcha-check-failed":
          message =
            "reCAPTCHA verification failed. Please try again.";
          break;

        default:
          message =
            error?.message ||
            "Unable to send OTP";
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     VERIFY OTP
  ===================================================== */

  const verifyOTP = async (code) => {
    if (!confirmationResult) {
      toast.error(
        "OTP session expired. Please request a new OTP."
      );

      setStep("phone");

      return;
    }

    if (code.length !== 6) {
      toast.error(
        "Enter the complete 6-digit OTP"
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * Firebase verifies OTP.
       */
      const result =
        await confirmationResult.confirm(
          code
        );

      const user = result.user;

      setFirebaseUser(user);

      /*
       * Get Firebase ID token.
       */
      const idToken =
        await user.getIdToken(true);

      setFirebaseIdToken(idToken);

      /*
       * Send Firebase token to
       * Odikart backend.
       */
      const response =
        await fetch(
          `${BACKEND_URL}/firebase-phone-login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${idToken}`,
            },

            body: JSON.stringify({
              app: "customer",
              ...(referralCode
                ? { referralCode }
                : {}),
            }),
          }
        );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to login"
        );
      }

      /* =================================================
         NEW USER
      ================================================= */

      if (data.isNewUser) {
        toast.success(
          "Phone verified! 🎉"
        );

        /*
         * Temporary Odikart JWT.
         */
        if (data.token) {
          localStorage.setItem(
            "tempToken",
            data.token
          );
        }

        /*
         * Save Firebase user information
         * temporarily if needed.
         */
        if (data.user) {
          localStorage.setItem(
            "tempPhoneUser",
            JSON.stringify(
              data.user
            )
          );
        }

        /*
         * Move to profile form.
         */
        setStep("details");

        return;
      }

      /* =================================================
         EXISTING USER
      ================================================= */

      if (data.token) {
        localStorage.setItem(
          "token",
          data.token
        );
      }

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(
            data.user
          )
        );
      }

      /*
       * Remove any old temporary token.
       */
      localStorage.removeItem(
        "tempToken"
      );

      localStorage.removeItem(
        "tempPhoneUser"
      );

      toast.success(
        "Welcome back! 🎉"
      );

      window.location.href = "/";
    } catch (error) {

      let message =
        "Invalid OTP";

      switch (error?.code) {
        case "auth/invalid-verification-code":
          message =
            "Incorrect OTP. Please try again.";
          break;

        case "auth/code-expired":
          message =
            "OTP expired. Please request a new OTP.";
          break;

        case "auth/session-expired":
          message =
            "OTP session expired. Please request a new OTP.";
          break;

        case "auth/invalid-verification-id":
          message =
            "OTP session is invalid. Please request a new OTP.";
          break;

        default:
          message =
            error?.message ||
            "Invalid OTP";
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     OTP INPUT
  ===================================================== */

  const handleOtpChange = (
    value,
    index
  ) => {
    /*
     * Only numbers.
     */
    if (!/^\d?$/.test(value)) {
      return;
    }

    const updated = [...otp];

    updated[index] = value;

    setOtp(updated);

    /*
     * Clear OTP error.
     */
    setErrors((prev) => ({
      ...prev,
      otp: "",
    }));

    /*
     * Move to next input.
     */
    if (
      value &&
      index < 5
    ) {
      otpRefs.current[
        index + 1
      ]?.focus();
    }

    /*
     * Automatically verify
     * when all six digits exist.
     */
    if (
      updated.every(
        (digit) => digit !== ""
      )
    ) {
      verifyOTP(
        updated.join("")
      );
    }
  };

  /* =====================================================
     OTP KEYBOARD
  ===================================================== */

  const handleOtpKeyDown = (
    e,
    index
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      otpRefs.current[
        index - 1
      ]?.focus();
    }
  };

  /* =====================================================
     OTP PASTE
  ===================================================== */

  const handleOtpPaste = (
    e
  ) => {
    e.preventDefault();

    const pasted =
      e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!pasted) return;

    const updated =
      Array(6).fill("");

    pasted
      .split("")
      .forEach(
        (digit, index) => {
          updated[index] =
            digit;
        }
      );

    setOtp(updated);

    /*
     * Focus next empty field
     * or last field.
     */
    const nextIndex =
      Math.min(
        pasted.length,
        5
      );

    otpRefs.current[
      nextIndex
    ]?.focus();

    /*
     * Auto verify.
     */
    if (
      pasted.length === 6
    ) {
      verifyOTP(pasted);
    }
  };

  /* =====================================================
     RESEND OTP
  ===================================================== */

  const resendOTP = async () => {
    if (timer > 0 || loading) {
      return;
    }

    setLoading(true);

    /*
     * Clear old confirmation.
     */
    setConfirmationResult(null);

    setOtp(
      Array(6).fill("")
    );

    try {
      const cleanedPhone =
        phone
          .replace(/\s/g, "")
          .trim();

      /*
       * Reuse the same verifier.
       */
      const appVerifier =
        await setupRecaptcha();

      /*
       * Reset widget before
       * another Firebase request.
       */
      resetRecaptcha();

      const confirmation =
        await signInWithPhoneNumber(
          auth,
          cleanedPhone,
          appVerifier
        );

      setConfirmationResult(
        confirmation
      );

      setTimer(30);

      toast.success(
        "New OTP sent 📱"
      );

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (error) {

      resetRecaptcha();

      let message =
        "Unable to resend OTP";

      switch (error?.code) {
        case "auth/too-many-requests":
          message =
            "Too many attempts. Please try again later.";
          break;

        case "auth/quota-exceeded":
          message =
            "SMS quota exceeded. Please try again later.";
          break;

        case "auth/invalid-app-credential":
          message =
            "Firebase reCAPTCHA verification failed.";
          break;

        default:
          message =
            error?.message ||
            "Unable to resend OTP";
      }

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     PROFILE FORM
  ===================================================== */

  const handleDetailsChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  /* =====================================================
     COMPLETE PROFILE
  ===================================================== */

  const completeProfile =
    async (e) => {
      e.preventDefault();

      const newErrors = {};

      if (!form.firstName.trim()) {
        newErrors.firstName =
          "First name is required";
      }

      if (!form.lastName.trim()) {
        newErrors.lastName =
          "Last name is required";
      }

      /*
       * Email is optional.
       */
      if (
        form.email.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim()
        )
      ) {
        newErrors.email =
          "Enter a valid email address";
      }

      setErrors(newErrors);

      if (
        Object.keys(newErrors)
          .length > 0
      ) {
        return;
      }

      setLoading(true);

      try {
        const tempToken =
          localStorage.getItem(
            "tempToken"
          );

        if (!tempToken) {
          throw new Error(
            "Profile session expired. Please login again."
          );
        }

        const response =
          await fetch(
            `${BACKEND_URL}/complete-profile`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${tempToken}`,
              },

              body: JSON.stringify({
                firstName:
                  form.firstName.trim(),

                lastName:
                  form.lastName.trim(),

                /*
                 * Send undefined instead of null
                 * when no email was entered.
                 */
                ...(form.email.trim()
                  ? {
                      email:
                        form.email
                          .trim()
                          .toLowerCase(),
                    }
                  : {}),
              }),
            }
          );

        let data;

        try {
          data =
            await response.json();
        } catch {
          throw new Error(
            "Invalid server response"
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to complete profile"
          );
        }

        /*
         * Save FINAL Odikart JWT.
         */
        if (data.token) {
          localStorage.setItem(
            "token",
            data.token
          );
        }

        /*
         * Save user.
         */
        if (data.user) {
          localStorage.setItem(
            "user",
            JSON.stringify(
              data.user
            )
          );
        }

        /*
         * Remove temporary data.
         */
        localStorage.removeItem(
          "tempToken"
        );

        localStorage.removeItem(
          "tempPhoneUser"
        );

        toast.success(
          "Account created successfully 🎉"
        );

        window.location.href = "/";
      } catch (error) {

        toast.error(
          error?.message ||
            "Unable to complete profile"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =====================================================
     BACK TO PHONE
  ===================================================== */

  const backToPhone = () => {
    setStep("phone");

    setOtp(
      Array(6).fill("")
    );

    setErrors({});

    setConfirmationResult(
      null
    );

    setTimer(0);

    /*
     * Keep verifier alive.
     *
     * We do NOT destroy/recreate it
     * just because user changes number.
     */
    resetRecaptcha();
  };

  /* =====================================================
     SKIP LOGIN
  ===================================================== */

  const handleSkip = () => {
    navigate("/");
  };

  /* =====================================================
     UI
     Premium Indigo + Purple Odikart ecommerce design
     Uses the real /logo.png from public/
  ===================================================== */

  return (
    <div className="odikart-auth">
      <button
        type="button"
        className="skip-login-btn"
        onClick={handleSkip}
        aria-label="Skip login and continue shopping"
      >
        Skip
        <FaArrowRight size={11} />
      </button>

      <style>{`
        .odikart-auth {
          --indigo-950: #17144f;
          --indigo-900: #211b68;
          --indigo-800: #312e81;
          --purple-700: #6d28d9;
          --purple-600: #7c3aed;
          --purple-500: #8b5cf6;
          --ink: #111827;
          --muted: #718096;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 28px;
          box-sizing: border-box;
          overflow: hidden;
          background:
            radial-gradient(circle at 12% 15%, rgba(124,58,237,.16), transparent 28%),
            radial-gradient(circle at 90% 85%, rgba(79,70,229,.14), transparent 32%),
            #f7f7fb;
          color: var(--ink);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .skip-login-btn {
          position: fixed;
          top: 20px;
          right: 24px;
          z-index: 100;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 76px;
          height: 38px;
          padding: 0 14px;
          border: 1px solid rgba(255,255,255,.24);
          border-radius: 999px;
          color: #fff;
          background: rgba(23,20,79,.72);
          box-shadow: 0 10px 28px rgba(23,20,79,.20);
          backdrop-filter: blur(14px);
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s ease;
        }

        .skip-login-btn:hover {
          transform: translateY(-1px);
          background: rgba(23,20,79,.88);
          box-shadow: 0 14px 32px rgba(23,20,79,.28);
        }

        .skip-login-btn:active {
          transform: translateY(0);
        }

        .odikart-auth-shell {
          position: relative;
          width: min(1180px, 100%);
          min-height: 760px;
          display: grid;
          grid-template-columns: 1.05fr .95fr;
          overflow: hidden;
          border-radius: 34px;
          background: #fff;
          border: 1px solid rgba(31, 27, 91, .08);
          box-shadow:
            0 35px 100px rgba(31, 25, 90, .18),
            0 10px 30px rgba(31, 25, 90, .08);
        }

        /* ================================
           PREMIUM HERO
        ================================= */

        .odikart-banner {
          position: relative;
          min-height: 760px;
          overflow: hidden;
          color: #fff;
          background:
            radial-gradient(circle at 78% 20%, rgba(196,181,253,.25), transparent 24%),
            radial-gradient(circle at 18% 88%, rgba(99,102,241,.28), transparent 30%),
            linear-gradient(135deg, #17144f 0%, #28216e 40%, #4c1d95 72%, #7c3aed 100%);
        }

        .odikart-banner::before {
          content: "";
          position: absolute;
          width: 520px;
          height: 520px;
          right: -270px;
          top: 70px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,.12);
          box-shadow:
            0 0 0 42px rgba(255,255,255,.025),
            0 0 0 88px rgba(255,255,255,.018);
        }

        .odikart-banner::after {
          content: "";
          position: absolute;
          width: 380px;
          height: 380px;
          left: -230px;
          bottom: -190px;
          border-radius: 50%;
          background: rgba(167,139,250,.18);
          filter: blur(12px);
        }

        .banner-grid {
          position: absolute;
          inset: -40px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          transform: rotate(-7deg) scale(1.1);
          opacity: .18;
        }

        .banner-grid-item {
          min-height: 120px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 20px;
          background: rgba(255,255,255,.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
        }

        .banner-grid-item:nth-child(2n) {
          transform: translateY(18px);
        }

        .banner-grid-item:nth-child(3n) {
          transform: translateY(-15px);
        }

        .banner-content {
          position: relative;
          z-index: 5;
          height: 100%;
          min-height: 760px;
          padding: 58px 54px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .banner-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          max-width: 230px;
          min-height: 68px;
          padding: 10px 18px;
          border-radius: 19px;
          background: rgba(255,255,255,.09);
          border: 1px solid rgba(255,255,255,.15);
          backdrop-filter: blur(18px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.10),
            0 15px 40px rgba(0,0,0,.14);
          background-color:white;
        }

        .banner-logo img {
          display: block;
          width: auto;
          max-width: 195px;
          max-height: 48px;
          object-fit: contain;
        }

        .banner-main {
          margin-top: 35px;
          max-width: 560px;
        }

        .premium-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 13px;
          border-radius: 999px;
          color: #ede9fe;
          background: rgba(255,255,255,.08);
          border: 1px solid rgba(255,255,255,.14);
          backdrop-filter: blur(12px);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .09em;
          text-transform: uppercase;
        }

        .premium-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c4b5fd;
          box-shadow: 0 0 15px rgba(196,181,253,.9);
        }

        .banner-title {
          margin: 20px 0 0;
          font-size: clamp(46px, 4.6vw, 67px);
          line-height: 1.02;
          letter-spacing: -.055em;
          font-weight: 900;
        }

        .banner-title span {
          background: linear-gradient(90deg, #fff, #ddd6fe, #c4b5fd);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .banner-subtitle {
          max-width: 520px;
          margin: 22px 0 0;
          color: rgba(255,255,255,.72);
          font-size: 17px;
          line-height: 1.7;
        }

        .banner-trust {
          display: flex;
          align-items: center;
          gap: 22px;
          color: rgba(255,255,255,.64);
          font-size: 11px;
          font-weight: 650;
        }

        .banner-trust-item {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .banner-trust-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          color: #ddd6fe;
          background: rgba(255,255,255,.09);
          border: 1px solid rgba(255,255,255,.10);
        }

        /* ================================
           FLOATING ECOMMERCE PRODUCTS
        ================================= */

        .products {
          position: absolute;
          z-index: 4;
          inset: 0;
          pointer-events: none;
        }

        .product {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px;
          background: rgba(255,255,255,.09);
          border: 1px solid rgba(255,255,255,.17);
          backdrop-filter: blur(20px);
          box-shadow:
            0 25px 55px rgba(12,7,50,.28),
            inset 0 1px 0 rgba(255,255,255,.10);
        }

        .product-phone {
          width: 105px;
          height: 175px;
          right: 35px;
          top: 145px;
          transform: rotate(9deg);
        }

        .phone-device {
          width: 61px;
          height: 120px;
          padding: 4px;
          border-radius: 13px;
          background: #15142a;
          border: 1px solid rgba(255,255,255,.28);
        }

        .phone-screen {
          height: 100%;
          border-radius: 10px;
          background: linear-gradient(160deg, #3730a3, #7c3aed);
          overflow: hidden;
          padding-top: 6px;
        }

        .phone-notch {
          width: 23px;
          height: 5px;
          margin: 0 auto;
          border-radius: 10px;
          background: #11111c;
        }

        .phone-logo {
          width: 25px;
          height: 25px;
          margin: 20px auto 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: rgba(255,255,255,.9);
          overflow: hidden;
        }

        .phone-logo img {
          width: 85%;
          height: 85%;
          object-fit: contain;
        }

        .product-headphones {
          width: 130px;
          height: 130px;
          left: 35px;
          top: 150px;
          transform: rotate(-8deg);
        }

        .headphone-shape {
          position: relative;
          width: 78px;
          height: 76px;
        }

        .headphone-arc {
          position: absolute;
          left: 12px;
          top: 2px;
          width: 54px;
          height: 63px;
          border: 8px solid rgba(255,255,255,.92);
          border-bottom: 0;
          border-radius: 50px 50px 0 0;
        }

        .ear {
          position: absolute;
          bottom: 0;
          width: 25px;
          height: 37px;
          border-radius: 11px;
          background: #fff;
        }

        .ear.left {
          left: 0;
        }

        .ear.right {
          right: 0;
        }

        .product-watch {
          width: 125px;
          height: 145px;
          right: 92px;
          bottom: 135px;
          transform: rotate(-7deg);
        }

        .watch-shape {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .watch-band {
          width: 38px;
          height: 29px;
          border-radius: 10px 10px 3px 3px;
          background: #222237;
        }

        .watch-band.bottom {
          border-radius: 3px 3px 10px 10px;
        }

        .watch-face {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          background: linear-gradient(145deg, #312e81, #8b5cf6);
          border: 4px solid #29283c;
          box-shadow: 0 12px 25px rgba(0,0,0,.25);
        }

        .watch-time {
          font-size: 11px;
          font-weight: 850;
          color: #fff;
        }

        .product-parcel {
          width: 145px;
          height: 110px;
          left: 45px;
          bottom: 110px;
          transform: rotate(5deg);
        }

        .parcel {
          position: relative;
          width: 83px;
          height: 68px;
        }

        .parcel-top {
          position: absolute;
          left: 4px;
          top: 2px;
          width: 76px;
          height: 31px;
          transform: skewY(-18deg);
          border-radius: 4px;
          background: #f3e8ff;
        }

        .parcel-front {
          position: absolute;
          left: 4px;
          bottom: 0;
          width: 76px;
          height: 49px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: #e9d5ff;
        }

        .parcel-front img {
          width: 46px;
          max-height: 23px;
          object-fit: contain;
        }

        .parcel-tape {
          position: absolute;
          top: 2px;
          left: 38px;
          width: 12px;
          height: 65px;
          background: rgba(124,58,237,.48);
        }

        .product-bag {
          width: 120px;
          height: 125px;
          right: 220px;
          bottom: 70px;
          transform: rotate(7deg);
        }

        .bag {
          position: relative;
          width: 68px;
          height: 73px;
        }

        .bag-handle {
          position: absolute;
          left: 17px;
          top: 0;
          width: 34px;
          height: 29px;
          border: 6px solid #fff;
          border-bottom: 0;
          border-radius: 30px 30px 0 0;
        }

        .bag-body {
          position: absolute;
          left: 2px;
          bottom: 0;
          width: 64px;
          height: 59px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: linear-gradient(145deg, #fff, #ddd6fe);
        }

        .bag-body span {
          color: #5127a5;
          font-size: 28px;
          font-weight: 950;
        }

        .product-shoe {
          width: 115px;
          height: 95px;
          right: 240px;
          top: 85px;
          transform: rotate(-8deg);
        }

        .shoe-shape {
          position: relative;
          width: 78px;
          height: 48px;
        }

        .shoe-upper {
          position: absolute;
          left: 5px;
          bottom: 12px;
          width: 60px;
          height: 26px;
          border-radius: 22px 12px 5px 7px;
          background: #f5f3ff;
          transform: skewX(-20deg);
        }

        .shoe-sole {
          position: absolute;
          left: 0;
          bottom: 7px;
          width: 76px;
          height: 9px;
          border-radius: 10px;
          background: #c4b5fd;
        }

        .shoe-line {
          position: absolute;
          left: 28px;
          bottom: 29px;
          width: 20px;
          height: 3px;
          background: #7c3aed;
          transform: rotate(35deg);
        }

        /* ================================
           AUTH PANEL
        ================================= */

        .auth-panel {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background:
            radial-gradient(circle at 100% 0%, rgba(124,58,237,.07), transparent 30%),
            #fff;
        }

        .auth-inner {
          width: min(390px, 100%);
        }

        .mobile-brand {
          display: none;
        }

        .auth-kicker {
          margin: 0 0 9px;
          color: #6d28d9;
          font-size: 11px;
          font-weight: 850;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .auth-title {
          margin: 0;
          color: #17144f;
          font-size: 34px;
          line-height: 1.05;
          font-weight: 900;
          letter-spacing: -.05em;
        }

        .auth-subtitle {
          margin: 10px 0 27px;
          color: #718096;
          font-size: 13px;
          line-height: 1.65;
        }

        .field-label {
          display: block;
          margin: 0 0 8px;
          color: #30384a;
          font-size: 11px;
          font-weight: 800;
        }

        .phone-field {
          width: 100%;
          height: 56px;
          display: flex;
          align-items: center;
          overflow: hidden;
          border: 1px solid #dfe3ed;
          border-radius: 15px;
          background: #fff;
          transition: .18s ease;
        }

        .phone-field:focus-within {
          border-color: #7c3aed;
          box-shadow: 0 0 0 4px rgba(124,58,237,.09);
        }

        .phone-prefix {
          height: 100%;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0 13px;
          border-right: 1px solid #eceef4;
          color: #29205e;
          font-size: 12px;
          font-weight: 850;
          white-space: nowrap;
        }

        .phone-prefix span {
          color: #8b94a5;
          font-size: 9px;
        }

        .phone-number-input {
          flex: 1;
          min-width: 0;
          height: 100%;
          padding: 0 13px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #15182b;
          font-size: 14px;
          font-weight: 650;
        }

        .phone-number-input::placeholder {
          color: #a7afbd;
          font-weight: 450;
        }

        .phone-clear {
          width: 38px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: #7d8798;
          cursor: pointer;
          font-size: 18px;
        }

        .form-error {
          margin: 7px 2px 0;
          color: #dc2626;
          font-size: 10px;
          font-weight: 700;
        }

        .continue-btn {
          width: 100%;
          height: 55px;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border: 0;
          border-radius: 15px;
          color: #fff;
          background: linear-gradient(135deg, #4338ca, #7c3aed);
          box-shadow: 0 14px 28px rgba(109,40,217,.23);
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          transition: .2s ease;
        }

        .continue-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 18px 34px rgba(109,40,217,.28);
        }

        .continue-btn:disabled {
          color: #858da0;
          background: #e9eaf0;
          box-shadow: none;
          cursor: not-allowed;
        }

        .referral-box {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          padding: 12px 13px;
          border: 1px solid #e5d8ff;
          border-radius: 14px;
          background:
            linear-gradient(
              135deg,
              rgba(124,58,237,.08),
              rgba(99,102,241,.04)
            );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.8);
        }

        .referral-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          color: #6d28d9;
          background: #f1e8ff;
        }

        .referral-copy {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .referral-copy strong {
          color: #4c1d95;
          font-size: 10px;
          font-weight: 850;
        }

        .referral-copy span {
          color: #81758f;
          font-size: 9px;
          line-height: 1.45;
        }

        .referral-copy b {
          color: #6d28d9;
          font-weight: 900;
          letter-spacing: .04em;
        }

        .referral-check {
          flex: 0 0 auto;
          color: #16a34a;
        }

        .profile-referral {
          margin-top: -5px;
          margin-bottom: 18px;
        }

        .trust-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 14px;
          color: #8b94a5;
          font-size: 10px;
          font-weight: 650;
        }

        .trust-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          color: #6d28d9;
          background: #f3e8ff;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 20px 0 12px;
          color: #a0a7b5;
          font-size: 9px;
          font-weight: 800;
        }

        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: #eceef3;
        }

        .terms {
          margin: 0;
          text-align: center;
          color: #9aa2b0;
          font-size: 9px;
          line-height: 1.6;
        }

        /* ================================
           OTP
        ================================= */

        .otp-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 21px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #5530a0;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .otp-title,
        .details-title {
          margin: 0;
          color: #17144f;
          font-size: 31px;
          line-height: 1.08;
          font-weight: 900;
          letter-spacing: -.05em;
        }

        .otp-desc,
        .details-desc {
          margin: 9px 0 0;
          color: #758095;
          font-size: 12px;
          line-height: 1.65;
        }

        .otp-number {
          color: #5b21b6;
          font-weight: 850;
        }

        .otp-inputs {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          margin: 28px 0 14px;
        }

        .otp-input {
          width: 100%;
          height: 56px;
          border: 1px solid #dfe3ed;
          border-radius: 14px;
          outline: none;
          text-align: center;
          color: #17144f;
          background: #fbfbfd;
          font-size: 20px;
          font-weight: 900;
          transition: .18s ease;
        }

        .otp-input:focus {
          border-color: #7c3aed;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(124,58,237,.09);
        }

        .otp-status {
          min-height: 18px;
          text-align: center;
          color: #8b94a5;
          font-size: 10px;
          font-weight: 650;
        }

        .resend-btn {
          padding: 0;
          border: 0;
          background: transparent;
          color: #6d28d9;
          font-weight: 850;
          cursor: pointer;
        }

        .resend-btn:disabled {
          color: #9aa2b0;
          cursor: not-allowed;
        }

        .otp-security {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 25px;
          padding: 13px;
          border: 1px solid #eadffb;
          border-radius: 13px;
          background: #faf7ff;
          color: #74658c;
          font-size: 9px;
          line-height: 1.6;
        }

        .otp-security svg {
          flex: 0 0 auto;
          margin-top: 1px;
          color: #7c3aed;
        }

        /* ================================
           PROFILE
        ================================= */

        .verified-box {
          display: flex;
          align-items: center;
          gap: 7px;
          margin: 19px 0 18px;
          padding: 11px 12px;
          border: 1px solid #dfd5f8;
          border-radius: 11px;
          background: #faf8ff;
          color: #5b21b6;
          font-size: 10px;
          font-weight: 800;
        }

        .details-field {
          margin-bottom: 13px;
        }

        .details-label {
          display: block;
          margin: 0 0 7px;
          color: #354055;
          font-size: 10px;
          font-weight: 800;
        }

        .details-input {
          width: 100%;
          height: 49px;
          padding: 0 12px;
          border: 1px solid #dfe3ed;
          border-radius: 12px;
          outline: 0;
          color: #15182b;
          background: #fff;
          font-size: 12px;
          transition: .18s ease;
        }

        .details-input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 4px rgba(124,58,237,.08);
        }

        .details-input.error {
          border-color: #ef4444;
        }

        .recaptcha-wrap {
          min-height: 0;
        }

        @media (max-width: 980px) {
          .odikart-auth-shell {
            grid-template-columns: 1fr;
            max-width: 500px;
            min-height: auto;
          }

          .odikart-banner {
            min-height: 310px;
          }

          .banner-content {
            min-height: 310px;
            padding: 32px;
          }

          .banner-main {
            margin-top: 18px;
          }

          .banner-title {
            font-size: 40px;
          }

          .banner-subtitle,
          .banner-trust {
            display: none;
          }

          .products {
            opacity: .65;
          }

          .product-phone {
            right: 50px;
            top: 55px;
          }

          .product-headphones {
            left: 30px;
            top: 95px;
          }

          .product-watch,
          .product-parcel,
          .product-bag,
          .product-shoe {
            display: none;
          }

          .auth-panel {
            padding: 30px;
          }

          .mobile-brand {
            display: flex;
            margin-bottom: 25px;
          }

          .mobile-brand img {
            max-width: 150px;
            max-height: 38px;
            object-fit: contain;
          }
        }

        @media (max-width: 560px) {
          .skip-login-btn {
            top: 14px;
            right: 14px;
            min-width: 68px;
            height: 34px;
            padding: 0 11px;
            font-size: 11px;
          }

          .odikart-auth {
            min-height: 100dvh;
            padding: 0;
            align-items: stretch;
          }

          .odikart-auth-shell {
            width: 100%;
            max-width: none;
            min-height: 100dvh;
            border: 0;
            border-radius: 0;
            box-shadow: none;
          }

          .odikart-banner {
            min-height: 255px;
          }

          .banner-content {
            min-height: 255px;
            padding: 24px 22px;
          }

          .banner-logo {
            min-height: 53px;
            padding: 8px 13px;
            background: #fff;
            border-radius: 15px;
          }

          .banner-logo img {
            max-width: 150px;
            max-height: 35px;
          }

          .banner-main {
            margin-top: 16px;
          }

          .premium-badge {
            padding: 7px 10px;
            font-size: 8px;
          }

          .banner-title {
            margin-top: 13px;
            font-size: 31px;
          }

          .product-phone {
            width: 85px;
            height: 140px;
            right: 12px;
            top: 48px;
          }

          .product-headphones {
            width: 95px;
            height: 95px;
            left: 5px;
            top: 100px;
          }

          .auth-panel {
            align-items: flex-start;
            padding: 28px 20px 35px;
          }

          .auth-inner {
            width: 100%;
          }

          .auth-title {
            font-size: 29px;
          }

          .auth-subtitle {
            margin-bottom: 22px;
          }

          .otp-inputs {
            gap: 5px;
          }

          .otp-input {
            height: 50px;
            border-radius: 11px;
          }
        }

        @media (max-width: 380px) {
          .banner-title {
            font-size: 27px;
          }

          .auth-panel {
            padding-left: 16px;
            padding-right: 16px;
          }

          .otp-input {
            height: 46px;
            font-size: 18px;
          }
        }
      `}</style>

      <div className="odikart-auth-shell">
        <section className="odikart-banner">
          <div className="banner-grid" aria-hidden="true">
            <div className="banner-grid-item">📱</div>
            <div className="banner-grid-item">🎧</div>
            <div className="banner-grid-item">⌚</div>
            <div className="banner-grid-item">💻</div>
            <div className="banner-grid-item">👟</div>
            <div className="banner-grid-item">👜</div>
            <div className="banner-grid-item">📷</div>
            <div className="banner-grid-item">🎮</div>
          </div>

          <div className="banner-content">
            <div>
              <div className="banner-logo">
                <img src="/logo.png" alt="Odikart" />
              </div>

              <div className="banner-main">
                <div className="premium-badge">
                  <span className="premium-dot"></span>
                  Premium shopping experience
                </div>

                <h2 className="banner-title">
                  Everything You Need.
                  <br />
                  <span>One Smart Cart.</span>
                </h2>

                <p className="banner-subtitle">
                  Shop electronics, fashion, lifestyle & more at great prices.
                  Discover a smarter way to shop with Odikart.
                </p>
              </div>
            </div>

            <div className="banner-trust">
              <div className="banner-trust-item">
                <span className="banner-trust-icon">
                  <FaShieldAlt size={11} />
                </span>
                Secure
              </div>

              <div className="banner-trust-item">
                <span className="banner-trust-icon">
                  <FaCheckCircle size={11} />
                </span>
                Trusted
              </div>

              <div className="banner-trust-item">
                <span className="banner-trust-icon">
                  <FaArrowRight size={11} />
                </span>
                Simple
              </div>
            </div>
          </div>

          <div className="products" aria-hidden="true">
            <div className="product product-headphones">
              <div className="headphone-shape">
                <div className="headphone-arc"></div>
                <div className="ear left"></div>
                <div className="ear right"></div>
              </div>
            </div>

            <div className="product product-phone">
              <div className="phone-device">
                <div className="phone-screen">
                  <div className="phone-notch"></div>
                  <div className="phone-logo">
                    <img src="/logo.png" alt="" />
                  </div>
                </div>
              </div>
            </div>

            <div className="product product-watch">
              <div className="watch-shape">
                <div className="watch-band"></div>
                <div className="watch-face">
                  <span className="watch-time">10:09</span>
                </div>
                <div className="watch-band bottom"></div>
              </div>
            </div>

            <div className="product product-parcel">
              <div className="parcel">
                <div className="parcel-top"></div>
                <div className="parcel-front">
                  <img src="/logo.png" alt="" />
                </div>
                <div className="parcel-tape"></div>
              </div>
            </div>

            <div className="product product-bag">
              <div className="bag">
                <div className="bag-handle"></div>
                <div className="bag-body">
                  <span>O</span>
                </div>
              </div>
            </div>

            <div className="product product-shoe">
              <div className="shoe-shape">
                <div className="shoe-upper"></div>
                <div className="shoe-sole"></div>
                <div className="shoe-line"></div>
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-inner">
            <div className="mobile-brand">
              <img src="/logo.png" alt="Odikart" />
            </div>

            {step === "phone" && (
              <>
                <p className="auth-kicker">Welcome to Odikart</p>

                <h1 className="auth-title">
                  Shop smarter.
                </h1>

                <p className="auth-subtitle">
                  Log in or sign up with your mobile number to continue
                  shopping.
                </p>

                <form onSubmit={sendOTP}>
                  <label className="field-label">
                    Mobile Number
                  </label>

                  <div className="phone-field">
                    <div className="phone-prefix">
                      +91 <span>⌄</span>
                    </div>

                    <input
                      type="tel"
                      value={phone.replace(/^\+91\s?/, "")}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10);

                        setPhone(`+91 ${digits}`);
                        setErrors({});
                      }}
                      placeholder="Enter phone number"
                      className="phone-number-input"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      aria-label="Phone Number"
                    />

                    {phone.replace(/\D/g, "").length > 2 && (
                      <button
                        type="button"
                        className="phone-clear"
                        aria-label="Clear phone number"
                        onClick={() => {
                          setPhone("+91 ");
                          setErrors({});
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {errors.phone && (
                    <div className="form-error">
                      {errors.phone}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !/^\+91[6-9]\d{9}$/.test(
                        phone.replace(/\s/g, "").trim()
                      )
                    }
                    className="continue-btn"
                  >
                    {loading ? "Sending OTP..." : "Continue"}
                    {!loading && <FaArrowRight size={11} />}
                  </button>

                  {referralCode && (
                    <div className="referral-box">
                      <span className="referral-icon">
                        <FaGift size={10} />
                      </span>

                      <div className="referral-copy">
                        <strong>Referral applied</strong>
                        <span>
                          Code <b>{referralCode}</b> will be linked to your
                          new Odikart account.
                        </span>
                      </div>

                      <FaCheckCircle
                        className="referral-check"
                        size={14}
                      />
                    </div>
                  )}

                  <div className="trust-row">
                    <span className="trust-icon">
                      <FaShieldAlt size={9} />
                    </span>
                    Secure OTP verification
                  </div>

                  <div className="divider">SAFE & SECURE</div>

                  <p className="terms">
                    By continuing, you agree to receive a verification code
                    on your mobile number.
                  </p>
                </form>
              </>
            )}

            {step === "otp" && (
              <div>
                <button
                  type="button"
                  className="otp-back"
                  onClick={backToPhone}
                  disabled={loading}
                >
                  ← Change mobile number
                </button>

                <p className="auth-kicker">Secure verification</p>

                <h1 className="otp-title">
                  Enter your OTP
                </h1>

                <p className="otp-desc">
                  We've sent a verification code to{" "}
                  <span className="otp-number">{phone}</span>
                </p>

                <div className="otp-inputs">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        otpRefs.current[index] = el;
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
                      onPaste={
                        index === 0
                          ? handleOtpPaste
                          : undefined
                      }
                      autoComplete={
                        index === 0
                          ? "one-time-code"
                          : "off"
                      }
                      aria-label={`OTP digit ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="otp-status">
                  {timer > 0 ? (
                    <>Resend OTP in {timer}s</>
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
                </div>

                <div className="otp-security">
                  <FaShieldAlt size={12} />
                  <span>
                    Your verification is protected by secure Firebase
                    phone authentication. The code will verify
                    automatically after all digits are entered.
                  </span>
                </div>
              </div>
            )}

            {step === "details" && (
              <form onSubmit={completeProfile}>
                <p className="auth-kicker">Almost there</p>

                <h1 className="details-title">
                  Complete your profile
                </h1>

                <p className="details-desc">
                  Your mobile number is verified. Add your details to
                  finish setting up Odikart.
                </p>

                <div className="verified-box">
                  <FaCheckCircle size={11} />
                  {phone} · Verified
                </div>

                {referralCode && (
                  <div className="referral-box profile-referral">
                    <span className="referral-icon">
                      <FaGift size={10} />
                    </span>

                    <div className="referral-copy">
                      <strong>Referral code applied</strong>
                      <span>
                        <b>{referralCode}</b> · Your referral will be linked
                        when this new account is created.
                      </span>
                    </div>

                    <FaCheckCircle
                      className="referral-check"
                      size={14}
                    />
                  </div>
                )}

                <div className="details-field">
                  <label className="details-label">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleDetailsChange}
                    placeholder="First name"
                    className={`details-input ${
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

                <div className="details-field">
                  <label className="details-label">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleDetailsChange}
                    placeholder="Last name"
                    className={`details-input ${
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

                <div className="details-field">
                  <label className="details-label">
                    Email{" "}
                    <span
                      style={{
                        color: "#9aa2b0",
                        fontWeight: 500,
                      }}
                    >
                      (optional)
                    </span>
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleDetailsChange}
                    placeholder="you@example.com"
                    className={`details-input ${
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
                  className="continue-btn"
                >
                  {loading
                    ? "Creating Account..."
                    : "Finish & Continue"}
                  {!loading && <FaArrowRight size={11} />}
                </button>
              </form>
            )}

            <div
              id="recaptcha-container"
              className="recaptcha-wrap"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
