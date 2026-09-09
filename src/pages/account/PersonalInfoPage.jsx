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
import { toast } from "react-toastify";

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

      toast.success(
        "Profile updated successfully"
      );
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
      <Spinner/>
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

          <button
            type="button"
            className="pi-save-button"
            disabled={saving}
            onClick={save}
          >

            {saving ? (
              <>
                <span className="pi-button-spinner" />
                Saving changes...
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

      {/* =======================================================
          PAGE STYLES
      ======================================================= */}

      <style>{`

        /* =====================================================
           PAGE
        ===================================================== */

        .pi-page {
          width: 100%;
          max-width: 920px;
          margin: 0 auto;
          padding: 20px 0 40px;
        }

        /* =====================================================
           HERO
        ===================================================== */

        .pi-hero {
          position: relative;
          overflow: hidden;

          min-height: 210px;

          border-radius: 24px;

          background:
            linear-gradient(
              135deg,
              #111827 0%,
              #1e1b4b 48%,
              #312e81 100%
            );

          box-shadow:
            0 20px 50px
            rgba(15, 23, 42, 0.16);
        }

        .pi-hero-glow {
          position: absolute;

          width: 240px;
          height: 240px;

          border-radius: 50%;

          filter: blur(55px);

          pointer-events: none;
        }

        .pi-glow-one {
          top: -140px;
          right: -40px;

          background:
            rgba(99, 102, 241, 0.38);
        }

        .pi-glow-two {
          bottom: -160px;
          left: 10%;

          background:
            rgba(59, 130, 246, 0.25);
        }

        .pi-hero-content {
          position: relative;
          z-index: 2;

          display: flex;
          align-items: center;

          gap: 24px;

          min-height: 210px;

          padding: 30px;
        }

        /* =====================================================
           AVATAR
        ===================================================== */

        .pi-avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .pi-avatar-ring {
          width: 112px;
          height: 112px;

          padding: 4px;

          border-radius: 50%;

          background:
            rgba(255, 255, 255, 0.35);

          box-shadow:
            0 12px 30px
            rgba(0, 0, 0, 0.25);
        }

        .pi-avatar {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: cover;

          border-radius: 50%;

          border:
            4px solid
            rgba(255, 255, 255, 0.95);

          background: #f1f5f9;
        }

        /* =====================================================
           CAMERA
        ===================================================== */

        .pi-camera-button {
          position: absolute;

          right: 2px;
          bottom: 2px;

          width: 38px;
          height: 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            3px solid white;

          border-radius: 50%;

          background: #4f46e5;

          color: white;

          cursor: pointer;

          box-shadow:
            0 5px 15px
            rgba(0, 0, 0, 0.2);

          transition:
            transform 0.2s ease,
            background 0.2s ease;
        }

        .pi-camera-button:hover {
          transform: scale(1.08);
          background: #4338ca;
        }

        /* =====================================================
           USER INFO
        ===================================================== */

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

          color: white;

          font-size: 27px;
          line-height: 1.2;

          font-weight: 800;

          letter-spacing: -0.5px;
        }

        .pi-verified {
          color: #60a5fa;
          font-size: 24px;
        }

        .pi-email {
          margin:
            7px 0 12px;

          color:
            rgba(255, 255, 255, 0.72);

          font-size: 14px;

          overflow-wrap: anywhere;
        }

        .pi-member-badge {
          display: inline-flex;
          align-items: center;

          gap: 6px;

          padding:
            6px 10px;

          border:
            1px solid
            rgba(255,255,255,0.15);

          border-radius: 999px;

          background:
            rgba(255,255,255,0.1);

          color:
            rgba(255,255,255,0.9);

          font-size: 11px;
          font-weight: 700;
        }

        /* =====================================================
           PHOTO SECTION
        ===================================================== */

        .pi-photo-section {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          margin-top: 16px;

          padding:
            18px 20px;

          border:
            1px solid #e5e7eb;

          border-radius: 18px;

          background: white;
        }

        .pi-photo-section h3 {
          margin: 0;

          color: #111827;

          font-size: 14px;
          font-weight: 800;
        }

        .pi-photo-section p {
          margin:
            4px 0 0;

          color: #6b7280;

          font-size: 12px;
          line-height: 1.5;
        }

        .pi-photo-actions {
          display: flex;
          align-items: center;

          gap: 8px;

          flex-shrink: 0;
        }

        .pi-outline-button,
        .pi-remove-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 7px;

          min-height: 38px;

          padding:
            0 13px;

          border-radius: 10px;

          font-size: 12px;
          font-weight: 700;

          cursor: pointer;

          transition:
            all 0.2s ease;
        }

        .pi-outline-button {
          border:
            1px solid #dbe1ea;

          background: white;

          color: #374151;
        }

        .pi-outline-button:hover {
          border-color: #a5b4fc;

          background: #eef2ff;

          color: #4338ca;
        }

        .pi-remove-button {
          border:
            1px solid #fecaca;

          background: #fff5f5;

          color: #dc2626;
        }

        .pi-remove-button:hover {
          background: #fee2e2;
        }

        /* =====================================================
           CARD
        ===================================================== */

        .pi-card {
          margin-top: 16px;

          padding: 22px;

          border:
            1px solid #e5e7eb;

          border-radius: 20px;

          background: white;

          box-shadow:
            0 5px 20px
            rgba(15, 23, 42, 0.035);
        }

        .pi-card-header {
          display: flex;
          align-items: center;

          gap: 13px;
        }

        .pi-card-icon {
          width: 42px;
          height: 42px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 12px;

          background: #eef2ff;

          color: #4f46e5;

          font-size: 15px;
        }

        .pi-card-header h2 {
          margin: 0;

          color: #111827;

          font-size: 15px;
          font-weight: 800;
        }

        .pi-card-header p {
          margin:
            3px 0 0;

          color: #737373;

          font-size: 12px;

          line-height: 1.5;
        }

        .pi-divider {
          height: 1px;

          margin:
            20px 0;

          background: #f0f0f0;
        }

        /* =====================================================
           FORM GRID
        ===================================================== */

        .pi-form-grid {
          display: grid;

          grid-template-columns:
            repeat(
              2,
              minmax(0, 1fr)
            );

          gap: 16px;
        }

        /* =====================================================
           FIELD
        ===================================================== */

        .pi-field {
          margin-bottom: 17px;
        }

        .pi-field:last-child {
          margin-bottom: 0;
        }

        .pi-field-label {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 7px;

          color: #374151;

          font-size: 12px;
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

          left: 14px;
          top: 50%;

          transform:
            translateY(-50%);

          color: #9ca3af;

          font-size: 12px;

          pointer-events: none;

          z-index: 2;
        }

        .pi-input {
          width: 100%;
          height: 46px;

          padding:
            0 42px;

          border:
            1px solid #e5e7eb;

          border-radius: 12px;

          outline: none;

          background: #fafafa;

          color: #111827;

          font-size: 13px;

          transition:
            border-color 0.2s ease,
            background 0.2s ease,
            box-shadow 0.2s ease;
        }

        .pi-input::placeholder {
          color: #b0b5bd;
        }

        .pi-input:hover {
          border-color: #d1d5db;
          background: white;
        }

        .pi-input:focus {
          border-color: #6366f1;

          background: white;

          box-shadow:
            0 0 0 4px
            rgba(99, 102, 241, 0.09);
        }

        .pi-input:disabled {
          color: #6b7280;

          background:
            linear-gradient(
              135deg,
              #f5f5f5,
              #f8fafc
            );

          border-color:
            #e5e7eb;

          cursor: not-allowed;
        }

        .pi-locked-field {
          background:
            #f3f4f6 !important;

          color:
            #6b7280 !important;
        }

        .pi-lock-icon {
          position: absolute;

          right: 14px;
          top: 50%;

          transform:
            translateY(-50%);

          display: flex;
          align-items: center;
          justify-content: center;

          color: #9ca3af;

          font-size: 10px;

          pointer-events: none;
        }

        .pi-verified-field {
          position: absolute;

          right: 14px;
          top: 50%;

          transform:
            translateY(-50%);

          display: flex;
          align-items: center;

          gap: 4px;

          color: #16a34a;

          font-size: 10px;
          font-weight: 700;

          pointer-events: none;
        }

        .pi-field-helper {
          margin-top: 6px;

          color: #9ca3af;

          font-size: 10.5px;

          line-height: 1.5;
        }

        /* =====================================================
           SECURITY
        ===================================================== */

        .pi-security {
          display: flex;
          align-items: flex-start;

          gap: 13px;

          margin-top: 16px;

          padding: 17px;

          border:
            1px solid #dbeafe;

          border-radius: 17px;

          background: #eff6ff;
        }

        .pi-security-icon {
          width: 38px;
          height: 38px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          background: white;

          color: #2563eb;

          box-shadow:
            0 2px 7px
            rgba(37, 99, 235, 0.08);
        }

        .pi-security h3 {
          margin: 0;

          color: #1e3a8a;

          font-size: 13px;
          font-weight: 800;
        }

        .pi-security p {
          margin:
            4px 0 0;

          color: #49658c;

          font-size: 11.5px;

          line-height: 1.6;
        }

        /* =====================================================
           SAVE
        ===================================================== */

        .pi-save-container {
          display: flex;
          justify-content: flex-end;

          margin-top: 18px;
        }

        .pi-save-button {
          min-width: 155px;
          height: 46px;

          display: inline-flex;
          align-items: center;
          justify-content: center;

          gap: 8px;

          border: 0;

          border-radius: 12px;

          background: #111827;

          color: white;

          font-size: 13px;
          font-weight: 750;

          cursor: pointer;

          box-shadow:
            0 7px 20px
            rgba(17, 24, 39, 0.15);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .pi-save-button:hover:not(:disabled) {
          transform:
            translateY(-1px);

          background: #1f2937;

          box-shadow:
            0 10px 25px
            rgba(17, 24, 39, 0.2);
        }

        .pi-save-button:disabled {
          opacity: 0.7;

          cursor: not-allowed;
        }

        .pi-button-spinner {
          width: 15px;
          height: 15px;

          border:
            2px solid
            rgba(255,255,255,0.35);

          border-top-color:
            white;

          border-radius: 50%;

          animation:
            pi-spin 0.7s linear infinite;
        }

        /* =====================================================
           LOADING
        ===================================================== */

        .pi-loading {
          min-height: 280px;

          display: flex;
          align-items: center;
          justify-content: center;

          gap: 13px;

          padding: 30px;

          border:
            1px solid #e5e7eb;

          border-radius: 20px;

          background: white;
        }

        .pi-spinner {
          width: 34px;
          height: 34px;

          display: flex;
          align-items: center;
          justify-content: center;

          border:
            3px solid #e5e7eb;

          border-top-color:
            #4f46e5;

          border-radius: 50%;

          animation:
            pi-spin
            0.75s
            linear
            infinite;
        }

        .pi-spinner span {
          width: 8px;
          height: 8px;

          border-radius: 50%;

          background:
            #4f46e5;
        }

        .pi-loading-title {
          color: #111827;

          font-size: 13px;
          font-weight: 750;
        }

        .pi-loading-text {
          margin-top: 3px;

          color: #9ca3af;

          font-size: 11px;
        }

        @keyframes pi-spin {
          to {
            transform:
              rotate(360deg);
          }
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 700px) {

          .pi-page {
            padding-top: 12px;
          }

          .pi-hero {
            border-radius: 20px;
          }

          .pi-hero-content {
            min-height: auto;

            flex-direction: column;

            align-items: center;

            text-align: center;

            padding:
              30px 20px;
          }

          .pi-name-row {
            justify-content: center;
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

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 480px) {

          .pi-page {
            padding-bottom: 25px;
          }

          .pi-hero-content {
            padding:
              26px 16px;
          }

          .pi-avatar-ring {
            width: 96px;
            height: 96px;
          }

          .pi-camera-button {
            width: 34px;
            height: 34px;
          }

          .pi-name-row h1 {
            font-size: 22px;
          }

          .pi-email {
            font-size: 12px;
          }

          .pi-photo-section,
          .pi-card {
            padding: 17px;

            border-radius: 17px;
          }

          .pi-card-header {
            align-items: flex-start;
          }

          .pi-card-icon {
            width: 38px;
            height: 38px;
          }

          .pi-save-container {
            justify-content: stretch;
          }

          .pi-save-button {
            width: 100%;
          }

          .pi-security {
            padding: 14px;
          }
        }

        /* =====================================================
           REDUCED MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {

          .pi-spinner,
          .pi-button-spinner {
            animation: none;
          }

          .pi-camera-button,
          .pi-outline-button,
          .pi-remove-button,
          .pi-save-button {
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

