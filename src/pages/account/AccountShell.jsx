import React from "react";
import { FaArrowLeft } from "react-icons/fa";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/* =========================================================
   ACCOUNT SKELETON
========================================================= */

export function AccountSkeleton() {
  return (
    <div className="ok-skeleton-page" aria-hidden="true">
      {/* Profile / header skeleton */}
      <div className="ok-skeleton-profile">
        <div className="ok-skeleton-avatar" />

        <div className="ok-skeleton-profile-info">
          <div className="ok-skeleton-line ok-skeleton-name" />
          <div className="ok-skeleton-line ok-skeleton-email" />

          <div className="ok-skeleton-chips">
            <div className="ok-skeleton-chip" />
            <div className="ok-skeleton-chip short" />
          </div>
        </div>
      </div>

      {/* Section */}
      <div className="ok-skeleton-section-title" />

      {/* Card */}
      <div className="ok-skeleton-card">
        <div className="ok-skeleton-card-row">
          <div className="ok-skeleton-circle" />

          <div className="ok-skeleton-card-content">
            <div className="ok-skeleton-line medium" />
            <div className="ok-skeleton-line small" />
          </div>

          <div className="ok-skeleton-action" />
        </div>

        <div className="ok-skeleton-card-row">
          <div className="ok-skeleton-circle" />

          <div className="ok-skeleton-card-content">
            <div className="ok-skeleton-line medium" />
            <div className="ok-skeleton-line small" />
          </div>

          <div className="ok-skeleton-action" />
        </div>

        <div className="ok-skeleton-card-row">
          <div className="ok-skeleton-circle" />

          <div className="ok-skeleton-card-content">
            <div className="ok-skeleton-line medium" />
            <div className="ok-skeleton-line small" />
          </div>

          <div className="ok-skeleton-action" />
        </div>
      </div>

      {/* Second section */}
      <div className="ok-skeleton-section-title second" />

      <div className="ok-skeleton-grid">
        <div className="ok-skeleton-box" />
        <div className="ok-skeleton-box" />
      </div>
    </div>
  );
}

/* =========================================================
   ACCOUNT SHELL
========================================================= */
  
