import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FaCamera,
  FaCheck,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaSave,
  FaShieldAlt,
  FaTimes,
  FaLock,
} from "react-icons/fa";

import { MdVerified } from "react-icons/md";
import { toast } from "sonner";

import {
  AccountShell,
  api,
  BACKEND_URL,
  authHeaders,
} from "./AccountShell";
import Spinner from "../../components/Spinner";

export default function PersonalInfoPage() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);

  /* =========================================================
     LOAD USER
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    api("/api/auth/me")
      .then((d) => {
        if (mounted && d.success) {
          setUser(d.user);
        }
      })
      .catch((e) => {
        console.error(
          "Load profile error:",
          e
        );

        if (mounted) {
          toast.error(
            e.message ||
              "Unable to load profile"
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     CLEAN PREVIEW URL
  ========================================================= */

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =========================================================
     LOGIN METHOD
  ========================================================= */

  /*
   * Firebase is used for phone OTP login
   * in the current Odikart authentication flow.
   *
   * Phone-login account:
   *   - Phone = LOCKED
   *   - Email = EDITABLE
   *
   * Email-login account:
   *   - Email = LOCKED
   *   - Phone = LOCKED
   */

  const isPhoneLogin =
    user?.provider === "firebase" &&
    Boolean(user?.phone);

  const phoneLocked = true;

  const emailLocked = !isPhoneLogin;

  /* =========================================================
     IMAGE CHANGE
  ========================================================= */

  const handleImageChange = (event) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    /* -------------------------------------------------------
       FILE TYPE
    ------------------------------------------------------- */

    if (
      !selectedFile.type.startsWith(
        "image/"
      )
    ) {
      toast.error(
        "Please select an image file"
      );
      return;
    }

    /* -------------------------------------------------------
       FILE SIZE
    ------------------------------------------------------- */

    if (
      selectedFile.size >
      5 * 1024 * 1024
    ) {
      toast.error(
        "Image must be under 5MB"
      );
      return;
    }

    /* -------------------------------------------------------
       CLEAN OLD PREVIEW
    ------------------------------------------------------- */

    if (
      preview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        preview
      );
    }

    /* -------------------------------------------------------
       CREATE NEW PREVIEW
    ------------------------------------------------------- */

    const objectUrl =
      URL.createObjectURL(
        selectedFile
      );

    setFile(selectedFile);
    setPreview(objectUrl);
  };

  /* =========================================================
     REMOVE SELECTED IMAGE
  ========================================================= */

  const removeSelectedImage = () => {
    if (
      preview?.startsWith("blob:")
    ) {
      URL.revokeObjectURL(
        preview
      );
    }

    setFile(null);
    setPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  /* =========================================================
     EMAIL VALIDATION
  ========================================================= */

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim()
    );
  };

  /* =========================================================
     SAVE PROFILE
  ========================================================= */

  const save = async () => {
    if (!user) {
      return;
    }

    /* -------------------------------------------------------
       FIRST NAME
    ------------------------------------------------------- */

    const firstName =
      user.firstName?.trim() || "";

    if (!firstName) {
      toast.error(
        "First name is required"
      );
      return;
    }

    /* -------------------------------------------------------
       EMAIL
    ------------------------------------------------------- */

    const email =
      user.email?.trim().toLowerCase() ||
      "";

    /*
     * Only phone-login users are allowed
     * to edit/add their email.
     */

    if (
      !emailLocked &&
      email &&
      !isValidEmail(email)
    ) {
      toast.error(
        "Please enter a valid email address"
      );
      return;
    }

    /* -------------------------------------------------------
       SAVE
    ------------------------------------------------------- */

    setSaving(true);

    try {
      const fd = new FormData();

      /* -----------------------------------------------------
         BASIC INFORMATION
      ----------------------------------------------------- */

      fd.append(
        "firstName",
        firstName
      );

      fd.append(
        "lastName",
        user.lastName?.trim() ||
          ""
      );

      /* -----------------------------------------------------
         EMAIL
         
         IMPORTANT:
         Only phone-login users can
         send email from this page.
      ----------------------------------------------------- */

      if (!emailLocked) {
        fd.append(
          "email",
          email
        );
      }

      /* -----------------------------------------------------
         PHONE
         
         IMPORTANT:
         NEVER send phone from this page.
         
         Phone is the verified login identity
         and must remain locked.
      ----------------------------------------------------- */

      /* intentionally NOT sending phone */

      /* -----------------------------------------------------
         PROFILE IMAGE
      ----------------------------------------------------- */

      if (file) {
        fd.append(
          "image",
          file
        );
      }

      /* -----------------------------------------------------
         API REQUEST
      ----------------------------------------------------- */

      const response =
        await fetch(
          `${BACKEND_URL}/api/auth/update-profile`,
          {
            method: "PUT",
            headers: authHeaders(),
            body: fd,
          }
        );

      let data = {};

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "Invalid server response"
        );
      }

      /* -----------------------------------------------------
         ERROR
      ----------------------------------------------------- */

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update profile"
        );
      }

      /* -----------------------------------------------------
         UPDATE USER
      ----------------------------------------------------- */

      if (data.user) {
        setUser(data.user);

        /*
         * Keep local user information
         * synchronized if your application
         * stores it there.
         */

        try {
          localStorage.setItem(
            "user",
            JSON.stringify(
              data.user
            )
          );
        } catch {
          // Ignore localStorage errors.
        }
      }

      /* -----------------------------------------------------
         CLEAR FILE
      ----------------------------------------------------- */

      setFile(null);

      if (
        preview?.startsWith("blob:")
      ) {
        URL.revokeObjectURL(
          preview
        );
      }

      setPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      toast.error(
        error.message ||
          "Something went wrong while updating"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (!user) {
    return (
      <AccountShell
        title="Personal information"
      >
      <div className="pi-loading">
        <Spinner />
      </div>
      </AccountShell>
    );
  }

  /* =========================================================
     USER DISPLAY
  ========================================================= */

  const name =
    [
      user.firstName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Odikart User";

  const image =
    preview ||
    user.image ||
    "https://i.pravatar.cc/300";

  /* =========================================================
     RETURN
  ========================================================= */

  return (
    <AccountShell
      title="Personal information"
    >
      <div className="pi-page">

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="pi-hero mt-18">

          <div className="pi-hero-glow pi-glow-one" />
          <div className="pi-hero-glow pi-glow-two" />

          <div className="pi-hero-content">

            {/* =================================================
                AVATAR
            ================================================= */}

            <div className="pi-avatar-container">

              <div className="pi-avatar-ring">

                <img
                  src={image}
                  alt="Profile"
                  className="pi-avatar"
                />

              </div>

              {/* CAMERA */}

              <button
                type="button"
                className="pi-camera-button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                aria-label="Change profile photo"
              >
                <FaCamera size={14} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={
                  handleImageChange
                }
              />

            </div>

            {/* =================================================
                USER INFO
            ================================================= */}

            <div className="pi-user-info">

              <div className="pi-name-row">

                <h1>
                  {name}
                </h1>

                {user.isVerified && (
                  <MdVerified
                    className="pi-verified"
                    title="Verified account"
                  />
                )}

              </div>

              <p className="pi-email">
                {user.email ||
                  user.phone ||
                  "No contact information"}
              </p>

              <div className="pi-member-badge">
                <FaCheck size={10} />
                Odikart member
              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            PHOTO ACTION
        ===================================================== */}

        <section className="pi-photo-section">

          <div>
            <h3>
              Profile photo
            </h3>

            <p>
              Use a clear photo so your
              account is easy to recognize.
            </p>
          </div>

          <div className="pi-photo-actions">

            <button
              type="button"
              className="pi-outline-button"
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <FaCamera />
              Change photo
            </button>

            {preview && (
              <button
                type="button"
                className="pi-remove-button"
                onClick={
                  removeSelectedImage
                }
              >
                <FaTimes />
                Remove
              </button>
            )}

          </div>

        </section>

        {/* =====================================================
            PERSONAL INFORMATION
        ===================================================== */}

        <section className="pi-card">

          <div className="pi-card-header">

            <div className="pi-card-icon">
              <FaUser />
            </div>

            <div>
              <h2>
                Personal information
              </h2>

              <p>
                Keep your account details
                up to date.
              </p>
            </div>

          </div>

          <div className="pi-divider" />

          <div className="pi-form-grid">

            {/* FIRST NAME */}

            <Field
              label="First name"
              value={
                user.firstName || ""
              }
              placeholder="Enter your first name"
              icon={<FaUser />}
              required
              onChange={(value) =>
                setUser({
                  ...user,
                  firstName: value,
                })
              }
            />

            {/* LAST NAME */}

            <Field
              label="Last name"
              value={
                user.lastName || ""
              }
              placeholder="Enter your last name"
              icon={<FaUser />}
              onChange={(value) =>
                setUser({
                  ...user,
                  lastName: value,
                })
              }
            />

          </div>

        </section>

        {/* =====================================================
            CONTACT INFORMATION
        ===================================================== */}

        <section className="pi-card">

          <div className="pi-card-header">

            <div className="pi-card-icon">
              <FaEnvelope />
            </div>

            <div>
              <h2>
                Contact information
              </h2>

              <p>
                Your contact details are
                used for account communication
                and orders.
              </p>
            </div>

          </div>

          <div className="pi-divider" />

          {/* ===================================================
              EMAIL
          =================================================== */}

          <Field
            label="Email address"
            value={
              user.email || ""
            }
            placeholder="Enter your email address"
            icon={<FaEnvelope />}
            disabled={
              emailLocked
            }
            verified={
              Boolean(
                user.isEmailVerified
              )
            }
            helper={
              isPhoneLogin
                ? user.email
                  ? "You can update your email address. A changed email should be verified with OTP."
                  : "Add an email address to receive account communication."
                : "Your email address is your protected login identity and cannot be changed here."
            }
            onChange={(value) =>
              setUser({
                ...user,
                email: value,
              })
            }
          />

          {/* ===================================================
              PHONE
          =================================================== */}

          <Field
            label="Phone number"
            value={
              user.phone || ""
            }
            placeholder="Phone number"
            icon={<FaPhoneAlt />}
            disabled={
              phoneLocked
            }
            verified={
              Boolean(
                user.isPhoneVerified
              )
            }
            helper={
              isPhoneLogin
                ? "This phone number is your verified login number and cannot be changed here."
                : "Phone number changes are protected and cannot be changed from this page."
            }
          />

        </section>

        {/* =====================================================
            SECURITY NOTICE
        ===================================================== */}

        <section className="pi-security">

          <div className="pi-security-icon">
            <FaShieldAlt />
          </div>

          <div>

            <h3>
              Your information is protected
            </h3>

            <p>

              {isPhoneLogin
                ? "You signed in with phone OTP. Your verified phone number is protected, while your email can be added or updated. Never share your OTP with anyone."
                : "Your login identity is protected. Verified account credentials cannot be changed from this page. Never share your OTP or account credentials with anyone."}

            </p>

          </div>

        </section>

        {/* =====================================================
            SAVE
        ===================================================== */}

        <div className="pi-save-container">

          <div className="pi-save-bar">
            <div className="pi-save-status">
              <div className="pi-save-status-icon">
                <FaShieldAlt size={11} />
              </div>

              <div>
                <strong>Profile settings</strong>
                <span>Your changes are saved securely.</span>
              </div>
            </div>

            <button
              type="button"
              className="pi-save-button"
              disabled={saving}
              onClick={save}
            >
              {saving ? (
                <>
                  <span className="pi-button-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave />
                  Save changes
                </>
              )}
            </button>
          </div>

        </div>

      </div>

      {/* =======================================================
          PAGE STYLES
      ======================================================= */}

      <style>{`

        /* =====================================================
           PERSONAL INFORMATION — MODERN UI
        ===================================================== */

        .pi-page {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 8px 0 120px;
          box-sizing: border-box;
        }

        /* HERO */
        .pi-hero {
          position: relative;
          overflow: hidden;
          min-height: 188px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 22px;
          background:
            radial-gradient(circle at 88% 18%, rgba(129,140,248,.32), transparent 30%),
            radial-gradient(circle at 18% 120%, rgba(59,130,246,.18), transparent 34%),
            linear-gradient(135deg, #0f172a 0%, #1e1b4b 52%, #312e81 100%);
          box-shadow: 0 18px 45px rgba(15,23,42,.14);
        }

        .pi-hero-glow {
          position: absolute;
          width: 190px;
          height: 190px;
          border-radius: 50%;
          filter: blur(48px);
          pointer-events: none;
          opacity: .55;
        }

        .pi-glow-one {
          top: -125px;
          right: -25px;
          background: rgba(99,102,241,.38);
        }

        .pi-glow-two {
          bottom: -135px;
          left: 12%;
          background: rgba(59,130,246,.20);
        }

        .pi-hero-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 22px;
          min-height: 188px;
          padding: 28px;
          box-sizing: border-box;
        }

        /* AVATAR */
        .pi-avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .pi-avatar-ring {
          width: 102px;
          height: 102px;
          padding: 4px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,.72), rgba(255,255,255,.22));
          box-shadow: 0 12px 30px rgba(0,0,0,.24);
          box-sizing: border-box;
        }

        .pi-avatar {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
          border: 4px solid rgba(255,255,255,.96);
          background: #f1f5f9;
          box-sizing: border-box;
        }

        .pi-camera-button {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 3px solid #fff;
          border-radius: 50%;
          background: linear-gradient(135deg,#6366f1,#4f46e5);
          color: #fff;
          cursor: pointer;
          box-shadow: 0 7px 18px rgba(0,0,0,.20);
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
        }

        .pi-camera-button:hover {
          transform: scale(1.07);
          filter: brightness(1.04);
          box-shadow: 0 9px 22px rgba(79,70,229,.32);
        }

        .pi-camera-button:focus-visible {
          outline: 3px solid rgba(165,180,252,.55);
          outline-offset: 2px;
        }

        /* USER INFO */
        .pi-user-info {
          min-width: 0;
        }

        .pi-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .pi-name-row h1 {
          margin: 0;
          color: #fff;
          font-size: clamp(22px, 2.5vw, 28px);
          line-height: 1.18;
          font-weight: 800;
          letter-spacing: -.035em;
        }

        .pi-verified {
          color: #60a5fa;
          font-size: 23px;
          filter: drop-shadow(0 2px 5px rgba(96,165,250,.22));
        }

        .pi-email {
          max-width: 620px;
          margin: 7px 0 12px;
          color: rgba(255,255,255,.70);
          font-size: 13px;
          overflow-wrap: anywhere;
        }

        .pi-member-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 25px;
          padding: 0 10px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 999px;
          background: rgba(255,255,255,.09);
          color: rgba(255,255,255,.90);
          font-size: 10.5px;
          font-weight: 750;
          backdrop-filter: blur(8px);
        }

        /* PHOTO TOOLBAR */
        .pi-photo-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-top: 14px;
          padding: 15px 17px;
          border: 1px solid #e8ebf0;
          border-radius: 16px;
          background: #fff;
          box-shadow: 0 4px 16px rgba(15,23,42,.035);
          box-sizing: border-box;
        }

        .pi-photo-section h3 {
          margin: 0;
          color: #111827;
          font-size: 13px;
          font-weight: 800;
        }

        .pi-photo-section p {
          margin: 3px 0 0;
          color: #8a909c;
          font-size: 11px;
          line-height: 1.45;
        }

        .pi-photo-actions {
          display: flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
        }

        .pi-outline-button,
        .pi-remove-button {
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 12px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 11.5px;
          font-weight: 750;
          cursor: pointer;
          transition: .18s ease;
          box-sizing: border-box;
        }

        .pi-outline-button {
          border: 1px solid #dfe3ea;
          background: #fff;
          color: #374151;
        }

        .pi-outline-button:hover {
          border-color: #a5b4fc;
          background: #f5f3ff;
          color: #4f46e5;
          transform: translateY(-1px);
        }

        .pi-remove-button {
          border: 1px solid #fecaca;
          background: #fff7f7;
          color: #dc2626;
        }

        .pi-remove-button:hover {
          background: #fee2e2;
          transform: translateY(-1px);
        }

        /* CARDS */
        .pi-card {
          margin-top: 14px;
          padding: 20px;
          border: 1px solid #e8ebf0;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 5px 20px rgba(15,23,42,.035);
          box-sizing: border-box;
        }

        .pi-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pi-card-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: linear-gradient(135deg,#eef2ff,#e0e7ff);
          color: #4f46e5;
          font-size: 14px;
        }

        .pi-card-header h2 {
          margin: 0;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -.01em;
        }

        .pi-card-header p {
          margin: 3px 0 0;
          color: #8a909c;
          font-size: 11px;
          line-height: 1.45;
        }

        .pi-divider {
          height: 1px;
          margin: 17px 0;
          background: #eef0f4;
        }

        .pi-form-grid {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 15px;
        }

        /* FIELDS */
        .pi-field {
          margin-bottom: 15px;
        }

        .pi-field:last-child {
          margin-bottom: 0;
        }

        .pi-field-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
          color: #374151;
          font-size: 11.5px;
          font-weight: 750;
        }

        .pi-required {
          color: #ef4444;
        }

        .pi-field-wrapper {
          position: relative;
        }

        .pi-field-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #a0a6b1;
          font-size: 11px;
          pointer-events: none;
          z-index: 2;
          transition: color .18s ease;
        }

        .pi-field-wrapper:focus-within .pi-field-icon {
          color: #6366f1;
        }

        .pi-input {
          width: 100%;
          height: 44px;
          padding: 0 40px;
          border: 1px solid #e4e7ec;
          border-radius: 11px;
          outline: none;
          background: #fafbfc;
          color: #111827;
          font-family: inherit;
          font-size: 12.5px;
          box-sizing: border-box;
          transition: border-color .18s ease, background .18s ease, box-shadow .18s ease;
        }

        .pi-input::placeholder {
          color: #b3b8c1;
        }

        .pi-input:hover {
          border-color: #d2d6de;
          background: #fff;
        }

        .pi-input:focus {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,.09);
        }

        .pi-input:disabled,
        .pi-locked-field {
          color: #6b7280 !important;
          background: #f5f6f8 !important;
          border-color: #e7e9ed !important;
          cursor: not-allowed;
        }

        .pi-lock-icon,
        .pi-verified-field {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .pi-lock-icon {
          color: #9ca3af;
          font-size: 10px;
        }

        .pi-verified-field {
          gap: 4px;
          color: #16a34a;
          font-size: 9.5px;
          font-weight: 750;
        }

        .pi-field-helper {
          margin-top: 5px;
          color: #9aa0aa;
          font-size: 10px;
          line-height: 1.5;
        }

        /* SECURITY */
        .pi-security {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          margin-top: 14px;
          padding: 14px;
          border: 1px solid #dbeafe;
          border-radius: 15px;
          background: linear-gradient(135deg,#f5f9ff,#eff6ff);
          box-sizing: border-box;
        }

        .pi-security-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #fff;
          color: #2563eb;
          box-shadow: 0 2px 7px rgba(37,99,235,.08);
        }

        .pi-security h3 {
          margin: 0;
          color: #1e3a8a;
          font-size: 12.5px;
          font-weight: 800;
        }

        .pi-security p {
          margin: 4px 0 0;
          color: #526d91;
          font-size: 10.5px;
          line-height: 1.55;
        }

        /* FIXED SAVE BAR */
        .pi-save-container {
          position: fixed;
          left: 50%;
          bottom: 16px;
          transform: translateX(-50%);
          z-index: 1000;
          width: min(1180px, calc(100% - 32px));
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          pointer-events: none;
        }

        .pi-save-bar {
          position: relative;
          width: 100%;
          min-height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 8px 9px 8px 13px;
          border: 1px solid rgba(226,232,240,.92);
          border-radius: 16px;
          background: rgba(255,255,255,.94);
          box-shadow:
            0 18px 42px rgba(15,23,42,.14),
            0 4px 12px rgba(15,23,42,.06);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          isolation: isolate;
          box-sizing: border-box;
          pointer-events: auto;
        }

        .pi-save-status {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .pi-save-status-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: #eef2ff;
          color: #4f46e5;
        }

        .pi-save-status strong {
          display: block;
          color: #1f2937;
          font-size: 11.5px;
          font-weight: 800;
          line-height: 1.3;
        }

        .pi-save-status span {
          display: block;
          margin-top: 2px;
          color: #9298a3;
          font-size: 9.5px;
          line-height: 1.3;
        }

        .pi-save-button {
          min-width: 145px;
          height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          flex-shrink: 0;
          border: 0;
          border-radius: 10px;
          background: linear-gradient(135deg,#111827,#312e81);
          color: #fff;
          font-family: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          box-shadow: 0 7px 18px rgba(17,24,39,.15);
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
        }

        .pi-save-button:hover:not(:disabled) {
          transform: translateY(-1px);
          filter: brightness(1.06);
          box-shadow: 0 10px 23px rgba(17,24,39,.20);
        }

        .pi-save-button:focus-visible {
          outline: 3px solid rgba(99,102,241,.18);
          outline-offset: 2px;
        }

        .pi-save-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .pi-button-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: pi-spin .7s linear infinite;
        }

        .pi-loading {
          min-height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes pi-spin {
          to { transform: rotate(360deg); }
        }

        /* TABLET / MOBILE */
        @media (max-width: 700px) {
          .pi-page {
            padding: 3px 0 108px;
          }

          .pi-hero {
            border-radius: 20px;
          }

          .pi-hero-content {
            min-height: auto;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 27px 18px;
          }

          .pi-avatar-ring {
            width: 94px;
            height: 94px;
          }

          .pi-name-row {
            justify-content: center;
          }

          .pi-name-row h1 {
            font-size: 22px;
          }

          .pi-email {
            font-size: 12px;
          }

          .pi-form-grid {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .pi-photo-section {
            align-items: flex-start;
            flex-direction: column;
          }

          .pi-photo-actions {
            width: 100%;
          }

          .pi-outline-button,
          .pi-remove-button {
            flex: 1;
          }
        }

        @media (max-width: 480px) {
          .pi-hero {
            border-radius: 17px;
          }

          .pi-hero-content {
            padding: 24px 15px;
          }

          .pi-avatar-ring {
            width: 88px;
            height: 88px;
          }

          .pi-camera-button {
            width: 33px;
            height: 33px;
          }

          .pi-name-row h1 {
            font-size: 20px;
          }

          .pi-photo-section,
          .pi-card {
            padding: 15px;
            border-radius: 15px;
          }

          .pi-card-header {
            align-items: flex-start;
          }

          .pi-card-icon {
            width: 37px;
            height: 37px;
          }

          .pi-input {
            height: 43px;
          }

          .pi-security {
            padding: 13px;
          }

          .pi-save-container {
            left: 0;
            bottom: 0;
            transform: none;
            width: 100%;
            padding:
              8px
              8px
              max(8px, env(safe-area-inset-bottom));
            background: rgba(255,255,255,.82);
            border-top: 1px solid rgba(226,232,240,.9);
            box-shadow: 0 -8px 24px rgba(15,23,42,.06);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            box-sizing: border-box;
          }

          .pi-save-bar {
            min-height: 58px;
            gap: 9px;
            padding: 7px;
            border-radius: 14px;
          }

          .pi-save-status {
            gap: 7px;
          }

          .pi-save-status-icon {
            width: 29px;
            height: 29px;
          }

          .pi-save-status strong {
            font-size: 10.5px;
          }

          .pi-save-status span {
            font-size: 8.5px;
          }

          .pi-save-button {
            min-width: 128px;
            height: 40px;
            padding: 0 12px;
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pi-button-spinner {
            animation: none;
          }

          .pi-camera-button,
          .pi-outline-button,
          .pi-remove-button,
          .pi-save-button,
          .pi-save-bar {
            transition: none;
          }
        }

      `}</style>
    </AccountShell>
  );
}

