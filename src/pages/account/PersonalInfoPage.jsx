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
      <AccountShell title="Personal information">
        <PersonalInfoSkeleton />
      </AccountShell>
    );
  }

  /* =========================================================
     USER DISPLAY
  ========================================================= */

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    "Odikart User";

  const image =
    preview ||
    user.image ||
    "https://i.pravatar.cc/300";

  const hasPendingPhoto = Boolean(file);

  return (
    <AccountShell title="Personal information">
      <div className="w-full pb-28 sm:pb-32">
        {/* PAGE HEADER / HERO */}
        <section className="group relative w-full overflow-hidden rounded-[22px] border border-slate-800/40 bg-slate-950 shadow-[0_18px_55px_rgba(15,23,42,0.14)] sm:rounded-[26px]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_16%,rgba(99,102,241,0.35),transparent_30%),radial-gradient(circle_at_15%_115%,rgba(37,99,235,0.20),transparent_35%),linear-gradient(135deg,#0f172a_0%,#1e1b4b_52%,#312e81_100%)]" />
          <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl transition-transform duration-700 group-hover:scale-110" />
          <div className="pointer-events-none absolute -bottom-32 left-[12%] h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex min-h-[190px] flex-col items-center justify-center gap-5 px-5 py-7 text-center sm:min-h-[205px] sm:flex-row sm:justify-start sm:gap-6 sm:px-8 sm:py-8 sm:text-left">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="absolute -inset-2 rounded-full bg-white/10 blur-md" />
              <div className="relative h-[104px] w-[104px] rounded-full bg-gradient-to-br from-white/80 to-white/20 p-1 shadow-[0_14px_35px_rgba(0,0,0,0.28)] sm:h-[112px] sm:w-[112px]">
                <img
                  src={image}
                  alt="Profile"
                  className="h-full w-full rounded-full border-4 border-white/95 bg-slate-100 object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
                className="group/camera absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg transition duration-200 hover:scale-110 hover:shadow-indigo-500/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/40 active:scale-95"
              >
                <FaCamera size={13} className="transition-transform duration-200 group-hover/camera:scale-110" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </div>

            {/* User identity */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="max-w-full break-words text-[24px] font-extrabold tracking-[-0.04em] text-white sm:text-[29px]">
                  {name}
                </h1>

                {user.isVerified && (
                  <MdVerified
                    className="shrink-0 text-[23px] text-blue-400 drop-shadow-[0_2px_6px_rgba(96,165,250,0.35)]"
                    title="Verified account"
                  />
                )}
              </div>

              <p className="mt-1.5 max-w-xl break-all text-[12px] leading-5 text-white/65 sm:text-[13px]">
                {user.email || user.phone || "No contact information"}
              </p>

              <div className="mt-3 inline-flex min-h-7 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 text-[10px] font-bold text-white/90 shadow-sm backdrop-blur-md">
                <FaCheck size={9} />
                Odikart member
              </div>
            </div>
          </div>

          {/* subtle shine */}
          <div className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-all duration-1000 group-hover:left-[120%]" />
        </section>

        {/* PROFILE PHOTO TOOLBAR */}
        <section className="mt-3.5 flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_5px_22px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h2 className="text-[13px] font-extrabold text-slate-900">
              Profile photo
            </h2>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">
              Use a clear photo so your account is easy to recognize.
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-10 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-3 text-[11.5px] font-bold text-slate-700 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100 sm:flex-none"
            >
              <span className="pointer-events-none absolute inset-y-0 -left-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent transition-all duration-700 group-hover:left-[120%]" />
              <FaCamera className="relative z-10" />
              <span className="relative z-10">Change photo</span>
            </button>

            {preview && (
              <button
                type="button"
                onClick={removeSelectedImage}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 text-[11.5px] font-bold text-red-600 transition-all duration-200 hover:bg-red-100 active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100 sm:flex-none"
              >
                <FaTimes />
                Remove
              </button>
            )}
          </div>
        </section>

        {/* PERSONAL INFORMATION */}
        <section className="mt-3.5 w-full rounded-2xl border border-slate-200 bg-white shadow-[0_5px_22px_rgba(15,23,42,0.04)]">
          <SectionHeader
            icon={<FaUser />}
            title="Personal information"
            description="Keep your account details up to date."
          />

          <div className="mx-4 h-px bg-slate-100 sm:mx-5" />

          <div className="grid grid-cols-1 gap-x-5 px-4 py-5 sm:grid-cols-2 sm:px-5">
            <Field
              label="First name"
              value={user.firstName || ""}
              placeholder="Enter your first name"
              icon={<FaUser />}
              required
              onChange={(value) => setUser({ ...user, firstName: value })}
            />

            <Field
              label="Last name"
              value={user.lastName || ""}
              placeholder="Enter your last name"
              icon={<FaUser />}
              onChange={(value) => setUser({ ...user, lastName: value })}
            />
          </div>
        </section>

        {/* CONTACT INFORMATION */}
        <section className="mt-3.5 w-full rounded-2xl border border-slate-200 bg-white shadow-[0_5px_22px_rgba(15,23,42,0.04)]">
          <SectionHeader
            icon={<FaEnvelope />}
            title="Contact information"
            description="Your contact details are used for account communication and orders."
          />

          <div className="mx-4 h-px bg-slate-100 sm:mx-5" />

          <div className="px-4 py-5 sm:px-5">
            <Field
              label="Email address"
              value={user.email || ""}
              placeholder="Enter your email address"
              icon={<FaEnvelope />}
              disabled={emailLocked}
              verified={Boolean(user.isEmailVerified)}
              helper={
                isPhoneLogin
                  ? user.email
                    ? "You can update your email address. A changed email should be verified with OTP."
                    : "Add an email address to receive account communication."
                  : "Your email address is your protected login identity and cannot be changed here."
              }
              onChange={(value) => setUser({ ...user, email: value })}
            />

            <Field
              label="Phone number"
              value={user.phone || ""}
              placeholder="Phone number"
              icon={<FaPhoneAlt />}
              disabled={phoneLocked}
              verified={Boolean(user.isPhoneVerified)}
              helper={
                isPhoneLogin
                  ? "This phone number is your verified login number and cannot be changed here."
                  : "Phone number changes are protected and cannot be changed from this page."
              }
            />
          </div>
        </section>

        {/* SECURITY */}
        <section className="relative mt-3.5 flex w-full items-start gap-3 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-[0_4px_18px_rgba(37,99,235,0.04)] sm:p-5">
          <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-32 rounded-full bg-blue-200/30 blur-2xl" />

          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <FaShieldAlt />
          </div>

          <div className="relative z-10 min-w-0">
            <h3 className="text-[12.5px] font-extrabold text-blue-950">
              Your information is protected
            </h3>
            <p className="mt-1 text-[10.5px] leading-[1.6] text-blue-900/65">
              {isPhoneLogin
                ? "You signed in with phone OTP. Your verified phone number is protected, while your email can be added or updated. Never share your OTP with anyone."
                : "Your login identity is protected. Verified account credentials cannot be changed from this page. Never share your OTP or account credentials with anyone."}
            </p>
          </div>
        </section>

        {/* PENDING CHANGE INDICATOR */}
        {hasPendingPhoto && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3.5 py-3 text-[11px] font-semibold text-amber-800">
            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.12)]" />
            New profile photo selected. Save your changes to upload it.
          </div>
        )}
      </div>

      {/* FIXED SAVE BAR */}
      <div className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200/80 bg-white/85 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[min(1180px,calc(100%-32px))] sm:-translate-x-1/2 sm:border sm:border-slate-200 sm:rounded-2xl sm:bg-white/95 sm:px-3 sm:py-2">
        <div className="mx-auto flex min-h-[54px] w-full items-center justify-between gap-2 rounded-xl bg-white/70 px-1 sm:min-h-[58px] sm:px-1.5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 sm:h-9 sm:w-9">
              <FaShieldAlt size={11} />
            </div>

            <div className="min-w-0">
              <strong className="block truncate text-[10.5px] font-extrabold text-slate-800 sm:text-[11.5px]">
                Profile settings
              </strong>
              <span className="hidden text-[9.5px] text-slate-400 sm:block">
                Your changes are saved securely.
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="group relative flex h-10 min-w-[128px] shrink-0 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-800 px-4 text-[11px] font-extrabold text-white shadow-[0_7px_20px_rgba(17,24,39,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(17,24,39,0.22)] disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:min-w-[145px] sm:text-[12px] focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-100"
          >
            <span className="pointer-events-none absolute inset-y-0 -left-full w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-all duration-700 group-hover:left-[120%]" />

            {saving ? (
              <>
                <span className="relative z-10 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="relative z-10">Saving...</span>
              </>
            ) : (
              <>
                <FaSave className="relative z-10" />
                <span className="relative z-10">Save changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </AccountShell>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({ icon, title, description }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100/70">
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="text-[14px] font-extrabold tracking-[-0.01em] text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-[10.5px] leading-[1.5] text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
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
    <div className="mb-5 last:mb-0">
      <label className="mb-1.5 flex items-center justify-between text-[11.5px] font-bold text-slate-700">
        <span>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
      </label>

      <div className="group relative">
        <span
          className={`pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[11px] transition-colors ${
            disabled ? "text-slate-400" : "text-slate-400 group-focus-within:text-indigo-500"
          }`}
        >
          {icon}
        </span>

        <input
          className={`h-11 w-full rounded-xl border bg-slate-50 pl-10 pr-12 text-[12.5px] text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 ${
            disabled
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
              : "border-slate-200 hover:border-slate-300 hover:bg-white focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50"
          }`}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange?.(event.target.value)}
        />

        {verified && !disabled && (
          <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[9.5px] font-bold text-emerald-600">
            <FaCheck size={9} />
            Verified
          </span>
        )}

        {disabled && (
          <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-[10px] text-slate-400">
            <FaLock size={10} />
          </span>
        )}
      </div>

      {helper && (
        <p className="mt-1.5 text-[10px] leading-[1.5] text-slate-400">
          {helper}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function PersonalInfoSkeleton() {
  return (
    <div className="w-full animate-pulse pb-28 sm:pb-10">
      <div className="relative h-[190px] w-full overflow-hidden rounded-[22px] bg-slate-200 sm:h-[205px] sm:rounded-[26px]">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/45 to-transparent [animation:skeletonShine_1.6s_infinite] -translate-x-full" />

        <div className="flex h-full items-center gap-6 px-6">
          <div className="h-[104px] w-[104px] shrink-0 rounded-full bg-slate-300 sm:h-[112px] sm:w-[112px]" />
          <div className="hidden space-y-3 sm:block">
            <div className="h-7 w-52 rounded-lg bg-slate-300" />
            <div className="h-3.5 w-64 rounded-full bg-slate-300" />
            <div className="h-7 w-28 rounded-full bg-slate-300" />
          </div>
        </div>
      </div>

      <div className="mt-3.5 h-20 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3.5 w-28 rounded bg-slate-200" />
            <div className="h-3 w-52 rounded bg-slate-100" />
          </div>
          <div className="h-10 w-32 rounded-xl bg-slate-200" />
        </div>
      </div>

      <SkeletonFormSection fields={2} grid />

      <SkeletonFormSection fields={2} />

      <div className="mt-3.5 h-24 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex gap-3">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-44 rounded bg-slate-200" />
            <div className="h-3 w-full max-w-2xl rounded bg-slate-100" />
            <div className="h-3 w-4/5 rounded bg-slate-100" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skeletonShine {
          100% { transform: translateX(300%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-pulse { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function SkeletonFormSection({ fields = 2, grid = false }) {
  return (
    <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3.5 w-36 rounded bg-slate-200" />
          <div className="h-3 w-56 rounded bg-slate-100" />
        </div>
      </div>

      <div className="my-4 h-px bg-slate-100" />

      <div className={grid ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "space-y-5"}>
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
            <div className="h-11 w-full rounded-xl bg-slate-100" />
            <div className="mt-2 h-2.5 w-3/4 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