export function AccountShell({
  title,
  children,
  right,
  onBack,
  loading = false,
}) {
  const [shellReady, setShellReady] = React.useState(false);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setShellReady(true);
    }, 650);

    return () => window.clearTimeout(timer);
  }, []);

  const showSkeleton = loading || !shellReady;

  return (
    <>
      <style>{`
        /* =====================================================
           PAGE
        ===================================================== */

        .ok-page {
          min-height: 100vh;
          background: #f6f7fb;
          color: #17181d;
          font-family: Inter, Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding-bottom: 32px;
        }

        /* =====================================================
           TOP BAR
        ===================================================== */

        .ok-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;

          width: 100%;
          height: 60px;

          z-index: 2147483647;

          background: rgba(255, 255, 255, 0.94);

          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);

          border-bottom: 1px solid #e8e8ef;

          display: flex;
          align-items: center;

          padding: 0 14px;
          gap: 10px;

          box-sizing: border-box;
        }

        .ok-back,
        .ok-icon-btn {
          width: 42px;
          height: 42px;

          flex-shrink: 0;

          border: 0;
          background: transparent;

          border-radius: 50%;

          display: grid;
          place-items: center;

          color: #4b4d58;

          cursor: pointer;

          transition:
            background 0.2s ease,
            transform 0.2s ease,
            color 0.2s ease;
        }

        .ok-back:hover,
        .ok-icon-btn:hover {
          background: #f0f0f5;
          color: #111827;
        }

        .ok-back:active,
        .ok-icon-btn:active {
          transform: scale(0.94);
        }

        .ok-title {
          min-width: 0;
          flex: 1;

          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          font-size: 18px;
          line-height: 1;
          font-weight: 750;

          color: #17181d;
          letter-spacing: -0.02em;
        }

        /* =====================================================
           PAGE CONTENT
        ===================================================== */

        .ok-wrap {
          width: 100%;
          max-width: 640px;

          margin: 0 auto;

          padding: 78px 16px 0;

          box-sizing: border-box;
        }

        /* =====================================================
           CARDS
        ===================================================== */

        .ok-card {
          background: #fff;

          border: 1px solid #e8e8ef;

          border-radius: 20px;

          box-shadow:
            0 2px 12px rgba(20, 20, 40, 0.05);

          overflow: hidden;
        }

        .ok-section {
          margin-top: 22px;
        }

        .ok-label {
          font-size: 12px;

          text-transform: uppercase;
          letter-spacing: 0.08em;

          font-weight: 750;

          color: #777987;

          margin: 0 4px 9px;
        }

        /* =====================================================
           BUTTONS
        ===================================================== */

        .ok-btn {
          min-height: 46px;

          border: 0;
          border-radius: 14px;

          padding: 0 18px;

          font-weight: 700;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .ok-btn:hover {
          transform: translateY(-1px);
        }

        .ok-btn:active {
          transform: scale(0.98);
        }

        .ok-primary {
          background: #4f46e5;
          color: #fff;
        }

        .ok-primary:hover {
          background: #4338ca;
        }

        .ok-secondary {
          background: #eeedff;
          color: #3730a3;
        }

        .ok-outline {
          background: #fff;
          border: 1px solid #d9d9e4;
          color: #343641;
        }

        .ok-danger {
          background: #b91c1c;
          color: #fff;
        }

        .ok-full {
          width: 100%;
        }

        /* =====================================================
           INPUT
        ===================================================== */

        .ok-input {
          width: 100%;
          height: 48px;

          border: 1px solid #dedee8;
          border-radius: 13px;

          background: #fff;

          padding: 0 14px;

          font-size: 14px;

          outline: none;

          box-sizing: border-box;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .ok-input:focus {
          border-color: #4f46e5;

          box-shadow:
            0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .ok-field {
          margin-bottom: 15px;
        }

        .ok-field label {
          display: block;

          font-size: 12px;
          font-weight: 700;

          color: #626470;

          margin: 0 0 7px;
        }

        /* =====================================================
           ROW / TEXT
        ===================================================== */

        .ok-row {
          display: flex;
          align-items: center;

          gap: 12px;
        }

        .ok-grow {
          flex: 1;
          min-width: 0;
        }

        .ok-muted {
          color: #737582;
          font-size: 13px;
        }

        .ok-small {
          font-size: 12px;
          color: #777987;
        }

        /* =====================================================
           EMPTY
        ===================================================== */

        .ok-empty {
          text-align: center;
          padding: 48px 20px;
        }

        .ok-empty h3 {
          margin: 12px 0 5px;
          font-size: 17px;
        }

        .ok-empty p {
          margin: 0;
          color: #777987;
          font-size: 13px;
        }

        /* =====================================================
           LIST
        ===================================================== */

        .ok-list {
          overflow: hidden;
        }

        .ok-list-item {
          display: flex;
          align-items: center;

          gap: 13px;

          padding: 15px 16px;

          border-bottom: 1px solid #eeeeF3;

          cursor: pointer;

          background: #fff;

          transition: background 0.2s ease;
        }

        .ok-list-item:hover {
          background: #fafaff;
        }

        .ok-list-item:last-child {
          border-bottom: 0;
        }

        /* =====================================================
           AVATARS / ICONS
        ===================================================== */

        .ok-avatar {
          width: 72px;
          height: 72px;

          border-radius: 18px;

          object-fit: cover;

          background: #eee;
        }

        .ok-circle {
          width: 44px;
          height: 44px;

          border-radius: 14px;

          background: #eeedff;
          color: #4f46e5;

          display: grid;
          place-items: center;

          flex: none;
        }

        /* =====================================================
           CHIPS
        ===================================================== */

        .ok-chip {
          display: inline-flex;
          align-items: center;

          gap: 5px;

          padding: 5px 9px;

          border-radius: 999px;

          background: #f1f5f9;

          color: #64748b;

          border: 1px solid #e2e8f0;

          font-size: 10px;

          line-height: 1;

          font-weight: 700;
        }

        .ok-chip.success {
          background: #ecfdf5;
          color: #047857;
          border-color: #d1fae5;
        }

        .ok-chip.warn {
          background: #fef3c7;
          color: #92400e;
          border-color: #fde68a;
        }

        .ok-chip.danger {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }

        /* =====================================================
           GRID
        ===================================================== */

        .ok-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 12px;
        }

        /* =====================================================
           PROFILE HEADER
        ===================================================== */

        .ok-profile-header {
          display: flex;
          align-items: center;

          width: 100%;

          gap: 20px;

          padding: 26px 24px;

          margin-bottom: 28px;

          box-sizing: border-box;

          border-radius: 22px;

          background:
            linear-gradient(
              135deg,
              #ffffff 0%,
              #f8faff 100%
            );

          border: 1px solid #edf0f5;

          box-shadow:
            0 8px 28px rgba(15, 23, 42, 0.06);

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease;
        }

        .ok-profile-header:hover {
          transform: translateY(-1px);

          box-shadow:
            0 12px 34px rgba(15, 23, 42, 0.08);
        }

        /* =====================================================
           PROFILE IMAGE
        ===================================================== */

        .ok-profile-image-wrap {
          flex-shrink: 0;

          width: 92px;
          height: 92px;

          padding: 3px;

          display: flex;
          align-items: center;
          justify-content: center;

          box-sizing: border-box;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #6366f1,
              #8b5cf6,
              #3b82f6
            );

          box-shadow:
            0 8px 22px rgba(79, 70, 229, 0.18);
        }

        .ok-profile-image {
          display: block;

          width: 86px;
          height: 86px;

          max-width: 86px;
          max-height: 86px;

          object-fit: cover;
          object-position: center;

          border-radius: 50%;

          border: 4px solid #fff;

          box-sizing: border-box;
        }

        /* =====================================================
           PROFILE INFO
        ===================================================== */

        .ok-profile-info {
          min-width: 0;

          flex: 1;

          display: flex;

          flex-direction: column;

          justify-content: center;
        }

        .ok-profile-name-row {
          display: flex;

          align-items: center;

          flex-wrap: wrap;

          gap: 9px;

          margin-bottom: 6px;
        }

        .ok-profile-name-row h2 {
          margin: 0;

          color: #111827;

          font-size: 24px;

          line-height: 1.2;

          font-weight: 800;

          letter-spacing: -0.5px;
        }

        /* =====================================================
           EMAIL
        ===================================================== */

        .ok-profile-info .ok-muted {
          margin: 0;

          color: #64748b;

          font-size: 13px;

          font-weight: 500;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;
        }

        /* =====================================================
           PROFILE CHIPS
        ===================================================== */

        .ok-profile-chips {
          display: flex;

          align-items: center;

          gap: 7px;

          margin-top: 10px;

          flex-wrap: wrap;
        }

        /* =====================================================
           ACCOUNT SKELETON
        ===================================================== */

        .ok-skeleton-page {
          width: 100%;

          padding-top: 2px;

          animation: okSkeletonFadeIn 0.25s ease;
        }

        .ok-skeleton-profile {
          width: 100%;

          display: flex;

          align-items: center;

          gap: 18px;

          padding: 22px;

          box-sizing: border-box;

          border-radius: 22px;

          background: #fff;

          border: 1px solid #edf0f5;

          box-shadow:
            0 8px 28px rgba(15, 23, 42, 0.05);

          overflow: hidden;

          position: relative;
        }

        .ok-skeleton-profile::after,
        .ok-skeleton-card::after,
        .ok-skeleton-box::after {
          content: "";

          position: absolute;

          top: 0;
          bottom: 0;

          left: -60%;

          width: 45%;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,0.75),
              transparent
            );

          transform: skewX(-18deg);

          animation: okSkeletonShine 1.55s ease-in-out infinite;

          pointer-events: none;
        }

        .ok-skeleton-avatar {
          width: 78px;
          height: 78px;

          flex-shrink: 0;

          border-radius: 50%;

          background:
            linear-gradient(
              90deg,
              #edf0f5 25%,
              #f8fafc 50%,
              #edf0f5 75%
            );

          background-size: 200% 100%;

          animation: okSkeletonPulse 1.5s ease-in-out infinite;
        }

        .ok-skeleton-profile-info {
          flex: 1;

          min-width: 0;

          display: flex;

          flex-direction: column;

          gap: 10px;
        }

        .ok-skeleton-line {
          height: 12px;

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              #edf0f5 25%,
              #f8fafc 50%,
              #edf0f5 75%
            );

          background-size: 200% 100%;

          animation:
            okSkeletonPulse 1.5s ease-in-out infinite;
        }

        .ok-skeleton-name {
          width: 52%;

          height: 18px;
        }

        .ok-skeleton-email {
          width: 72%;
        }

        .ok-skeleton-chips {
          display: flex;

          gap: 7px;

          margin-top: 2px;
        }

        .ok-skeleton-chip {
          width: 68px;
          height: 22px;

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              #edf0f5 25%,
              #f8fafc 50%,
              #edf0f5 75%
            );

          background-size: 200% 100%;

          animation:
            okSkeletonPulse 1.5s ease-in-out infinite;
        }

        .ok-skeleton-chip.short {
          width: 52px;
        }

        .ok-skeleton-section-title {
          width: 115px;
          height: 13px;

          margin:
            26px
            4px
            10px;

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              #e7eaf0 25%,
              #f6f8fa 50%,
              #e7eaf0 75%
            );

          background-size: 200% 100%;

          animation:
            okSkeletonPulse 1.5s ease-in-out infinite;
        }

        .ok-skeleton-section-title.second {
          width: 95px;

          margin-top: 28px;
        }

        .ok-skeleton-card {
          position: relative;

          overflow: hidden;

          width: 100%;

          background: #fff;

          border:
            1px solid
            #e8e8ef;

          border-radius: 20px;

          box-shadow:
            0 2px 12px rgba(20,20,40,0.04);
        }

        .ok-skeleton-card-row {
          display: flex;

          align-items: center;

          gap: 13px;

          padding: 17px 16px;

          border-bottom:
            1px solid
            #f0f1f4;
        }

        .ok-skeleton-card-row:last-child {
          border-bottom: 0;
        }

        .ok-skeleton-circle {
          width: 44px;
          height: 44px;

          flex-shrink: 0;

          border-radius: 14px;

          background:
            linear-gradient(
              90deg,
              #edf0f5 25%,
              #f8fafc 50%,
              #edf0f5 75%
            );

          background-size: 200% 100%;

          animation:
            okSkeletonPulse 1.5s ease-in-out infinite;
        }

        .ok-skeleton-card-content {
          flex: 1;

          min-width: 0;

          display: flex;

          flex-direction: column;

          gap: 8px;
        }

        .ok-skeleton-line.medium {
          width: 58%;
        }

        .ok-skeleton-line.small {
          width: 78%;

          height: 9px;
        }

        .ok-skeleton-action {
          width: 58px;
          height: 28px;

          flex-shrink: 0;

          border-radius: 9px;

          background:
            linear-gradient(
              90deg,
              #edf0f5 25%,
              #f8fafc 50%,
              #edf0f5 75%
            );

          background-size: 200% 100%;

          animation:
            okSkeletonPulse 1.5s ease-in-out infinite;
        }

        .ok-skeleton-grid {
          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 12px;
        }

        .ok-skeleton-box {
          position: relative;

          overflow: hidden;

          height: 110px;

          border-radius: 18px;

          background:
            linear-gradient(
              90deg,
              #edf0f5 25%,
              #f8fafc 50%,
              #edf0f5 75%
            );

          background-size: 200% 100%;

          animation:
            okSkeletonPulse 1.5s ease-in-out infinite;
        }

        /* =====================================================
           ANIMATIONS
        ===================================================== */

        @keyframes okSkeletonPulse {
          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }
        }

        @keyframes okSkeletonShine {
          0% {
            left: -60%;
          }

          55%,
          100% {
            left: 125%;
          }
        }

        @keyframes okSkeletonFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {
          .ok-bar {
            height: 58px;

            padding:
              0
              10px;

            gap: 7px;
          }

          .ok-back,
          .ok-icon-btn {
            width: 40px;
            height: 40px;
          }

          .ok-title {
            font-size: 16px;
          }

          .ok-wrap {
            padding:
              72px
              12px
              0;
          }

          .ok-profile-header {
            gap: 15px;

            padding: 20px 16px;

            border-radius: 18px;
          }

          .ok-profile-image-wrap {
            width: 76px;
            height: 76px;
          }

          .ok-profile-image {
            width: 70px;
            height: 70px;

            max-width: 70px;
            max-height: 70px;
          }

          .ok-profile-name-row {
            gap: 6px;
          }

          .ok-profile-name-row h2 {
            font-size: 19px;
          }

          .ok-profile-info .ok-muted {
            font-size: 11px;
          }

          .ok-profile-chips {
            margin-top: 8px;
          }

          .ok-chip {
            padding: 4px 8px;

            font-size: 9px;
          }

          .ok-skeleton-profile {
            gap: 13px;

            padding: 18px 15px;

            border-radius: 18px;
          }

          .ok-skeleton-avatar {
            width: 68px;
            height: 68px;
          }

          .ok-skeleton-name {
            width: 62%;
          }

          .ok-skeleton-email {
            width: 82%;
          }

          .ok-skeleton-card {
            border-radius: 18px;
          }

          .ok-skeleton-card-row {
            padding: 15px 13px;
          }

          .ok-skeleton-grid {
            grid-template-columns: 1fr;
          }

          .ok-skeleton-box {
            height: 92px;
          }
        }

        @media (max-width: 420px) {
          .ok-grid {
            grid-template-columns: 1fr;
          }
        }

        /* =====================================================
           REDUCED MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {
          .ok-skeleton-avatar,
          .ok-skeleton-line,
          .ok-skeleton-chip,
          .ok-skeleton-section-title,
          .ok-skeleton-circle,
          .ok-skeleton-action,
          .ok-skeleton-box {
            animation: none;
          }

          .ok-skeleton-profile::after,
          .ok-skeleton-card::after,
          .ok-skeleton-box::after {
            display: none;
          }

          .ok-profile-header,
          .ok-btn,
          .ok-back,
          .ok-icon-btn {
            transition: none;
          }
        }
      `}</style>


      <div className="ok-page">

        <header className="ok-bar">
          <button
            type="button"
            className="ok-back"
            onClick={
              onBack ||
              (() => window.history.back())
            }
            aria-label="Back"
          >
            <FaArrowLeft size={15} />
          </button>

          <div className="ok-title">
            {title}
          </div>

          {!showSkeleton && right}
        </header>

        <main className="ok-wrap">
          {showSkeleton ? (
            <AccountSkeleton />
          ) : (
            children
          )}
        </main>

      </div>
    </>
  );
}

/* =========================================================
   AUTH HEADERS
========================================================= */

export function authHeaders(json = false) {
  const h = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  if (json) {
    h["Content-Type"] = "application/json";
  }

  return h;
}

/* =========================================================
   API HELPER
========================================================= */

export async function api(path, options = {}) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,

    headers: {
      ...authHeaders(
        options.body &&
        typeof options.body === "string"
      ),

      ...(options.headers || {}),
    },
  });

  let data = {};

  try {
    data = await res.json();
  } catch (error) {
    console.error(error);
  }

  if (!res.ok) {
    throw new Error(
      data.message || "Request failed"
    );
  }

  return data;
}