/* =========================================================
   FIELD COMPONENT
========================================================= */

function Field({
  label,
  value,
  onChange,
  disabled = false,
  icon,
  placeholder = "",
  required = false,
  verified = false,
  helper = "",
}) {
  return (
    <div className="pi-field">

      {/* =====================================================
          LABEL
      ===================================================== */}

      <label className="pi-field-label">

        <span>
          {label}

          {required && (
            <span className="pi-required">
              {" "}*
            </span>
          )}
        </span>

      </label>

      {/* =====================================================
          INPUT
      ===================================================== */}

      <div className="pi-field-wrapper">

        <span className="pi-field-icon">
          {icon}
        </span>

        <input
          className={`pi-input ${
            disabled
              ? "pi-locked-field"
              : ""
          }`}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) =>
            onChange?.(
              event.target.value
            )
          }
        />

        {/* ===================================================
            VERIFIED
        =================================================== */}

        {verified && !disabled && (
          <span className="pi-verified-field">
            <FaCheck size={9} />
            Verified
          </span>
        )}

        {/* ===================================================
            LOCKED
        =================================================== */}

        {disabled && (
          <span className="pi-lock-icon">
            <FaLock size={10} />
          </span>
        )}

      </div>

      {/* =====================================================
          HELPER
      ===================================================== */}

      {helper && (
        <div className="pi-field-helper">
          {helper}
        </div>
      )}

    </div>
  );
}

