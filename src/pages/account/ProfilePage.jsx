import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaUser,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaHeart,
  FaBell,
  FaQuestionCircle,
  FaSignOutAlt,
  FaTrash,
  FaChevronRight,
  FaShieldAlt,
  FaTimes,
} from "react-icons/fa";

import { AccountShell, api } from "./AccountShell";
import { MdVerified } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Spinner from "../../components/Spinner";

export default function ProfilePage() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const token = localStorage.getItem("token");

  const {
    data: user = null,
    isLoading: loading,
    error: userError,
  } = useQuery({
    queryKey: ["currentUser", token],
    queryFn: async () => {
      const data = await api("/api/auth/me");

      if (!data?.success) {
        throw new Error(data?.message || "Failed to load profile");
      }

      return data.user;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const handleSignOut = () => {
    setSigningOut(true);

    // Remove authenticated query cache so another account on this
    // device cannot temporarily see the previous user's cached data.
    queryClient.removeQueries({
      queryKey: ["currentUser", token],
    });

    queryClient.removeQueries({
      queryKey: ["wishlist", token],
    });

    queryClient.removeQueries({
      queryKey: ["cart", token],
    });

    localStorage.removeItem("token");

    setTimeout(() => {
      navigate("/sign-in", { replace: true });
    }, 350);
  };

  if (loading) {
    return (
      <AccountShell title="Account">
        <div className="profile-loading">
          <Spinner />
        </div>
      </AccountShell>
    );
  }

  if (userError && !user) {
    return (
      <AccountShell title="Account">
        <div className="profile-loading">
          <div style={{ textAlign: "center", color: "#6b7280" }}>
            <p style={{ marginBottom: 10 }}>
              Unable to load your profile.
            </p>
            <button
              type="button"
              onClick={() => queryClient.invalidateQueries({
                queryKey: ["currentUser", token],
              })}
              style={{
                border: 0,
                borderRadius: 10,
                padding: "9px 14px",
                background: "#4f46e5",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </AccountShell>
    );
  }

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Odikart User";

  return (
    <AccountShell title="Account">
      <div className="profile-page">

        {/* =========================================
            PROFILE HEADER
        ========================================== */}
        <section className="ok-profile-header mt-18">
          <div className="ok-profile-image-wrap">
            <img
              className="ok-profile-image"
              src={user?.image || "https://i.pravatar.cc/200"}
              alt="Profile"
            />
          </div>

          <div className="ok-profile-info">
            <div className="ok-profile-name-row">
              <h2>{name}</h2>

              <span
                className="verified-badge"
                title="Verified account"
                aria-label="Verified account"
              >
                <MdVerified size={24} />
              </span>
            </div>

            <div className="ok-muted">
              {user?.email || "No email added"}
            </div>

            <div className="ok-profile-chips">
              <span className="ok-chip">Odikart member</span>
            </div>
          </div>
        </section>

        {/* =========================================
            ACCOUNT
        ========================================== */}
        <AccountSection title="Account">
          <Tile
            icon={<FaUser />}
            title="Personal information"
            sub="Name, phone number and photo"
            path="/account/personal-information"
            navigate={navigate}
          />

          <Tile
            icon={<FaMapMarkerAlt />}
            title="My addresses"
            sub="Manage delivery addresses"
            path="/account/addresses"
            navigate={navigate}
          />

          <Tile
            icon={<FaShoppingBag />}
            title="My orders"
            sub="View and track your purchases"
            path="/account/orders"
            navigate={navigate}
          />

          <Tile
            icon={<FaHeart />}
            title="Wishlist"
            sub="Products you saved"
            path="/account/wishlist"
            navigate={navigate}
          />
        </AccountSection>

        {/* =========================================
            PREFERENCES
        ========================================== */}
        <AccountSection title="Preferences">
          <Tile
            icon={<FaBell />}
            title="Notifications"
            sub="Manage alerts and offers"
            path="/account/notifications"
            navigate={navigate}
          />

          <Tile
            icon={<FaQuestionCircle />}
            title="Help & support"
            sub="Get help with Odikart"
            path="/account/help"
            navigate={navigate}
          />

          <Tile
            icon={<FaQuestionCircle />}
            title="Terms & privacy"
            sub="Policies and legal information"
            path="/account/legal"
            navigate={navigate}
          />
        </AccountSection>

        {/* =========================================
            ACCOUNT ACTIONS
        ========================================== */}
        <AccountSection title="Account actions" extraClass="account-actions-section">
          <Tile
            icon={<FaSignOutAlt />}
            title="Sign out"
            sub="Sign back in anytime"
            onClick={() => setShowSignOutModal(true)}
            navigate={navigate}
          />

          <Tile
            danger
            icon={<FaTrash />}
            title="Delete account"
            sub="Permanently remove your account"
            path="/account/delete"
            navigate={navigate}
          />
        </AccountSection>
      </div>

      {/* =========================================
          SIGN OUT MODAL
      ========================================== */}
      {showSignOutModal && (
        <div
          className="signout-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !signingOut) {
              setShowSignOutModal(false);
            }
          }}
        >
          <div
            className="signout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
          >
            {/* Close */}
            <button
              type="button"
              className="signout-close"
              onClick={() => setShowSignOutModal(false)}
              disabled={signingOut}
              aria-label="Close sign out dialog"
            >
              <FaTimes size={14} />
            </button>

            {/* Icon */}
            <div className="signout-icon">
              <FaSignOutAlt size={22} />
            </div>

            {/* Content */}
            <div className="signout-content">
              <span className="signout-eyebrow">
                ACCOUNT ACTION
              </span>

              <h3 id="signout-title">
                Sign out of your account?
              </h3>

              <p>
                You will be signed out of this device. You can sign
                back in anytime using your account credentials.
              </p>
            </div>

            {/* Security note */}
            <div className="signout-security">
              <div className="signout-security-icon">
                <FaShieldAlt size={13} />
              </div>

              <span>
                Your account data will remain safe and available
                when you sign back in.
              </span>
            </div>

            {/* Actions */}
            <div className="signout-actions">
              <button
                type="button"
                className="signout-cancel"
                onClick={() => setShowSignOutModal(false)}
                disabled={signingOut}
              >
                Cancel
              </button>

              <button
                type="button"
                className="signout-confirm"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? (
                  <>
                    <span className="signout-spinner" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <FaSignOutAlt size={14} />
                    Sign out
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          STYLES
      ========================================== */}
      <style>{`
        /* =========================================
           PAGE
        ========================================== */

        .profile-page {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 6px 0 70px;
          box-sizing: border-box;
        }

        .profile-loading {
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* =========================================
           PROFILE HEADER
        ========================================== */

        .ok-profile-header {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 18px;
          padding: 20px 0 24px;
          border-bottom: 1px solid #edf0f5;
        }

        .ok-profile-image-wrap {
          width: 76px;
          height: 76px;
          padding: 3px;
          flex-shrink: 0;
          border-radius: 50%;
          background: linear-gradient(
            135deg,
            #6366f1,
            #8b5cf6,
            #a855f7
          );
        }

        .ok-profile-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: 50%;
          border: 3px solid #fff;
          box-sizing: border-box;
          background: #f8fafc;
        }

        .ok-profile-info {
          min-width: 0;
          flex: 1;
        }

        .ok-profile-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .ok-profile-name-row h2 {
          margin: 0;
          font-size: 23px;
          line-height: 1.2;
          font-weight: 750;
          letter-spacing: -0.02em;
          color: #111827;
        }

        .verified-badge {
          width: 25px;
          height: 25px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #4f46e5;
        }

        .ok-muted {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .ok-profile-chips {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 8px;
        }

        .ok-chip {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          background: #f4f3ff;
          color: #5146a5;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        /* =========================================
           SECTIONS
        ========================================== */

        .ok-section {
          margin-top: 24px;
          width: 100%;
        }

        .account-actions-section {
          margin-top: 38px;
          padding-top: 4px;
          border-top: 1px solid #edf0f5;
        }

        .ok-label {
          margin-bottom: 10px;
          font-size: 11px;
          font-weight: 800;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.09em;
        }

        .ok-card.ok-list {
          width: 100%;
          overflow: hidden;
          border: 1px solid #e8ebf0;
          border-radius: 16px;
          background: #fff;
          box-shadow:
            0 2px 8px rgba(15, 23, 42, 0.03),
            0 8px 24px rgba(15, 23, 42, 0.035);
        }

        /* =========================================
           TILE
        ========================================== */

        .ok-list-item {
          position: relative;
          width: 100%;
          min-height: 72px;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 16px;
          text-align: left;
          border: 0;
          border-bottom: 1px solid #eef0f4;
          background: #fff;
          color: #111827;
          cursor: pointer;
          font-family: inherit;
          transition:
            background 0.18s ease,
            transform 0.18s ease;
          box-sizing: border-box;
        }

        .ok-list-item:last-child {
          border-bottom: 0;
        }

        .ok-list-item:hover {
          background: #fafbff;
        }

        .ok-list-item:active {
          transform: scale(0.995);
        }

        .ok-list-item:focus-visible {
          outline: 3px solid rgba(99, 102, 241, 0.18);
          outline-offset: -3px;
        }

        .ok-circle {
          width: 40px;
          height: 40px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 12px;
          background: #f3f4ff;
          color: #4f46e5;
          font-size: 15px;
          transition:
            transform 0.18s ease,
            background 0.18s ease;
        }

        .ok-list-item:hover .ok-circle {
          transform: translateY(-1px);
          background: #ebe9ff;
        }

        .ok-grow {
          min-width: 0;
          flex: 1;
        }

        .ok-grow b {
          display: block;
          margin-bottom: 3px;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 700;
          color: #171923;
        }

        .ok-small {
          font-size: 11.5px;
          line-height: 1.4;
          color: #8a909c;
        }

        .ok-list-item > svg {
          flex-shrink: 0;
          transition: transform 0.18s ease;
        }

        .ok-list-item:hover > svg {
          transform: translateX(2px);
        }

        /* =========================================
           SIGN OUT OVERLAY
        ========================================== */

        .signout-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(15, 23, 42, 0.52);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: signoutFadeIn 0.2s ease-out;
          box-sizing: border-box;
        }

        /* =========================================
           SIGN OUT MODAL
        ========================================== */

        .signout-modal {
          position: relative;
          width: min(100%, 440px);
          padding: 28px;
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.98);
          box-shadow:
            0 25px 60px rgba(15, 23, 42, 0.18),
            0 8px 24px rgba(15, 23, 42, 0.08);
          animation: signoutModalIn 0.24s cubic-bezier(.2,.8,.2,1);
          box-sizing: border-box;
        }

        .signout-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid #e8eaf0;
          border-radius: 10px;
          background: #f8f9fb;
          color: #7a8190;
          cursor: pointer;
          transition:
            background 0.18s ease,
            color 0.18s ease,
            transform 0.18s ease;
        }

        .signout-close:hover:not(:disabled) {
          background: #eef0f5;
          color: #111827;
          transform: rotate(4deg);
        }

        .signout-close:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .signout-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin-bottom: 18px;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            #eef2ff,
            #e0e7ff
          );
          color: #4f46e5;
          box-shadow:
            inset 0 0 0 1px rgba(99, 102, 241, 0.08);
        }

        .signout-content {
          padding-right: 28px;
        }

        .signout-eyebrow {
          display: block;
          margin-bottom: 6px;
          color: #6366f1;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
        }

        .signout-content h3 {
          margin: 0 0 8px;
          color: #111827;
          font-size: 20px;
          line-height: 1.25;
          font-weight: 750;
          letter-spacing: -0.02em;
        }

        .signout-content p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.65;
        }

        /* =========================================
           SECURITY NOTE
        ========================================== */

        .signout-security {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 20px;
          padding: 12px 13px;
          border: 1px solid #e8eaff;
          border-radius: 13px;
          background: #f8f8ff;
          color: #62697a;
          font-size: 11px;
          line-height: 1.5;
        }

        .signout-security-icon {
          width: 25px;
          height: 25px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 8px;
          background: #e9e7ff;
          color: #5146a5;
        }

        /* =========================================
           MODAL ACTIONS
        ========================================== */

        .signout-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 22px;
        }

        .signout-cancel,
        .signout-confirm {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;
          box-sizing: border-box;
        }

        .signout-cancel {
          border: 1px solid #e2e5eb;
          background: #fff;
          color: #374151;
        }

        .signout-cancel:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #d6dae2;
        }

        .signout-confirm {
          border: 0;
          background: linear-gradient(
            135deg,
            #4f46e5,
            #6366f1
          );
          color: #fff;
          box-shadow:
            0 7px 18px rgba(79, 70, 229, 0.22);
        }

        .signout-confirm:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 10px 24px rgba(79, 70, 229, 0.28);
        }

        .signout-cancel:active:not(:disabled),
        .signout-confirm:active:not(:disabled) {
          transform: translateY(0);
        }

        .signout-cancel:disabled,
        .signout-confirm:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        .signout-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: signoutSpin 0.7s linear infinite;
        }

        /* =========================================
           ANIMATIONS
        ========================================== */

        @keyframes signoutFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes signoutModalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes signoutSpin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =========================================
           MOBILE
        ========================================== */

        @media (max-width: 700px) {
          .profile-page {
            padding: 2px 0 70px;
          }

          .ok-profile-header {
            padding: 16px 12px 20px;
            gap: 13px;
          }

          .ok-profile-image-wrap {
            width: 62px;
            height: 62px;
          }

          .ok-profile-name-row h2 {
            font-size: 19px;
          }

          .verified-badge {
            width: 21px;
            height: 21px;
          }

          .ok-muted {
            font-size: 12px;
          }

          .ok-section {
            margin-top: 20px;
            padding: 0 12px;
            box-sizing: border-box;
          }

          .account-actions-section {
            margin-top: 32px;
            padding-top: 18px;
          }

          .ok-label {
            margin-bottom: 8px;
            font-size: 10px;
          }

          .ok-card.ok-list {
            border-radius: 14px;
          }

          .ok-list-item {
            min-height: 66px;
            padding: 11px 13px;
            gap: 11px;
          }

          .ok-circle {
            width: 37px;
            height: 37px;
            border-radius: 11px;
            font-size: 14px;
          }

          .ok-grow b {
            font-size: 12.5px;
          }

          .ok-small {
            font-size: 10.5px;
          }

          .signout-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .signout-modal {
            width: 100%;
            padding: 24px 18px 20px;
            border-radius: 24px 24px 0 0;
            border-bottom: 0;
            animation: signoutSheetIn 0.25s cubic-bezier(.2,.8,.2,1);
          }

          .signout-icon {
            width: 50px;
            height: 50px;
            margin-bottom: 15px;
          }

          .signout-content {
            padding-right: 34px;
          }

          .signout-content h3 {
            font-size: 18px;
          }

          .signout-content p {
            font-size: 12px;
          }

          .signout-security {
            margin-top: 16px;
            font-size: 10.5px;
          }

          .signout-actions {
            margin-top: 18px;
          }

          .signout-cancel,
          .signout-confirm {
            min-height: 44px;
            font-size: 12px;
          }
        }

        @keyframes signoutSheetIn {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .signout-overlay,
          .signout-modal,
          .signout-spinner,
          .ok-list-item,
          .ok-circle,
          .ok-list-item > svg,
          .signout-confirm,
          .signout-cancel {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </AccountShell>
  );
}

/* =====================================================
   ACCOUNT SECTION
===================================================== */

function AccountSection({ title, children, extraClass = "" }) {
  return (
    <section className={`ok-section ${extraClass}`}>
      <div className="ok-label">{title}</div>

      <div className="ok-card ok-list">
        {children}
      </div>
    </section>
  );
}

/* =====================================================
   TILE
===================================================== */

function Tile({
  icon,
  title,
  sub,
  path,
  onClick,
  navigate,
  danger,
}) {
  return (
    <button
      type="button"
      className="ok-list-item"
      onClick={
        onClick ||
        (() => {
          if (path) navigate(path);
        })
      }
      aria-label={title}
    >
      <div
        className="ok-circle"
        style={
          danger
            ? {
                background: "#fff1f2",
                color: "#dc2626",
              }
            : undefined
        }
      >
        {icon}
      </div>

      <div className="ok-grow">
        <b>{title}</b>

        <div className="ok-small">
          {sub}
        </div>
      </div>

      <FaChevronRight
        size={11}
        color="#9ca3af"
      />
    </button>
  );
}