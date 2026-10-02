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

  const referralFromUrl =
    searchParams.get("ref")?.trim().toUpperCase() || "";

  const [referralCode, setReferralCode] = useState(() => {
    if (referralFromUrl) {
      localStorage.setItem(
        REFERRAL_STORAGE_KEY,
        referralFromUrl
      );

      return referralFromUrl;
    }

    return (
      localStorage
        .getItem(REFERRAL_STORAGE_KEY)
        ?.trim()
        .toUpperCase() || ""
    );
  });

  /* =====================================================
     REFS
  ===================================================== */

  const recaptchaVerifierRef = useRef(null);
  const recaptchaWidgetIdRef = useRef(null);

  const otpRefs = useRef([]);
  const phoneInputRef = useRef(null);

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

     IMPORTANT:
     This MUST NOT be inside a comment.
  ===================================================== */

  /* =====================================================
     PHONE INPUT AUTO FOCUS
     ===================================================== */

  useEffect(() => {
    if (step !== "phone") return;

    const timerId = window.setTimeout(() => {
      phoneInputRef.current?.focus();
      phoneInputRef.current?.select?.();
    }, 100);

    return () => window.clearTimeout(timerId);
  }, [step]);

  const handlePageClick = (e) => {
    if (step !== "phone" || loading) return;

    const target = e.target;

    /* Do not steal focus from buttons, links, or form controls. */
    if (
      target?.closest?.("button, a, input, textarea, select, label")
    ) {
      return;
    }

    phoneInputRef.current?.focus();
  };

  useEffect(() => {
    if (timer <= 0) return;

    const interval = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
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
        console.error(
          "reCAPTCHA cleanup error:",
          error
        );
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
     RECAPTCHA LIFECYCLE

     IMPORTANT:
     - One live verifier is used at a time.
     - We never blindly reuse a verifier whose DOM client
       has been removed.
     - On Firebase reCAPTCHA lifecycle errors we destroy
       the old verifier and create a fresh one.
  ===================================================== */

  const getRecaptchaContainer = () => {
    const container = document.getElementById(
      "recaptcha-container"
    );

    if (!container) {
      throw new Error(
        "reCAPTCHA container not found."
      );
    }

    return container;
  };

  const clearRecaptchaRefs = () => {
    recaptchaVerifierRef.current = null;
    recaptchaWidgetIdRef.current = null;
  };

  const destroyRecaptcha = () => {
    const verifier =
      recaptchaVerifierRef.current;

    const container =
      document.getElementById(
        "recaptcha-container"
      );

    try {
      if (verifier) {
        verifier.clear();
      }
    } catch (error) {
      console.warn(
        "⚠️ reCAPTCHA verifier clear:",
        error
      );
    }

    /*
     * Clear our refs AFTER Firebase verifier.clear().
     */
    clearRecaptchaRefs();

    /*
     * Only clear our own container.
     */
    if (container) {
      try {
        container.innerHTML = "";
      } catch (error) {
        console.warn(
          "⚠️ reCAPTCHA container clear:",
          error
        );
      }
    }

    console.log(
      "🧹 reCAPTCHA verifier destroyed"
    );
  };

  const setupRecaptcha = async () => {
    const container =
      getRecaptchaContainer();

    /*
     * If we already have a verifier, make sure its
     * widget/client still exists before reusing it.
     *
     * A verifier ref can survive even when Google/Firebase
     * has already removed the underlying client.
     */
    if (
      recaptchaVerifierRef.current &&
      recaptchaWidgetIdRef.current !== null &&
      recaptchaWidgetIdRef.current !== undefined
    ) {
      const widgetId =
        recaptchaWidgetIdRef.current;

      /*
       * If the container has been emptied, the old verifier
       * cannot safely be reused.
       */
      if (
        !container.firstElementChild
      ) {
        console.warn(
          "⚠️ reCAPTCHA container is empty. Creating a fresh verifier."
        );

        destroyRecaptcha();
      } else {
        console.log(
          "♻️ Reusing live reCAPTCHA verifier:",
          widgetId
        );

        return recaptchaVerifierRef.current;
      }
    }

    /*
     * Make sure no stale Firebase client remains.
     */
    if (recaptchaVerifierRef.current) {
      destroyRecaptcha();
    }

    /*
     * The container should be empty before render.
     */
    try {
      container.innerHTML = "";
    } catch {}

    const verifier =
      new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",

          callback: () => {
            console.log(
              "✅ reCAPTCHA completed"
            );
          },

          "expired-callback": () => {
            console.warn(
              "⚠️ reCAPTCHA expired"
            );

            /*
             * Do NOT clear the verifier here.
             * Firebase can use/reset the same verifier
             * for the next signInWithPhoneNumber call.
             */
          },

          "error-callback": () => {
            console.error(
              "❌ reCAPTCHA error"
            );
          },
        }
      );

    recaptchaVerifierRef.current =
      verifier;

    try {
      const widgetId =
        await verifier.render();

      recaptchaWidgetIdRef.current =
        widgetId;

      console.log(
        "✅ NEW reCAPTCHA initialized:",
        widgetId
      );

      return verifier;
    } catch (error) {
      console.error(
        "❌ reCAPTCHA render error:",
        error
      );

      try {
        verifier.clear();
      } catch {}

      clearRecaptchaRefs();

      try {
        container.innerHTML = "";
      } catch {}

      throw error;
    }
  };

  const resetRecaptcha = () => {
    const widgetId =
      recaptchaWidgetIdRef.current;

    if (
      widgetId === null ||
      widgetId === undefined
    ) {
      return;
    }

    try {
      if (
        window.grecaptcha &&
        typeof window.grecaptcha.reset ===
          "function"
      ) {
        window.grecaptcha.reset(
          widgetId
        );

        console.log(
          "🔄 reCAPTCHA reset:",
          widgetId
        );
      }
    } catch (error) {
      console.warn(
        "⚠️ reCAPTCHA reset failed. Destroying stale verifier.",
        error
      );

      /*
       * If reset itself says the Google client is gone,
       * the verifier is stale. Destroy it so the next OTP
       * request creates a completely fresh verifier.
       */
      destroyRecaptcha();
    }
  };

  const isRecaptchaLifecycleError = (
    error
  ) => {
    const message =
      String(
        error?.message || ""
      ).toLowerCase();

    return (
      message.includes(
        "recaptcha client element has been removed"
      ) ||
      message.includes(
        "recaptcha has already been rendered"
      ) ||
      message.includes(
        "already been rendered in this element"
      ) ||
      message.includes(
        "recaptcha client has been removed"
      )
    );
  };

  /*
   * Firebase sometimes leaves a stale reCAPTCHA client
   * after a failed request. This helper destroys that
   * client and creates a fresh verifier for retry.
   */
  const recreateRecaptcha = async () => {
    console.warn(
      "♻️ Recreating Firebase reCAPTCHA..."
    );

    destroyRecaptcha();

    /*
     * Let the DOM finish clearing before Firebase renders
     * another widget into the same element.
     */
    await new Promise((resolve) =>
      requestAnimationFrame(resolve)
    );

    return setupRecaptcha();
  };

  /* =====================================================
     COMPONENT CLEANUP
  ===================================================== */

  useEffect(() => {
    return () => {
      destroyRecaptcha();
    };
  }, []);

  /* =====================================================
     SEND OTP
  ===================================================== */

  const sendOTP = async (e) => {
    e.preventDefault();

    if (!validatePhone()) {
      return;
    }

    setLoading(true);

    try {
      const cleanedPhone =
        phone
          .replace(/\s/g, "")
          .trim();

      console.log(
        "📱 SENDING OTP TO:",
        cleanedPhone
      );

      let appVerifier =
        await setupRecaptcha();

      let confirmation;

      try {
        confirmation =
          await signInWithPhoneNumber(
            auth,
            cleanedPhone,
            appVerifier
          );
      } catch (error) {
        /*
         * If Google/Firebase reports that the reCAPTCHA
         * client was removed, recreate it exactly once
         * and retry the OTP request.
         */
        if (
          isRecaptchaLifecycleError(
            error
          )
        ) {
          console.warn(
            "⚠️ Stale reCAPTCHA detected during Send OTP. Recreating..."
          );

          appVerifier =
            await recreateRecaptcha();

          confirmation =
            await signInWithPhoneNumber(
              auth,
              cleanedPhone,
              appVerifier
            );
        } else {
          throw error;
        }
      }

      console.log(
        "✅ OTP SENT SUCCESSFULLY"
      );

      setConfirmationResult(
        confirmation
      );

      setOtp(
        Array(6).fill("")
      );

      setTimer(30);

      setStep("otp");

      toast.success(
        "OTP sent successfully 📱"
      );

      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 200);
    } catch (error) {
      console.error(
        "❌ SEND OTP ERROR:",
        error
      );

      console.error(
        "Firebase error code:",
        error?.code
      );

      console.error(
        "Firebase error message:",
        error?.message
      );

      if (
        isRecaptchaLifecycleError(
          error
        )
      ) {
        destroyRecaptcha();
      } else {
        resetRecaptcha();
      }

      let message =
        "Unable to send OTP.";

      switch (error?.code) {
        case "auth/invalid-phone-number":
          message =
            "Invalid phone number.";
          break;

        case "auth/too-many-requests":
          message =
            "Too many OTP attempts. Please try again later.";
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
            "Firebase verification failed. Please try again.";
          break;

        case "auth/captcha-check-failed":
          message =
            "reCAPTCHA verification failed. Please try again.";
          break;

        case "auth/app-not-authorized":
          message =
            "This domain is not authorized in Firebase.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Check your internet connection.";
          break;

        default:
          message =
            error?.message ||
            "Unable to send OTP.";
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
    if (loading) {
      return;
    }

    if (!confirmationResult) {
      toast.error(
        "OTP session expired. Please request a new OTP."
      );

      setStep("phone");
      setTimer(0);

      return;
    }

    if (code.length !== 6) {
      toast.error(
        "Enter the complete 6-digit OTP."
      );

      return;
    }

    setLoading(true);

    try {
      console.log(
        "🔐 VERIFYING OTP:",
        code
      );

      /*
       * Firebase OTP verification.
       */
      const result =
        await confirmationResult.confirm(
          code
        );

      const user = result.user;

      console.log(
        "✅ FIREBASE OTP VERIFIED:",
        user.phoneNumber
      );

      setFirebaseUser(user);

      /*
       * Get fresh Firebase ID token.
       */
      const idToken =
        await user.getIdToken(true);

      setFirebaseIdToken(idToken);

      console.log(
        "✅ FIREBASE ID TOKEN RECEIVED"
      );

      /*
       * Send token to Odikart backend.
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
                ? {
                    referralCode,
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
          "Invalid server response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to login."
        );
      }

      console.log(
        "✅ ODikart AUTH RESPONSE:",
        data
      );

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
         * Temporary user information.
         */
        if (data.user) {
          localStorage.setItem(
            "tempPhoneUser",
            JSON.stringify(data.user)
          );
        }

        /*
         * Stop OTP timer.
         */
        setTimer(0);

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
          JSON.stringify(data.user)
        );
      }

      localStorage.removeItem(
        "tempToken"
      );

      localStorage.removeItem(
        "tempPhoneUser"
      );

      setTimer(0);

      toast.success(
        "Welcome back! 🎉"
      );

      window.location.href = "/";
    } catch (error) {
      console.error(
        "❌ VERIFY OTP ERROR:",
        error
      );

      console.error(
        "Firebase error code:",
        error?.code
      );

      console.error(
        "Firebase error message:",
        error?.message
      );

      let message =
        "Invalid OTP.";

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
            "Invalid OTP.";
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
    if (!/^\d?$/.test(value)) {
      return;
    }

    /*
     * Don't allow editing while verification
     * request is running.
     */
    if (loading) {
      return;
    }

    const updated = [...otp];

    updated[index] = value;

    setOtp(updated);

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
     * Auto verify.
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

  const handleOtpPaste = (e) => {
    e.preventDefault();

    if (loading) {
      return;
    }

    const pasted =
      e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, 6);

    if (!pasted) {
      return;
    }

    const updated =
      Array(6).fill("");

    pasted
      .split("")
      .forEach(
        (digit, index) => {
          updated[index] = digit;
        }
      );

    setOtp(updated);

    const nextIndex =
      Math.min(
        pasted.length,
        5
      );

    otpRefs.current[
      nextIndex
    ]?.focus();

    if (
      pasted.length === 6
    ) {
      verifyOTP(pasted);
    }
  };

  /* =====================================================
     RESEND OTP

     IMPORTANT:
     - Wait until timer reaches 0.
     - setupRecaptcha() creates a fresh verifier.
     - DON'T reset before Firebase request.
     - Reset only after failure.
  ===================================================== */

  const resendOTP = async () => {
    if (
      timer > 0 ||
      loading
    ) {
      return;
    }

    const cleanedPhone =
      phone
        .replace(/\s/g, "")
        .trim();

    if (
      !/^\+91[6-9]\d{9}$/.test(
        cleanedPhone
      )
    ) {
      toast.error(
        "Invalid mobile number."
      );

      setStep("phone");

      return;
    }

    setLoading(true);

    setOtp(
      Array(6).fill("")
    );

    try {
      console.log(
        "📱 RESENDING OTP TO:",
        cleanedPhone
      );

      let appVerifier =
        await setupRecaptcha();

      let confirmation;

      try {
        confirmation =
          await signInWithPhoneNumber(
            auth,
            cleanedPhone,
            appVerifier
          );
      } catch (error) {
        /*
         * The most important recovery path:
         *
         * If Firebase says the current reCAPTCHA client
         * was removed, throw away the stale verifier,
         * render a new one, and retry once.
         */
        if (
          isRecaptchaLifecycleError(
            error
          )
        ) {
          console.warn(
            "⚠️ Stale reCAPTCHA detected during Resend OTP. Recreating..."
          );

          appVerifier =
            await recreateRecaptcha();

          confirmation =
            await signInWithPhoneNumber(
              auth,
              cleanedPhone,
              appVerifier
            );
        } else {
          throw error;
        }
      }

      console.log(
        "✅ NEW OTP SENT SUCCESSFULLY"
      );

      setConfirmationResult(
        confirmation
      );

      setOtp(
        Array(6).fill("")
      );

      setTimer(30);

      toast.success(
        "New OTP sent 📱"
      );

      requestAnimationFrame(() => {
        otpRefs.current[0]?.focus();
      });
    } catch (error) {
      console.error(
        "❌ RESEND OTP ERROR:",
        error
      );

      console.error(
        "Firebase error code:",
        error?.code
      );

      console.error(
        "Firebase error message:",
        error?.message
      );

      if (
        isRecaptchaLifecycleError(
          error
        )
      ) {
        destroyRecaptcha();
      } else {
        resetRecaptcha();
      }

      let message =
        "Unable to resend OTP.";

      switch (error?.code) {
        case "auth/too-many-requests":
          message =
            "Too many OTP attempts. Please wait and try again later.";
          break;

        case "auth/quota-exceeded":
          message =
            "SMS quota exceeded. Please try again later.";
          break;

        case "auth/invalid-phone-number":
          message =
            "Invalid mobile number.";
          break;

        case "auth/invalid-app-credential":
          message =
            "Firebase verification failed. Please try again.";
          break;

        case "auth/captcha-check-failed":
          message =
            "reCAPTCHA verification failed. Please try again.";
          break;

        case "auth/app-not-authorized":
          message =
            "This website is not authorized in Firebase.";
          break;

        case "auth/network-request-failed":
          message =
            "Network error. Check your internet connection.";
          break;

        default:
          message =
            error?.message ||
            "Unable to resend OTP.";
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

      if (
        !form.firstName.trim()
      ) {
        newErrors.firstName =
          "First name is required";
      }

      if (
        !form.lastName.trim()
      ) {
        newErrors.lastName =
          "Last name is required";
      }

      /*
       * Email optional.
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
            "Invalid server response."
          );
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to complete profile."
          );
        }

        /*
         * Final Odikart JWT.
         */
        if (data.token) {
          localStorage.setItem(
            "token",
            data.token
          );
        }

        /*
         * Final user.
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
        console.error(
          "❌ COMPLETE PROFILE ERROR:",
          error
        );

        toast.error(
          error?.message ||
            "Unable to complete profile."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =====================================================
     BACK TO PHONE
  ===================================================== */

  const backToPhone = () => {
    if (loading) {
      return;
    }

    setStep("phone");

    setOtp(
      Array(6).fill("")
    );

    setErrors({});

    setConfirmationResult(null);

    setTimer(0);

    /*
     * Keep verifier alive.
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
  ===================================================== */

  return (
    <div className="odikart-auth" onClick={handlePageClick}>
    <div className="anime-shine-layer" aria-hidden="true">
      <span className="anime-orb orb-a" />
      <span className="anime-orb orb-b" />
      <span className="anime-orb orb-c" />
      <span className="anime-star star-a">✦</span>
      <span className="anime-star star-b">✧</span>
      <span className="anime-star star-c">✦</span>
      <span className="anime-star star-d">✧</span>
      <span className="anime-star star-e">✦</span>
      <span className="anime-star star-f">✧</span>
      <span className="anime-ray ray-a" />
      <span className="anime-ray ray-b" />
    </div>


      {/* =================================================
          SKIP BUTTON
      ================================================= */}

      <button
        type="button"
        className="skip-login-btn"
        onClick={handleSkip}
        aria-label="Skip login and continue shopping"
      >
        Skip
        <FaArrowRight size={11} />
      </button>

      {/* =================================================
          STYLES
      ================================================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

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

          overflow-x: hidden;
          overflow-y: auto;

          background:
            radial-gradient(
              circle at 12% 15%,
              rgba(124,58,237,.16),
              transparent 28%
            ),
            radial-gradient(
              circle at 90% 85%,
              rgba(79,70,229,.14),
              transparent 32%
            ),
            #f7f7fb;

          color: var(--ink);

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* =================================================
           SKIP
        ================================================= */

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

          box-shadow:
            0 10px 28px rgba(23,20,79,.20);

          backdrop-filter: blur(14px);

          font-size: 12px;
          font-weight: 800;

          cursor: pointer;

          transition: .2s ease;
        }

        .skip-login-btn:hover {
          transform: translateY(-1px);

          background:
            rgba(23,20,79,.88);

          box-shadow:
            0 14px 32px rgba(23,20,79,.28);
        }

        /* =================================================
           MAIN SHELL
        ================================================= */

        .odikart-auth-shell {
          position: relative;

          width: min(1180px, 100%);
          min-height: 760px;

          display: grid;

          grid-template-columns:
            1.05fr .95fr;

          overflow: hidden;

          border-radius: 34px;

          background: #fff;

          border:
            1px solid rgba(31,27,91,.08);

          box-shadow:
            0 35px 100px
              rgba(31,25,90,.18),
            0 10px 30px
              rgba(31,25,90,.08);
        }

        /* =================================================
           BANNER
        ================================================= */

        .odikart-banner {
          position: relative;

          min-height: 760px;

          overflow: hidden;

          color: #fff;

          background:
            radial-gradient(
              circle at 78% 20%,
              rgba(196,181,253,.25),
              transparent 24%
            ),
            radial-gradient(
              circle at 18% 88%,
              rgba(99,102,241,.28),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #17144f 0%,
              #28216e 40%,
              #4c1d95 72%,
              #7c3aed 100%
            );
        }

        .odikart-banner::before {
          content: "";

          position: absolute;

          width: 520px;
          height: 520px;

          right: -270px;
          top: 70px;

          border-radius: 50%;

          border:
            1px solid rgba(255,255,255,.12);

          box-shadow:
            0 0 0 42px
              rgba(255,255,255,.025),
            0 0 0 88px
              rgba(255,255,255,.018);
        }

        .odikart-banner::after {
          content: "";

          position: absolute;

          width: 380px;
          height: 380px;

          left: -230px;
          bottom: -190px;

          border-radius: 50%;

          background:
            rgba(167,139,250,.18);

          filter: blur(12px);
        }

        .banner-grid {
          position: absolute;
          inset: -40px;

          display: grid;

          grid-template-columns:
            repeat(4, 1fr);

          gap: 10px;

          transform:
            rotate(-7deg)
            scale(1.1);

          opacity: .18;
        }

        .banner-grid-item {
          min-height: 120px;

          border:
            1px solid
            rgba(255,255,255,.12);

          border-radius: 20px;

          background:
            rgba(255,255,255,.06);

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 42px;
        }

        .banner-grid-item:nth-child(2n) {
          transform:
            translateY(18px);
        }

        .banner-grid-item:nth-child(3n) {
          transform:
            translateY(-15px);
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

          background:
            rgba(255,255,255,.09);

          border:
            1px solid
            rgba(255,255,255,.15);

          backdrop-filter: blur(18px);

          box-shadow:
            inset 0 1px 0
              rgba(255,255,255,.10),
            0 15px 40px
              rgba(0,0,0,.14);

          background-color: #fff;
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

          background:
            rgba(255,255,255,.08);

          border:
            1px solid
            rgba(255,255,255,.14);

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

          box-shadow:
            0 0 15px
              rgba(196,181,253,.9);
        }

        .banner-title {
          margin: 20px 0 0;

          font-size:
            clamp(46px,4.6vw,67px);

          line-height: 1.02;

          letter-spacing: -.055em;

          font-weight: 900;
        }

        .banner-title span {
          background:
            linear-gradient(
              90deg,
              #fff,
              #ddd6fe,
              #c4b5fd
            );

          -webkit-background-clip: text;
          background-clip: text;

          -webkit-text-fill-color: transparent;
        }

        .banner-subtitle {
          max-width: 520px;

          margin: 22px 0 0;

          color:
            rgba(255,255,255,.72);

          font-size: 17px;

          line-height: 1.7;
        }

        .banner-trust {
          display: flex;
          align-items: center;

          gap: 22px;

          color:
            rgba(255,255,255,.64);

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

          background:
            rgba(255,255,255,.09);

          border:
            1px solid
            rgba(255,255,255,.10);
        }

        /* =================================================
           FLOATING PRODUCTS
        ================================================= */

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

          background:
            rgba(255,255,255,.09);

          border:
            1px solid
            rgba(255,255,255,.17);

          backdrop-filter: blur(20px);

          box-shadow:
            0 25px 55px
              rgba(12,7,50,.28),
            inset 0 1px 0
              rgba(255,255,255,.10);
        }

        .product-phone {
          width: 105px;
          height: 175px;

          right: 35px;
          top: 145px;

          transform:
            rotate(9deg);
        }

        .phone-device {
          width: 61px;
          height: 120px;

          padding: 4px;

          border-radius: 13px;

          background: #15142a;

          border:
            1px solid
            rgba(255,255,255,.28);
        }

        .phone-screen {
          height: 100%;

          border-radius: 10px;

          background:
            linear-gradient(
              160deg,
              #3730a3,
              #7c3aed
            );

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

          margin:
            20px auto 0;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 7px;

          background:
            rgba(255,255,255,.9);

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

          transform:
            rotate(-8deg);
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

          border:
            8px solid
            rgba(255,255,255,.92);

          border-bottom: 0;

          border-radius:
            50px 50px 0 0;
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

          transform:
            rotate(-7deg);
        }

        .watch-shape {
          display: flex;

          flex-direction: column;

          align-items: center;
        }

        .watch-band {
          width: 38px;
          height: 29px;

          border-radius:
            10px 10px 3px 3px;

          background: #222237;
        }

        .watch-band.bottom {
          border-radius:
            3px 3px 10px 10px;
        }

        .watch-face {
          width: 64px;
          height: 64px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 17px;

          background:
            linear-gradient(
              145deg,
              #312e81,
              #8b5cf6
            );

          border:
            4px solid #29283c;

          box-shadow:
            0 12px 25px
              rgba(0,0,0,.25);
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

          transform:
            rotate(5deg);
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

          transform:
            skewY(-18deg);

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

          background:
            rgba(124,58,237,.48);
        }

        .product-bag {
          width: 120px;
          height: 125px;

          right: 220px;
          bottom: 70px;

          transform:
            rotate(7deg);
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

          border:
            6px solid #fff;

          border-bottom: 0;

          border-radius:
            30px 30px 0 0;
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

          background:
            linear-gradient(
              145deg,
              #fff,
              #ddd6fe
            );
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

          transform:
            rotate(-8deg);
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

          border-radius:
            22px 12px 5px 7px;

          background: #f5f3ff;

          transform:
            skewX(-20deg);
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

          transform:
            rotate(35deg);
        }

        /* =================================================
           AUTH PANEL
        ================================================= */

        .auth-panel {
          position: relative;
          z-index: 10;

          display: flex;

          align-items: center;
          justify-content: center;

          padding: 48px;

          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(124,58,237,.07),
              transparent 30%
            ),
            #fff;
        }

        .auth-inner {
          width:
            min(390px, 100%);
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
          margin:
            10px 0 27px;

          color: #718096;

          font-size: 13px;

          line-height: 1.65;
        }

        .field-label {
          display: block;

          margin:
            0 0 8px;

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

          border:
            1px solid #dfe3ed;

          border-radius: 15px;

          background: #fff;

          transition: .18s ease;
        }

        .phone-field:focus-within {
          border-color: #7c3aed;

          box-shadow:
            0 0 0 4px
              rgba(124,58,237,.09);
        }

        .phone-prefix {
          height: 100%;

          display: flex;

          align-items: center;

          gap: 5px;

          padding: 0 13px;

          border-right:
            1px solid #eceef4;

          color: #29205e;

          font-size: 12px;

          font-weight: 850;

          white-space: nowrap;
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
          margin:
            7px 2px 0;

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

          background:
            linear-gradient(
              135deg,
              #4338ca,
              #7c3aed
            );

          box-shadow:
            0 14px 28px
              rgba(109,40,217,.23);

          font-size: 13px;

          font-weight: 850;

          cursor: pointer;

          transition: .2s ease;
        }

        .continue-btn:hover:not(:disabled) {
          transform:
            translateY(-2px);

          box-shadow:
            0 18px 34px
              rgba(109,40,217,.28);
        }

        .continue-btn:disabled {
          color: #858da0;

          background: #e9eaf0;

          box-shadow: none;

          cursor: not-allowed;
        }

        /* =================================================
           REFERRAL
        ================================================= */

        .referral-box {
          display: flex;

          align-items: center;

          gap: 10px;

          margin-top: 14px;

          padding: 12px 13px;

          border:
            1px solid #e5d8ff;

          border-radius: 14px;

          background:
            linear-gradient(
              135deg,
              rgba(124,58,237,.08),
              rgba(99,102,241,.04)
            );

          box-shadow:
            inset 0 1px 0
              rgba(255,255,255,.8);
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

          margin:
            20px 0 12px;

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

        /* =================================================
           OTP
        ================================================= */

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

        .otp-back:disabled {
          opacity: .5;
          cursor: not-allowed;
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
          margin:
            9px 0 0;

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

          grid-template-columns:
            repeat(6,1fr);

          gap: 8px;

          margin:
            28px 0 14px;
        }

        .otp-input {
          width: 100%;
          height: 56px;

          border:
            1px solid #dfe3ed;

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

          box-shadow:
            0 0 0 4px
              rgba(124,58,237,.09);
        }

        .otp-input:disabled {
          opacity: .6;
        }

        .otp-status {
          min-height: 20px;

          text-align: center;

          color: #8b94a5;

          font-size: 10px;

          font-weight: 650;
        }

        /* =================================================
           AUTO VERIFY BUTTON
           Visual only - OTP verification remains automatic.
        ================================================= */

        .verify-otp-btn {
          position: relative;
          isolation: isolate;
          overflow: hidden;

          width: 100%;
          height: 55px;
          margin-top: 17px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          border: 0;
          border-radius: 16px;

          color: #fff;
          background:
            linear-gradient(
              135deg,
              #312e81 0%,
              #6d28d9 45%,
              #8b5cf6 100%
            );

          box-shadow:
            0 12px 30px rgba(109,40,217,.25),
            inset 0 1px 0 rgba(255,255,255,.22);

          font-size: 13px;
          font-weight: 900;
          letter-spacing: .01em;

          cursor: default;
          user-select: none;

          transition: .25s ease;
        }

        /* Moving anime-style light sweep */
        .verify-otp-btn::before {
          content: "";

          position: absolute;
          z-index: -1;

          top: -60%;
          left: -45%;

          width: 32%;
          height: 220%;

          transform: rotate(22deg);

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.18),
              rgba(255,255,255,.95),
              rgba(255,255,255,.18),
              transparent
            );

          filter: blur(2px);
          opacity: .9;

          animation:
            verifyShine 2.15s ease-in-out infinite;
        }

        /* Soft moving glow */
        .verify-otp-btn::after {
          content: "";

          position: absolute;
          inset: -40%;
          z-index: -2;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(255,255,255,.16) 0%,
              transparent 58%
            );

          animation:
            verifyGlow 2.4s ease-in-out infinite;
        }

        .verify-otp-btn.is-ready {
          animation:
            verifyPulse 1.8s ease-in-out infinite;
        }

        .verify-otp-btn.is-verifying {
          background:
            linear-gradient(
              135deg,
              #4c1d95,
              #7c3aed,
              #a78bfa,
              #7c3aed
            );

          background-size: 250% 250%;

          animation:
            verifyGradient 2s ease infinite,
            verifyPulse .9s ease-in-out infinite;
        }

        .verify-otp-btn:disabled {
          opacity: 1;
        }

        .verify-spinner {
          width: 16px;
          height: 16px;
          flex: 0 0 16px;

          border: 2px solid rgba(255,255,255,.28);
          border-top-color: #fff;
          border-right-color: #fff;

          border-radius: 50%;

          animation: verifySpin .65s linear infinite;
        }

        .verify-spark {
          position: absolute;
          width: 4px;
          height: 4px;

          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 10px rgba(255,255,255,.95);

          pointer-events: none;
        }

        .verify-spark.one {
          top: 11px;
          left: 19%;
          animation: sparkFloat 1.6s ease-in-out infinite;
        }

        .verify-spark.two {
          right: 22%;
          bottom: 10px;
          width: 3px;
          height: 3px;
          animation: sparkFloat 1.9s .25s ease-in-out infinite;
        }

        .verify-spark.three {
          top: 18px;
          right: 12%;
          width: 3px;
          height: 3px;
          animation: sparkFloat 1.7s .45s ease-in-out infinite;
        }

        @keyframes verifyShine {
          0% {
            left: -45%;
            opacity: 0;
          }
          12% {
            opacity: 1;
          }
          52% {
            opacity: 1;
          }
          72% {
            left: 125%;
            opacity: 0;
          }
          100% {
            left: 125%;
            opacity: 0;
          }
        }

        @keyframes verifyGlow {
          0%, 100% {
            transform: translateX(-16%) scale(.82);
            opacity: .35;
          }
          50% {
            transform: translateX(16%) scale(1.08);
            opacity: .9;
          }
        }

        @keyframes verifyPulse {
          0%, 100% {
            box-shadow:
              0 12px 30px rgba(109,40,217,.22),
              inset 0 1px 0 rgba(255,255,255,.22);
          }
          50% {
            box-shadow:
              0 16px 42px rgba(124,58,237,.42),
              0 0 0 5px rgba(124,58,237,.06),
              inset 0 1px 0 rgba(255,255,255,.30);
          }
        }

        @keyframes verifyGradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes verifySpin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes sparkFloat {
          0%, 100% {
            transform: translateY(2px) scale(.65);
            opacity: .25;
          }
          50% {
            transform: translateY(-5px) scale(1.15);
            opacity: 1;
          }
        }

        .resend-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255,255,255,.45);
          border-top-color: #fff;
          border-radius: 50%;
          animation: resendSpin .7s linear infinite;
        }

        @keyframes resendSpin {
          to {
            transform: rotate(360deg);
          }
        }

        .resend-btn {
          padding: 0;

          border: 0;

          background: transparent;

          color: #6d28d9;

          font-weight: 850;

          cursor: pointer;
        }

        .resend-btn:hover:not(:disabled) {
          text-decoration: underline;
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

          border:
            1px solid #eadffb;

          border-radius: 13px;

          background: #faf7ff;

          color: #74658c;

          font-size: 9px;

          line-height: 1.6;
        }

        /* =================================================
           PROFILE
        ================================================= */

        .verified-box {
          display: flex;

          align-items: center;

          gap: 7px;

          margin:
            19px 0 18px;

          padding:
            11px 12px;

          border:
            1px solid #dfd5f8;

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

          margin:
            0 0 7px;

          color: #354055;

          font-size: 10px;

          font-weight: 800;
        }

        .details-input {
          width: 100%;
          height: 49px;

          padding: 0 12px;

          border:
            1px solid #dfe3ed;

          border-radius: 12px;

          outline: 0;

          color: #15182b;

          background: #fff;

          font-size: 12px;

          transition: .18s ease;
        }

        .details-input:focus {
          border-color: #7c3aed;

          box-shadow:
            0 0 0 4px
              rgba(124,58,237,.08);
        }

        .details-input.error {
          border-color: #ef4444;
        }

        /* =================================================
           RECAPTCHA
        ================================================= */

        /*
         * Firebase invisible reCAPTCHA
         *
         * The reCAPTCHA container is rendered after the active
         * authentication section. During OTP verification that
         * means it sits directly below the Resend OTP area.
         *
         * Keep Google's attribution visible, but place it in
         * normal document flow with exactly 9px top spacing.
         */

        .recaptcha-wrap {
          position: relative !important;

          width: 100% !important;
          height: 30px !important;
          min-height: 30px !important;

          margin-top: 9px !important;

          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;

          overflow: visible !important;
          z-index: 999999 !important;
        }

        /*
         * Firebase/Google inserts the badge inside our container.
         * Keep it directly below Resend OTP instead of fixed to
         * the viewport.
         */
        .recaptcha-wrap .grecaptcha-badge {
          position: absolute !important;

          top: 0 !important;
          bottom: auto !important;

          left: 50% !important;
          right: auto !important;

          width: 256px !important;
          height: 60px !important;

          transform:
            translateX(-50%)
            scale(0.46) !important;

          transform-origin: top center !important;

          z-index: 999999 !important;
        }

        @media (max-width: 600px) {
          .recaptcha-wrap {
            height: 29px !important;
            min-height: 29px !important;

            margin-top: 9px !important;
          }

          .recaptcha-wrap .grecaptcha-badge {
            transform:
              translateX(-50%)
              scale(0.46) !important;

            transform-origin: top center !important;
          }
        }


        /* =================================================
           ✨ ANIME SHINING EXPERIENCE
           Decorative only — authentication logic unchanged.
        ================================================= */

        .odikart-auth {
          position: relative;
          isolation: isolate;

          --anime-violet: #8b5cf6;
          --anime-purple: #c084fc;
          --anime-pink: #f0abfc;
          --anime-cyan: #67e8f9;
          --anime-gold: #fde68a;

          background:
            radial-gradient(
              circle at 8% 18%,
              rgba(192,132,252,.30),
              transparent 23%
            ),
            radial-gradient(
              circle at 92% 78%,
              rgba(103,232,249,.20),
              transparent 24%
            ),
            radial-gradient(
              circle at 52% 105%,
              rgba(240,171,252,.18),
              transparent 34%
            ),
            #f5f3ff;
        }

        .anime-shine-layer {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .anime-orb {
          position: absolute;
          display: block;
          border-radius: 50%;
          filter: blur(1px);
          opacity: .62;
          mix-blend-mode: screen;
          animation: animeOrbFloat 8s ease-in-out infinite;
        }

        .orb-a {
          width: 240px;
          height: 240px;
          left: -70px;
          top: 12%;
          background: radial-gradient(circle, rgba(192,132,252,.52), transparent 68%);
        }

        .orb-b {
          width: 330px;
          height: 330px;
          right: -100px;
          top: 5%;
          background: radial-gradient(circle, rgba(103,232,249,.32), transparent 68%);
          animation-delay: -2.5s;
        }

        .orb-c {
          width: 280px;
          height: 280px;
          right: 15%;
          bottom: -130px;
          background: radial-gradient(circle, rgba(240,171,252,.34), transparent 68%);
          animation-delay: -5s;
        }

        .anime-star {
          position: absolute;
          color: #fff;
          font-size: 18px;
          line-height: 1;
          text-shadow:
            0 0 5px rgba(255,255,255,.95),
            0 0 14px rgba(192,132,252,.95),
            0 0 28px rgba(103,232,249,.55);
          animation: animeStar 2.8s ease-in-out infinite;
        }

        .star-a { left: 7%; top: 20%; animation-delay: -.2s; }
        .star-b { left: 17%; top: 74%; animation-delay: -1.3s; font-size: 13px; }
        .star-c { left: 48%; top: 7%; animation-delay: -2s; font-size: 12px; }
        .star-d { right: 10%; top: 30%; animation-delay: -.8s; font-size: 14px; }
        .star-e { right: 16%; bottom: 16%; animation-delay: -1.8s; }
        .star-f { right: 48%; bottom: 6%; animation-delay: -2.4s; font-size: 12px; }

        .anime-ray {
          position: absolute;
          width: 46vw;
          height: 2px;
          opacity: .22;
          background: linear-gradient(90deg, transparent, #fff, transparent);
          filter: blur(1px);
          transform: rotate(-28deg);
          animation: animeRay 7s ease-in-out infinite;
        }

        .ray-a { left: -18%; top: 24%; }
        .ray-b {
          right: -18%;
          bottom: 23%;
          transform: rotate(152deg);
          animation-delay: -3.5s;
        }

        .odikart-auth-shell {
          z-index: 2;
          border-color: rgba(255,255,255,.55);
          box-shadow:
            0 40px 110px rgba(55,31,115,.24),
            0 0 0 1px rgba(192,132,252,.10),
            0 0 55px rgba(139,92,246,.10);
          animation: shellFloat 6s ease-in-out infinite;
        }

        .odikart-auth-shell::before {
          content: "";
          position: absolute;
          z-index: 50;
          inset: -2px;
          pointer-events: none;
          border-radius: 36px;
          padding: 1px;
          background:
            linear-gradient(
              115deg,
              rgba(255,255,255,.95),
              rgba(192,132,252,.35),
              rgba(103,232,249,.30),
              rgba(255,255,255,.75),
              rgba(240,171,252,.35)
            );
          background-size: 300% 300%;
          animation: animeBorder 6s linear infinite;
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .odikart-banner {
          background:
            radial-gradient(circle at 72% 18%, rgba(240,171,252,.30), transparent 25%),
            radial-gradient(circle at 20% 80%, rgba(103,232,249,.24), transparent 27%),
            radial-gradient(circle at 85% 85%, rgba(253,230,138,.13), transparent 18%),
            linear-gradient(
              135deg,
              #100c3b 0%,
              #21145f 34%,
              #4c1d95 68%,
              #7c3aed 100%
            );
          background-size: 100% 100%, 100% 100%, 100% 100%, 180% 180%;
          animation: bannerGradient 9s ease-in-out infinite alternate;
        }

        .odikart-banner::before {
          animation: animeRing 8s ease-in-out infinite;
          border-color: rgba(255,255,255,.18);
          box-shadow:
            0 0 0 42px rgba(255,255,255,.035),
            0 0 0 88px rgba(192,132,252,.045),
            0 0 90px rgba(192,132,252,.18);
        }

        .odikart-banner::after {
          animation: animeBlob 7s ease-in-out infinite;
          background:
            radial-gradient(
              circle,
              rgba(103,232,249,.24),
              rgba(167,139,250,.15) 42%,
              transparent 70%
            );
        }

        .banner-grid {
          opacity: .23;
          animation: gridDrift 18s linear infinite;
        }

        .banner-grid-item {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.10),
            0 0 24px rgba(192,132,252,.05);
          animation: gridPulse 4s ease-in-out infinite;
        }

        .banner-grid-item:nth-child(2n) { animation-delay: -1s; }
        .banner-grid-item:nth-child(3n) { animation-delay: -2s; }

        .banner-logo {
          position: relative;
          overflow: hidden;
          border-color: rgba(255,255,255,.34);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.8),
            0 0 0 1px rgba(192,132,252,.12),
            0 15px 40px rgba(0,0,0,.18),
            0 0 28px rgba(255,255,255,.12);
          animation: logoFloat 4.5s ease-in-out infinite;
        }

        .banner-logo::after {
          content: "";
          position: absolute;
          top: -70%;
          left: -45%;
          width: 28%;
          height: 240%;
          transform: rotate(24deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.15),
            rgba(255,255,255,.95),
            rgba(255,255,255,.18),
            transparent
          );
          filter: blur(2px);
          animation: logoShine 3.2s ease-in-out infinite;
          pointer-events: none;
        }

        .premium-badge {
          box-shadow:
            0 0 18px rgba(192,132,252,.10),
            inset 0 1px 0 rgba(255,255,255,.14);
          animation: badgeGlow 2.5s ease-in-out infinite;
        }

        .premium-dot {
          animation: dotPulse 1.4s ease-in-out infinite;
        }

        .banner-title {
          text-shadow:
            0 0 28px rgba(192,132,252,.20);
          animation: titleGlow 4s ease-in-out infinite;
        }

        .banner-title span {
          // background:
          //   linear-gradient(
          //     100deg,
          //     #fff 0%,
          //     #ddd6fe 28%,
          //     #fff 45%,
          //     #a5f3fc 62%,
          //     #f0abfc 82%,
          //     #fff 100%
          //   );
          background-size: 250% auto;
          animation: textShine 4.5s linear infinite;
        }

        .banner-trust-icon {
          box-shadow:
            0 0 20px rgba(192,132,252,.12),
            inset 0 1px 0 rgba(255,255,255,.16);
          animation: iconGlow 3s ease-in-out infinite;
        }

        .product {
          overflow: hidden;
          box-shadow:
            0 25px 55px rgba(12,7,50,.30),
            0 0 30px rgba(192,132,252,.09),
            inset 0 1px 0 rgba(255,255,255,.18);
          animation: productFloat 5s ease-in-out infinite;
        }

        .product::after {
          content: "";
          position: absolute;
          top: -80%;
          left: -50%;
          width: 34%;
          height: 260%;
          transform: rotate(24deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.08),
            rgba(255,255,255,.82),
            rgba(255,255,255,.08),
            transparent
          );
          filter: blur(2px);
          animation: productShine 4.2s ease-in-out infinite;
          pointer-events: none;
        }

        .product-phone { animation-delay: -.4s; }
        .product-headphones { animation-delay: -1.5s; }
        .product-watch { animation-delay: -2.2s; }
        .product-parcel { animation-delay: -3s; }
        .product-bag { animation-delay: -3.7s; }
        .product-shoe { animation-delay: -4.3s; }

        .auth-panel {
          background:
            radial-gradient(circle at 100% 0%, rgba(192,132,252,.14), transparent 32%),
            radial-gradient(circle at 0% 100%, rgba(103,232,249,.08), transparent 26%),
            rgba(255,255,255,.94);
          backdrop-filter: blur(18px);
        }

        .auth-inner {
          animation: authReveal .7s cubic-bezier(.2,.8,.2,1) both;
        }

        .auth-kicker {
          text-shadow: 0 0 15px rgba(139,92,246,.20);
          animation: kickerGlow 2.8s ease-in-out infinite;
        }

        .auth-title {
          text-shadow: 0 0 25px rgba(139,92,246,.12);
        }

        .phone-field {
          position: relative;
          overflow: hidden;
          border-color: rgba(124,58,237,.18);
          box-shadow:
            0 8px 22px rgba(79,70,229,.06),
            inset 0 1px 0 rgba(255,255,255,.9);
        }

        .phone-field::after,
        .details-input::after {
          content: "";
        }

        .phone-field:focus-within {
          border-color: #8b5cf6;
          box-shadow:
            0 0 0 4px rgba(139,92,246,.10),
            0 0 25px rgba(139,92,246,.14);
          animation: fieldGlow 1.8s ease-in-out infinite;
        }

        .phone-prefix {
          background: linear-gradient(
            180deg,
            rgba(139,92,246,.07),
            rgba(103,232,249,.04)
          );
        }

        .continue-btn {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background:
            linear-gradient(
              115deg,
              #312e81,
              #6d28d9,
              #a855f7,
              #7c3aed,
              #312e81
            );
          background-size: 300% 100%;
          box-shadow:
            0 14px 30px rgba(109,40,217,.25),
            0 0 28px rgba(139,92,246,.10),
            inset 0 1px 0 rgba(255,255,255,.24);
          animation: buttonGradient 5s linear infinite;
        }

        .continue-btn::before {
          content: "";
          position: absolute;
          z-index: -1;
          top: -80%;
          left: -30%;
          width: 22%;
          height: 260%;
          transform: rotate(24deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.12),
            rgba(255,255,255,.90),
            rgba(255,255,255,.12),
            transparent
          );
          filter: blur(2px);
          animation: buttonShine 2.8s ease-in-out infinite;
        }

        .continue-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.01);
          box-shadow:
            0 18px 38px rgba(109,40,217,.32),
            0 0 34px rgba(192,132,252,.22),
            inset 0 1px 0 rgba(255,255,255,.28);
        }

        .referral-box {
          position: relative;
          overflow: hidden;
          border-color: rgba(192,132,252,.32);
          box-shadow:
            0 8px 24px rgba(139,92,246,.07),
            inset 0 1px 0 rgba(255,255,255,.85);
        }

        .referral-box::before {
          content: "";
          position: absolute;
          top: -100%;
          left: -20%;
          width: 12%;
          height: 300%;
          transform: rotate(25deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.8),
            transparent
          );
          animation: referralShine 4.5s ease-in-out infinite;
        }

        .referral-icon,
        .trust-icon {
          box-shadow: 0 0 18px rgba(139,92,246,.10);
          animation: iconGlow 3s ease-in-out infinite;
        }

        .otp-back {
          text-shadow: 0 0 14px rgba(139,92,246,.14);
        }

        .otp-input {
          position: relative;
          border-color: rgba(124,58,237,.16);
          background:
            linear-gradient(145deg, rgba(255,255,255,.98), rgba(248,246,255,.92));
          box-shadow:
            0 7px 18px rgba(79,70,229,.055),
            inset 0 1px 0 rgba(255,255,255,.9);
        }

        .otp-input:focus {
          border-color: #a855f7;
          box-shadow:
            0 0 0 4px rgba(168,85,247,.10),
            0 0 28px rgba(168,85,247,.18);
          transform: translateY(-2px) scale(1.025);
        }

        .otp-input:not(:placeholder-shown) {
          box-shadow:
            0 0 18px rgba(139,92,246,.09),
            inset 0 1px 0 rgba(255,255,255,.9);
        }

        .otp-status strong {
          color: #7c3aed;
          text-shadow: 0 0 12px rgba(139,92,246,.14);
        }

        .verify-otp-btn {
          border: 1px solid rgba(255,255,255,.16);
          box-shadow:
            0 14px 34px rgba(109,40,217,.25),
            0 0 32px rgba(139,92,246,.14),
            inset 0 1px 0 rgba(255,255,255,.25);
        }

        .verify-otp-btn.is-verifying {
          box-shadow:
            0 14px 38px rgba(124,58,237,.34),
            0 0 45px rgba(192,132,252,.25),
            inset 0 1px 0 rgba(255,255,255,.30);
        }

        .details-field {
          animation: detailFieldIn .55s cubic-bezier(.2,.8,.2,1) both;
        }

        .details-field:nth-child(2) { animation-delay: .08s; }
        .details-field:nth-child(3) { animation-delay: .16s; }

        .details-input {
          border-color: rgba(124,58,237,.15);
          background:
            linear-gradient(145deg, #fff, #faf8ff);
          box-shadow:
            0 7px 18px rgba(79,70,229,.045),
            inset 0 1px 0 rgba(255,255,255,.9);
        }

        .details-input:focus {
          border-color: #8b5cf6;
          box-shadow:
            0 0 0 4px rgba(139,92,246,.09),
            0 0 25px rgba(139,92,246,.13);
          transform: translateY(-1px);
        }

        .verified-box {
          position: relative;
          overflow: hidden;
          border-color: rgba(74,222,128,.28) !important;
          box-shadow:
            0 0 25px rgba(74,222,128,.09),
            inset 0 1px 0 rgba(255,255,255,.9) !important;
          animation: verifiedGlow 2.5s ease-in-out infinite;
        }

        .verified-box::after {
          content: "✦";
          position: absolute;
          right: 12px;
          top: 7px;
          color: rgba(74,222,128,.55);
          font-size: 12px;
          animation: animeStar 1.8s ease-in-out infinite;
        }

        .skip-login-btn {
          overflow: hidden;
          border-color: rgba(255,255,255,.30);
          box-shadow:
            0 10px 30px rgba(23,20,79,.20),
            0 0 22px rgba(139,92,246,.10);
        }

        .skip-login-btn::before {
          content: "";
          position: absolute;
          top: -80%;
          left: -40%;
          width: 25%;
          height: 260%;
          transform: rotate(24deg);
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.75),
            transparent
          );
          animation: skipShine 4.2s ease-in-out infinite;
        }

        @keyframes animeOrbFloat {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(30px,-24px,0) scale(1.10); }
        }

        @keyframes animeStar {
          0%, 100% {
            opacity: .22;
            transform: scale(.72) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.28) rotate(18deg);
          }
        }

        @keyframes animeRay {
          0%, 100% { opacity: 0; transform: translateX(-80px) rotate(-28deg); }
          35%, 65% { opacity: .25; }
          50% { transform: translateX(120px) rotate(-28deg); }
        }

        @keyframes shellFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        @keyframes animeBorder {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes bannerGradient {
          0% { background-position: 0 0, 0 0, 0 0, 0% 50%; }
          100% { background-position: 0 0, 0 0, 0 0, 100% 50%; }
        }

        @keyframes animeRing {
          0%, 100% { transform: translate(0,0) scale(1); opacity: .75; }
          50% { transform: translate(-18px,14px) scale(1.06); opacity: 1; }
        }

        @keyframes animeBlob {
          0%, 100% { transform: translate(0,0) scale(1); }
          50% { transform: translate(40px,-30px) scale(1.16); }
        }

        @keyframes gridDrift {
          from { transform: rotate(-7deg) scale(1.1) translate3d(0,0,0); }
          to { transform: rotate(-7deg) scale(1.1) translate3d(30px,-22px,0); }
        }

        @keyframes gridPulse {
          0%, 100% { opacity: .55; }
          50% { opacity: 1; }
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(-.5deg); }
        }

        @keyframes logoShine {
          0%, 58% { left: -45%; opacity: 0; }
          70% { opacity: 1; }
          88%, 100% { left: 145%; opacity: 0; }
        }

        @keyframes badgeGlow {
          0%, 100% { box-shadow: 0 0 18px rgba(192,132,252,.08), inset 0 1px 0 rgba(255,255,255,.14); }
          50% { box-shadow: 0 0 28px rgba(192,132,252,.22), inset 0 1px 0 rgba(255,255,255,.20); }
        }

        @keyframes dotPulse {
          0%, 100% { transform: scale(.85); opacity: .65; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        @keyframes titleGlow {
          0%, 100% { filter: drop-shadow(0 0 0 rgba(192,132,252,0)); }
          50% { filter: drop-shadow(0 0 15px rgba(192,132,252,.18)); }
        }

        @keyframes textShine {
          from { background-position: 0% 50%; }
          to { background-position: 250% 50%; }
        }

        @keyframes iconGlow {
          0%, 100% { transform: translateY(0); filter: drop-shadow(0 0 0 rgba(192,132,252,0)); }
          50% { transform: translateY(-2px); filter: drop-shadow(0 0 8px rgba(192,132,252,.35)); }
        }

        @keyframes productFloat {
          0%, 100% { translate: 0 0; }
          50% { translate: 0 -12px; }
        }

        @keyframes productShine {
          0%, 62% { left: -50%; opacity: 0; }
          72% { opacity: 1; }
          90%, 100% { left: 145%; opacity: 0; }
        }

        @keyframes buttonGradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }

        @keyframes buttonShine {
          0%, 50% { left: -30%; opacity: 0; }
          62% { opacity: 1; }
          82%, 100% { left: 145%; opacity: 0; }
        }

        @keyframes referralShine {
          0%, 60% { left: -20%; opacity: 0; }
          72% { opacity: 1; }
          92%, 100% { left: 130%; opacity: 0; }
        }

        @keyframes fieldGlow {
          0%, 100% { box-shadow: 0 0 0 4px rgba(139,92,246,.10), 0 0 16px rgba(139,92,246,.08); }
          50% { box-shadow: 0 0 0 4px rgba(139,92,246,.12), 0 0 30px rgba(139,92,246,.16); }
        }

        @keyframes authReveal {
          from { opacity: 0; transform: translateY(16px) scale(.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes detailFieldIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes verifiedGlow {
          0%, 100% { box-shadow: 0 0 18px rgba(74,222,128,.06), inset 0 1px 0 rgba(255,255,255,.9); }
          50% { box-shadow: 0 0 32px rgba(74,222,128,.16), inset 0 1px 0 rgba(255,255,255,.95); }
        }

        @keyframes skipShine {
          0%, 55% { left: -40%; opacity: 0; }
          67% { opacity: 1; }
          86%, 100% { left: 145%; opacity: 0; }
        }

        @media (prefers-reduced-motion: reduce) {
          .anime-shine-layer *,
          .odikart-auth-shell,
          .odikart-banner,
          .banner-grid,
          .banner-grid-item,
          .banner-logo,
          .premium-badge,
          .premium-dot,
          .banner-title,
          .banner-title span,
          .banner-trust-icon,
          .product,
          .auth-inner,
          .auth-kicker,
          .continue-btn,
          .referral-box,
          .referral-icon,
          .trust-icon,
          .otp-input,
          .verify-otp-btn,
          .details-field,
          .verified-box,
          .skip-login-btn {
            animation: none !important;
            transition: none !important;
          }
        }

        /* =================================================
           TABLET
        ================================================= */

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

        /* =================================================
           MOBILE
        ================================================= */

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

            padding:
              24px 22px;
          }

          .banner-logo {
            min-height: 18px;

            padding:
              8px 13px;

            // background: gray;

            border-radius: 15px;
          }

          /*
           * IMPORTANT:
           * This closing brace was missing in your
           * original mobile CSS.
           */

          .banner-logo img {
            max-width: 150px;

            max-height: 35px;
          }

          .banner-main {
            margin-top: 16px;
          }

          .premium-badge {
            padding:
              7px 10px;

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

            padding:
              28px 20px 35px;
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

        /* =================================================
           SMALL MOBILE
        ================================================= */

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

      {/* =================================================
          AUTH SHELL
      ================================================= */}

      <div className="odikart-auth-shell">

        {/* =================================================
            LEFT BANNER
        ================================================= */}

        <section className="odikart-banner">

          <div
            className="banner-grid"
            aria-hidden="true"
          >
            <div className="banner-grid-item">
              📱
            </div>

            <div className="banner-grid-item">
              🎧
            </div>

            <div className="banner-grid-item">
              ⌚
            </div>

            <div className="banner-grid-item">
              💻
            </div>

            <div className="banner-grid-item">
              👟
            </div>

            <div className="banner-grid-item">
              👜
            </div>

            <div className="banner-grid-item">
              📷
            </div>

            <div className="banner-grid-item">
              🎮
            </div>
          </div>

          <div className="banner-content">

            <div>

              <div className="banner-logo">
                <img
                  src="/logo.png"
                  alt="Odikart"
                />
              </div>

              <div className="banner-main">

                <div className="premium-badge">
                  <span className="premium-dot" />

                  Premium shopping experience
                </div>

                <h2 className="banner-title">
                  Everything You Need.
                  <br />

                  <span>
                    One Smart Cart.
                  </span>
                </h2>

                <p className="banner-subtitle">
                  Shop electronics, fashion,
                  lifestyle & more at great
                  prices. Discover a smarter
                  way to shop with Odikart.
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

          {/* =================================================
              FLOATING PRODUCTS
          ================================================= */}

          <div
            className="products"
            aria-hidden="true"
          >

            {/* HEADPHONES */}

            <div className="product product-headphones">

              <div className="headphone-shape">

                <div className="headphone-arc" />

                <div className="ear left" />

                <div className="ear right" />

              </div>

            </div>

            {/* PHONE */}

            <div className="product product-phone">

              <div className="phone-device">

                <div className="phone-screen">

                  <div className="phone-notch" />

                  <div className="phone-logo">

                    <img
                      src="/logo.png"
                      alt=""
                    />

                  </div>

                </div>

              </div>

            </div>

            {/* WATCH */}

            <div className="product product-watch">

              <div className="watch-shape">

                <div className="watch-band" />

                <div className="watch-face">

                  <span className="watch-time">
                    10:09
                  </span>

                </div>

                <div className="watch-band bottom" />

              </div>

            </div>

            {/* PARCEL */}

            <div className="product product-parcel">

              <div className="parcel">

                <div className="parcel-top" />

                <div className="parcel-front">

                  <img
                    src="/logo.png"
                    alt=""
                  />

                </div>

                <div className="parcel-tape" />

              </div>

            </div>

            {/* BAG */}

            <div className="product product-bag">

              <div className="bag">

                <div className="bag-handle" />

                <div className="bag-body">
                  <span>O</span>
                </div>

              </div>

            </div>

            {/* SHOE */}

            <div className="product product-shoe">

              <div className="shoe-shape">

                <div className="shoe-upper" />

                <div className="shoe-sole" />

                <div className="shoe-line" />

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RIGHT AUTH PANEL
        ================================================= */}

        <section className="auth-panel">

          <div className="auth-inner">

            <div className="mobile-brand">

              <img
                src="/logo.png"
                alt="Odikart"
              />

            </div>

            {/* =================================================
                PHONE STEP
            ================================================= */}

            {step === "phone" && (
              <>

                <p className="auth-kicker">
                  Welcome to Odikart
                </p>

                <h1 className="auth-title">
                  Shop smarter.
                </h1>

                <p className="auth-subtitle">
                  Log in or sign up with
                  your mobile number to
                  continue shopping.
                </p>

                <form onSubmit={sendOTP}>

                  <label className="field-label">
                    Mobile Number
                  </label>

                  <div className="phone-field">

                    <div className="phone-prefix">
                      +91
                    </div>

                    <input
                      type="tel"
                      value={phone.replace(
                        /^\+91\s?/,
                        ""
                      )}
                      onChange={(e) => {
                        const digits =
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              10
                            );

                        setPhone(
                          `+91 ${digits}`
                        );

                        setErrors({});
                      }}
                      placeholder="Enter phone number"
                      className="phone-number-input"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      aria-label="Phone Number"
                    />

                    {phone.replace(
                      /\D/g,
                      ""
                    ).length > 2 && (
                      <button
                        type="button"
                        className="phone-clear"
                        aria-label="Clear phone number"
                        onClick={() => {
                          setPhone(
                            "+91 "
                          );

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
                        phone
                          .replace(
                            /\s/g,
                            ""
                          )
                          .trim()
                      )
                    }
                    className="continue-btn"
                  >
                    {loading
                      ? "Sending OTP..."
                      : "Continue"}

                    {!loading && (
                      <FaArrowRight
                        size={11}
                      />
                    )}
                  </button>

                  {referralCode && (
                    <div className="referral-box">

                      <span className="referral-icon">
                        <FaGift size={10} />
                      </span>

                      <div className="referral-copy">

                        <strong>
                          Referral applied
                        </strong>

                        <span>
                          Code{" "}
                          <b>
                            {referralCode}
                          </b>{" "}
                          will be linked
                          to your new
                          Odikart account.
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

                  <div className="divider">
                    SAFE & SECURE
                  </div>

                  <p className="terms">
                    By continuing, you agree
                    to receive a verification
                    code on your mobile number.
                  </p>

                </form>

              </>
            )}

            {/* =================================================
                OTP STEP
            ================================================= */}

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

                <p className="auth-kicker">
                  Secure verification
                </p>

                <h1 className="otp-title">
                  Enter your OTP
                </h1>

                <p className="otp-desc">
                  We've sent a verification
                  code to{" "}
                  <span className="otp-number">
                    {phone}
                  </span>
                </p>

                <div className="otp-inputs">

                  {otp.map(
                    (
                      digit,
                      index
                    ) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpRefs.current[
                            index
                          ] = el;
                        }}
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={loading}
                        onChange={(e) =>
                          handleOtpChange(
                            e.target.value,
                            index
                          )
                        }
                        onKeyDown={(e) =>
                          handleOtpKeyDown(
                            e,
                            index
                          )
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
                        aria-label={
                          `OTP digit ${
                            index + 1
                          }`
                        }
                      />
                    )
                  )}

                </div>

                {/* =================================================
                    AUTO VERIFY STATUS BUTTON
                    This is intentionally NOT clickable.
                    Verification starts automatically after the
                    6th digit is entered.
                ================================================= */}

                <div
                  className={
                    `verify-otp-btn ${
                      loading
                        ? "is-verifying"
                        : otp.join("").length === 6
                          ? "is-ready"
                          : ""
                    }`
                  }
                  role="status"
                  aria-live="polite"
                  aria-label={
                    loading
                      ? "Verifying OTP"
                      : "OTP verification happens automatically"
                  }
                >
                  <span className="verify-spark one" />
                  <span className="verify-spark two" />
                  <span className="verify-spark three" />

                  {loading ? (
                    <>
                      <span className="verify-spinner" />
                      Verifying OTP...
                    </>
                  ) : otp.join("").length === 6 ? (
                    <>
                      <FaCheckCircle size={15} />
                      Verifying automatically...
                    </>
                  ) : (
                    <>
                      <FaShieldAlt size={14} />
                      Enter 6-digit OTP
                    </>
                  )}
                </div>

                {/* =================================================
                    TIMER + RESEND
                ================================================= */}

                <div className="otp-status">

                  {timer > 0 ? (
                    <>
                      Didn't receive the code?{" "}
                      <strong>
                        Resend in{" "}
                        {timer}s
                      </strong>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="resend-btn"
                      onClick={resendOTP}
                      disabled={loading || timer > 0}
                    >
                      {loading ? (
                        <>
                          <span className="resend-spinner" />
                          Sending OTP...
                        </>
                      ) : (
                        "Resend OTP"
                      )}
                    </button>
                  )}

                </div>

                

              </div>
            )}

            {/* =================================================
                PROFILE STEP
            ================================================= */}

            {step === "details" && (
              <form
                onSubmit={
                  completeProfile
                }
              >

                <p className="auth-kicker">
                  Almost there
                </p>

                <h1 className="details-title">
                  Complete your profile
                </h1>

                <p className="details-desc">
                  Your mobile number is
                  verified. Add your details
                  to finish setting up Odikart.
                </p>

                <div className="verified-box">

                  <FaCheckCircle
                    size={11}
                  />

                  {phone} · Verified

                </div>

                {referralCode && (
                  <div className="referral-box profile-referral">

                    <span className="referral-icon">
                      <FaGift size={10} />
                    </span>

                    <div className="referral-copy">

                      <strong>
                        Referral code applied
                      </strong>

                      <span>
                        <b>
                          {referralCode}
                        </b>{" "}
                        · Your referral will
                        be linked when this
                        new account is created.
                      </span>

                    </div>

                    <FaCheckCircle
                      className="referral-check"
                      size={14}
                    />

                  </div>
                )}

                {/* FIRST NAME */}

                <div className="details-field">

                  <label className="details-label">
                    First Name
                  </label>

                  <input
                    type="text"
                    name="firstName"
                    value={
                      form.firstName
                    }
                    onChange={
                      handleDetailsChange
                    }
                    placeholder="First name"
                    className={
                      `details-input ${
                        errors.firstName
                          ? "error"
                          : ""
                      }`
                    }
                    autoComplete="given-name"
                  />

                  {errors.firstName && (
                    <div className="form-error">
                      {errors.firstName}
                    </div>
                  )}

                </div>

                {/* LAST NAME */}

                <div className="details-field">

                  <label className="details-label">
                    Last Name
                  </label>

                  <input
                    type="text"
                    name="lastName"
                    value={
                      form.lastName
                    }
                    onChange={
                      handleDetailsChange
                    }
                    placeholder="Last name"
                    className={
                      `details-input ${
                        errors.lastName
                          ? "error"
                          : ""
                      }`
                    }
                    autoComplete="family-name"
                  />

                  {errors.lastName && (
                    <div className="form-error">
                      {errors.lastName}
                    </div>
                  )}

                </div>

                {/* EMAIL */}

                <div className="details-field">

                  <label className="details-label">

                    Email{" "}

                    <span
                      style={{
                        color:
                          "#9aa2b0",
                        fontWeight:
                          500,
                      }}
                    >
                      (optional)
                    </span>

                  </label>

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleDetailsChange
                    }
                    placeholder="you@example.com"
                    className={
                      `details-input ${
                        errors.email
                          ? "error"
                          : ""
                      }`
                    }
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

                  {!loading && (
                    <FaArrowRight
                      size={11}
                    />
                  )}

                </button>

              </form>
            )}

            {/* =================================================
                FIREBASE RECAPTCHA
            ================================================= */}

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