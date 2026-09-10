import React, { useState } from "react";
import {
  FaTrash,
  FaExclamationTriangle,
  FaShieldAlt,
  FaChevronLeft,
  FaCheckCircle,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { api, AccountShell } from "./AccountShell";

export default function DeleteAccountPage() {
  const [loading, setLoading] = useState(false);

  const del = async () => {
    const confirmed = window.confirm(
      "Delete your Odikart account permanently? This cannot be undone."
    );

    if (!confirmed) return;

    setLoading(true);

    try {
      const data = await api("/api/auth/delete-account", {
        method: "DELETE",
      });

      if (!data?.success) {
        throw new Error(data?.message || "Delete failed");
      }

      localStorage.removeItem("token");

      toast.success("Account deleted successfully");

      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 500);
    } catch (error) {
      toast.error(error?.message || "Unable to delete account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountShell title="Delete account">
      <div className="delete-page">
        {/* =================================================
            HEADER
        ================================================= */}

        {/* =================================================
            MAIN DANGER AREA
        ================================================= */}

        <div className="delete-content mt-12">
          <section className="delete-card">
            {/* ICON */}

            <div className="delete-icon-wrap">
              <div className="delete-icon">
                <FaTrash />
              </div>
            </div>

            <span className="delete-danger-label">
              PERMANENT ACTION
            </span>

            <h2>Delete your account?</h2>

            <p className="delete-description">
              This will permanently remove your Odikart account
              and personal data. Once your account is deleted,
              this action cannot be undone.
            </p>

            {/* =================================================
                WARNING
            ================================================= */}

            <div className="delete-warning">
              <div className="delete-warning-icon">
                <FaExclamationTriangle />
              </div>

              <div>
                <strong>Before you continue</strong>

                <p>
                  Make sure you no longer need access to your
                  account, order history, saved addresses, or
                  other account information.
                </p>
              </div>
            </div>

            {/* =================================================
                WHAT WILL BE REMOVED
            ================================================= */}

            <div className="delete-info">
              <h3>What happens when you delete your account?</h3>

              <div className="delete-info-list">
                <div className="delete-info-item">
                  <FaCheckCircle />
                  <span>Your account access will be removed.</span>
                </div>

                <div className="delete-info-item">
                  <FaCheckCircle />
                  <span>
                    Your personal account information will be
                    removed.
                  </span>
                </div>

                <div className="delete-info-item">
                  <FaCheckCircle />
                  <span>
                    You will be signed out from this account.
                  </span>
                </div>

                <div className="delete-info-item">
                  <FaCheckCircle />
                  <span>
                    You will not be able to recover the account
                    after deletion.
                  </span>
                </div>
              </div>
            </div>

            {/* =================================================
                ACTIONS
            ================================================= */}

            <div className="delete-actions">
              <button
                type="button"
                className="delete-keep-btn"
                onClick={() => window.history.back()}
                disabled={loading}
              >
                <FaChevronLeft />
                Keep my account
              </button>

              <button
                type="button"
                className="delete-confirm-btn"
                onClick={del}
                disabled={loading}
              >
                <FaTrash />

                {loading ? (
                  <>
                    <span className="delete-spinner" />
                    Deleting account...
                  </>
                ) : (
                  "Delete account permanently"
                )}
              </button>
            </div>

            <div className="delete-footer">
              <FaShieldAlt />

              <span>
                This is a permanent account action. Please
                make sure you are certain before continuing.
              </span>
            </div>
          </section>
        </div>
      </div>

      <style>{`
        /* =====================================================
           PAGE
        ===================================================== */

        .delete-page {
          width: 100%;
          max-width: none;
          min-height: calc(100vh - 80px);
          margin: 0;
          padding: 18px 24px 70px;
          box-sizing: border-box;
          color: #181827;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(239, 68, 68, 0.035),
              transparent 30%
            );
        }

        .delete-page *,
        .delete-page *::before,
        .delete-page *::after {
          box-sizing: border-box;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .delete-header {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          width: 100%;
          padding-bottom: 22px;
          border-bottom: 1px solid #ececf2;
        }

        .delete-back {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-height: 40px;
          padding: 0 13px;
          border: 1px solid #e8e8ef;
          border-radius: 11px;
          background: #fff;
          color: #55556d;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .delete-back:hover {
          transform: translateX(-2px);
          border-color: #d9d8e8;
          box-shadow: 0 5px 14px rgba(30, 30, 60, 0.06);
        }

        .delete-back svg {
          font-size: 10px;
        }

        .delete-header-copy {
          min-width: 0;
        }

        .delete-eyebrow {
          display: block;
          margin-bottom: 4px;
          color: #dc2626;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .delete-header h1 {
          margin: 0;
          color: #20202f;
          font-size: clamp(21px, 2.7vw, 27px);
          line-height: 1.2;
          font-weight: 850;
          letter-spacing: -0.4px;
        }

        .delete-header-copy p {
          max-width: 700px;
          margin: 5px 0 0;
          color: #858596;
          font-size: 12px;
          line-height: 1.5;
        }

        .delete-security-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border: 1px solid #dcfce7;
          border-radius: 999px;
          background: #f0fdf4;
          color: #15803d;
          font-size: 10px;
          font-weight: 800;
          white-space: nowrap;
        }

        .delete-security-badge svg {
          font-size: 11px;
        }

        /* =====================================================
           CONTENT
        ===================================================== */

        .delete-content {
          display: flex;
          justify-content: center;
          width: 100%;
          padding-top: 30px;
        }

        .delete-card {
          position: relative;
          width: 100%;
          max-width: 760px;
          padding: 30px;
          border: 1px solid rgba(220, 38, 38, 0.13);
          border-radius: 24px;
          background:
            radial-gradient(
              circle at 100% 0%,
              rgba(239, 68, 68, 0.055),
              transparent 30%
            ),
            #fff;
          box-shadow:
            0 12px 40px rgba(40, 35, 70, 0.07);
          text-align: center;
        }

        /* =====================================================
           DELETE ICON
        ===================================================== */

        .delete-icon-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 14px;
        }

        .delete-icon {
          width: 66px;
          height: 66px;
          display: grid;
          place-items: center;
          border: 8px solid #fff1f2;
          border-radius: 50%;
          background: #fee2e2;
          color: #dc2626;
          font-size: 21px;
          box-shadow:
            0 8px 22px rgba(220, 38, 38, 0.13);
        }

        .delete-danger-label {
          display: block;
          color: #dc2626;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1.3px;
        }

        .delete-card h2 {
          margin: 5px 0 7px;
          color: #20202f;
          font-size: 23px;
          line-height: 1.25;
          font-weight: 850;
          letter-spacing: -0.3px;
        }

        .delete-description {
          max-width: 590px;
          margin: 0 auto;
          color: #77778a;
          font-size: 12px;
          line-height: 1.65;
        }

        /* =====================================================
           WARNING
        ===================================================== */

        .delete-warning {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-top: 22px;
          padding: 15px;
          border: 1px solid #fed7aa;
          border-radius: 15px;
          background:
            linear-gradient(
              135deg,
              #fff7ed,
              #fffbeb
            );
          text-align: left;
        }

        .delete-warning-icon {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #ffedd5;
          color: #ea580c;
          font-size: 14px;
        }

        .delete-warning strong {
          display: block;
          color: #9a3412;
          font-size: 12px;
          font-weight: 850;
        }

        .delete-warning p {
          margin: 4px 0 0;
          color: #9a6a49;
          font-size: 11px;
          line-height: 1.55;
        }

        /* =====================================================
           INFORMATION
        ===================================================== */

        .delete-info {
          margin-top: 18px;
          padding: 17px;
          border: 1px solid #ecebf3;
          border-radius: 15px;
          background: #fafaff;
          text-align: left;
        }

        .delete-info h3 {
          margin: 0 0 11px;
          color: #303044;
          font-size: 13px;
          font-weight: 850;
        }

        .delete-info-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
        }

        .delete-info-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          min-width: 0;
          color: #717184;
          font-size: 11px;
          line-height: 1.5;
        }

        .delete-info-item svg {
          flex: 0 0 auto;
          margin-top: 2px;
          color: #16a34a;
          font-size: 11px;
        }

        /* =====================================================
           ACTIONS
        ===================================================== */

        .delete-actions {
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          gap: 10px;
          margin-top: 22px;
        }

        .delete-keep-btn,
        .delete-confirm-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 46px;
          padding: 0 15px;
          border-radius: 12px;
          font-family: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            border-color 0.2s ease,
            background 0.2s ease;
        }

        .delete-keep-btn {
          border: 1px solid #e3e2eb;
          background: #fff;
          color: #505064;
        }

        .delete-keep-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          border-color: #d3d1df;
          box-shadow:
            0 7px 18px rgba(40, 40, 70, 0.07);
        }

        .delete-keep-btn svg {
          font-size: 10px;
        }

        .delete-confirm-btn {
          border: 1px solid #dc2626;
          background:
            linear-gradient(
              135deg,
              #dc2626,
              #b91c1c
            );
          color: #fff;
          box-shadow:
            0 8px 20px rgba(220, 38, 38, 0.18);
        }

        .delete-confirm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            0 11px 25px rgba(220, 38, 38, 0.25);
        }

        .delete-confirm-btn:active:not(:disabled) {
          transform: scale(0.985);
        }

        .delete-keep-btn:disabled,
        .delete-confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .delete-confirm-btn svg {
          font-size: 11px;
        }

        /* =====================================================
           LOADING
        ===================================================== */

        .delete-spinner {
          width: 13px;
          height: 13px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: delete-spin 0.7s linear infinite;
        }

        @keyframes delete-spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =====================================================
           FOOTER
        ===================================================== */

        .delete-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          margin-top: 15px;
          color: #9a9aaa;
          font-size: 10px;
          line-height: 1.4;
        }

        .delete-footer svg {
          flex: 0 0 auto;
          color: #818cf8;
          font-size: 10px;
        }

        /* =====================================================
           TABLET
        ===================================================== */

        @media (max-width: 800px) {
          .delete-page {
            padding-left: 16px;
            padding-right: 16px;
          }

          .delete-info-list {
            grid-template-columns: 1fr;
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 600px) {
          .delete-page {
            width: 100%;
            min-height: calc(100vh - 60px);
            padding: 8px 0 85px;
            overflow-x: hidden;
          }

          .delete-header {
            grid-template-columns: auto minmax(0, 1fr);
            gap: 11px;
            padding: 0 12px 18px;
          }

          .delete-back {
            width: 38px;
            height: 38px;
            min-height: 38px;
            padding: 0;
            border-radius: 11px;
          }

          .delete-back span {
            display: none;
          }

          .delete-header h1 {
            font-size: 20px;
          }

          .delete-header-copy p {
            font-size: 10px;
          }

          .delete-security-badge {
            display: none;
          }

          .delete-content {
            padding-top: 18px;
          }

          .delete-card {
            max-width: none;
            padding: 24px 14px;
            border-left: 0;
            border-right: 0;
            border-radius: 0;
            box-shadow: none;
          }

          .delete-icon {
            width: 58px;
            height: 58px;
            border-width: 7px;
            font-size: 18px;
          }

          .delete-danger-label {
            font-size: 8px;
          }

          .delete-card h2 {
            font-size: 20px;
          }

          .delete-description {
            font-size: 11px;
            line-height: 1.6;
          }

          .delete-warning {
            margin-top: 19px;
            padding: 13px;
            border-radius: 13px;
          }

          .delete-warning-icon {
            width: 31px;
            height: 31px;
            flex-basis: 31px;
            border-radius: 9px;
            font-size: 12px;
          }

          .delete-warning strong {
            font-size: 11px;
          }

          .delete-warning p {
            font-size: 10px;
          }

          .delete-info {
            margin-top: 12px;
            padding: 14px;
            border-radius: 13px;
          }

          .delete-info h3 {
            font-size: 12px;
          }

          .delete-info-list {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .delete-info-item {
            font-size: 10px;
          }

          .delete-actions {
            grid-template-columns: 1fr;
            gap: 8px;
            margin-top: 19px;
          }

          .delete-keep-btn,
          .delete-confirm-btn {
            width: 100%;
            min-height: 44px;
            font-size: 11px;
          }

          .delete-confirm-btn {
            order: 2;
          }

          .delete-keep-btn {
            order: 1;
          }

          .delete-footer {
            padding: 0 8px;
            font-size: 9px;
          }
        }

        /* =====================================================
           REDUCED MOTION
        ===================================================== */

        @media (prefers-reduced-motion: reduce) {
          .delete-page *,
          .delete-page *::before,
          .delete-page *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </AccountShell>
  );
}