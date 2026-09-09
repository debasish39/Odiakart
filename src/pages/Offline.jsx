import { useEffect, useState } from "react";
import {
  WifiOff,
  RefreshCw,
  Smartphone,
  Router,
  Wifi,
  Signal,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";

const Offline = () => {
  const [checking, setChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : false
  );

  /* =====================================================
     LIVE CONNECTION STATUS
  ===================================================== */

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      // Give the browser a moment before reloading.
      setTimeout(() => {
        window.location.reload();
      }, 700);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /* =====================================================
     RETRY CONNECTION
  ===================================================== */

  const handleRetry = async () => {
    if (checking) return;

    setChecking(true);

    // Small delay makes the interaction feel intentional.
    await new Promise((resolve) => setTimeout(resolve, 1200));

    if (navigator.onLine) {
      setIsOnline(true);

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else {
      setIsOnline(false);
      setChecking(false);
    }
  };

  return (
    <div className="offline-page">
      <style>{`
        /* =================================================
           RESET
        ================================================= */

        .offline-page,
        .offline-page * {
          box-sizing: border-box;
        }

        .offline-page {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          overflow: hidden;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 28px;

          color: #111827;

          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;

          background:
            radial-gradient(
              circle at 15% 15%,
              rgba(99, 102, 241, 0.13),
              transparent 28%
            ),
            radial-gradient(
              circle at 85% 80%,
              rgba(59, 130, 246, 0.13),
              transparent 30%
            ),
            linear-gradient(
              135deg,
              #f8fafc 0%,
              #eef2ff 48%,
              #f8fafc 100%
            );
        }

        /* =================================================
           BACKGROUND GRID
        ================================================= */

        .offline-grid {
          position: absolute;
          inset: 0;

          background-image:
            linear-gradient(
              rgba(99, 102, 241, 0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(99, 102, 241, 0.035) 1px,
              transparent 1px
            );

          background-size: 42px 42px;

          mask-image: linear-gradient(
            to bottom,
            black,
            transparent 90%
          );

          pointer-events: none;
        }

        /* =================================================
           FLOATING BLOBS
        ================================================= */

        .offline-glow {
          position: absolute;
          border-radius: 999px;
          pointer-events: none;
          filter: blur(80px);
        }

        .offline-glow-one {
          width: 330px;
          height: 330px;

          left: -150px;
          top: -120px;

          background: rgba(99, 102, 241, 0.16);

          animation: driftOne 10s ease-in-out infinite;
        }

        .offline-glow-two {
          width: 350px;
          height: 350px;

          right: -160px;
          bottom: -130px;

          background: rgba(59, 130, 246, 0.14);

          animation: driftTwo 12s ease-in-out infinite;
        }

        @keyframes driftOne {
          0%,
          100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(35px, 25px);
          }
        }

        @keyframes driftTwo {
          0%,
          100% {
            transform: translate(0, 0);
          }

          50% {
            transform: translate(-25px, -30px);
          }
        }

        /* =================================================
           MAIN CONTAINER
        ================================================= */

        .offline-container {
          position: relative;
          z-index: 10;

          width: min(1050px, 100%);

          display: grid;
          grid-template-columns: 0.95fr 1.05fr;

          min-height: 600px;

          overflow: hidden;

          border: 1px solid rgba(255, 255, 255, 0.85);
          border-radius: 34px;

          background: rgba(255, 255, 255, 0.68);

          box-shadow:
            0 35px 100px rgba(30, 41, 59, 0.12),
            0 10px 30px rgba(30, 41, 59, 0.06);

          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }

        /* =================================================
           LEFT VISUAL
        ================================================= */

        .offline-visual {
          position: relative;

          display: flex;
          align-items: center;
          justify-content: center;

          min-height: 600px;

          overflow: hidden;

          color: white;

          background:
            radial-gradient(
              circle at 75% 20%,
              rgba(129, 140, 248, 0.35),
              transparent 28%
            ),
            radial-gradient(
              circle at 20% 85%,
              rgba(96, 165, 250, 0.24),
              transparent 30%
            ),
            linear-gradient(
              145deg,
              #111827 0%,
              #1e1b4b 45%,
              #312e81 100%
            );
        }

        .visual-content {
          position: relative;
          z-index: 5;

          width: min(370px, 80%);

          text-align: center;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          justify-content: center;

          padding: 1px 1px;

          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 14px;

          background: gray;

          backdrop-filter: blur(14px);
        }

        .brand img {
          width: auto;
          max-width: 145px;
          max-height: 38px;

          object-fit: contain;
        }

        /* =================================================
           SIGNAL VISUAL
        ================================================= */

        .signal-stage {
          position: relative;

          width: 230px;
          height: 230px;

          margin: 48px auto 30px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .signal-ring {
          position: absolute;

          width: 100%;
          height: 100%;

          border: 1px solid rgba(255, 255, 255, 0.11);
          border-radius: 50%;

          animation: signalPulse 3.5s ease-out infinite;
        }

        .signal-ring:nth-child(2) {
          width: 75%;
          height: 75%;

          animation-delay: 0.8s;
        }

        .signal-ring:nth-child(3) {
          width: 50%;
          height: 50%;

          animation-delay: 1.6s;
        }

        @keyframes signalPulse {
          0% {
            opacity: 0.7;
            transform: scale(0.82);
          }

          70% {
            opacity: 0.12;
            transform: scale(1);
          }

          100% {
            opacity: 0;
            transform: scale(1.08);
          }
        }

        .signal-core {
          position: relative;
          z-index: 5;

          width: 100px;
          height: 100px;

          display: flex;
          align-items: center;
          justify-content: center;

          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 30px;

          background:
            linear-gradient(
              145deg,
              rgba(255, 255, 255, 0.15),
              rgba(255, 255, 255, 0.05)
            );

          box-shadow:
            0 25px 55px rgba(0, 0, 0, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.16);

          backdrop-filter: blur(20px);

          animation: coreFloat 4s ease-in-out infinite;
        }

        .signal-core svg {
          width: 44px;
          height: 44px;

          color: #c7d2fe;
        }

        @keyframes coreFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-8px);
          }
        }

        .visual-title {
          margin: 0;

          font-size: 26px;
          line-height: 1.15;
          font-weight: 850;

          letter-spacing: -0.04em;
        }

        .visual-description {
          margin: 12px auto 0;

          max-width: 330px;

          color: rgba(255, 255, 255, 0.62);

          font-size: 12px;
          line-height: 1.7;
        }

        /* =================================================
           FLOATING CARDS
        ================================================= */

        .floating-card {
          position: absolute;

          z-index: 3;

          display: flex;
          align-items: center;
          gap: 8px;

          padding: 9px 12px;

          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 12px;

          color: rgba(255, 255, 255, 0.8);

          background: rgba(255, 255, 255, 0.07);

          font-size: 9px;
          font-weight: 750;

          backdrop-filter: blur(14px);

          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);

          animation: cardFloat 5s ease-in-out infinite;
        }

        .floating-card svg {
          width: 13px;
          height: 13px;
          color: #c7d2fe;
        }

        .floating-one {
          top: 24%;
          left: 10%;
        }

        .floating-two {
          top: 35%;
          right: 8%;
          animation-delay: 1s;
        }

        .floating-three {
          bottom: 23%;
          left: 13%;
          animation-delay: 2s;
        }

        @keyframes cardFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-9px);
          }
        }

        /* =================================================
           RIGHT CONTENT
        ================================================= */

        .offline-content {
          display: flex;
          align-items: center;
          justify-content: center;

          padding: 55px;
        }

        .content-inner {
          width: min(420px, 100%);
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;

          padding: 7px 11px;

          border: 1px solid #fee2e2;
          border-radius: 999px;

          color: #dc2626;

          background: #fff7f7;

          font-size: 10px;
          font-weight: 800;

          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .status-dot {
          width: 7px;
          height: 7px;

          border-radius: 50%;

          background: #ef4444;

          box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.08);

          animation: statusPulse 1.7s ease-in-out infinite;
        }

        @keyframes statusPulse {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.35;
          }
        }

        .status.online {
          border-color: #dcfce7;
          color: #15803d;
          background: #f0fdf4;
        }

        .status.online .status-dot {
          background: #22c55e;
        }

        .content-title {
          margin: 19px 0 0;

          color: #111827;

          font-size: clamp(38px, 5vw, 54px);
          line-height: 1;
          font-weight: 900;

          letter-spacing: -0.065em;
        }

        .content-title span {
          display: block;

          background: linear-gradient(
            90deg,
            #312e81,
            #4f46e5,
            #7c3aed
          );

          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .content-description {
          margin: 19px 0 0;

          max-width: 400px;

          color: #64748b;

          font-size: 14px;
          line-height: 1.75;
        }

        /* =================================================
           CONNECTION CHECK
        ================================================= */

        .connection-box {
          display: flex;
          align-items: center;
          gap: 13px;

          margin-top: 28px;
          padding: 14px;

          border: 1px solid #e5e7eb;
          border-radius: 15px;

          background: rgba(248, 250, 252, 0.8);
        }

        .connection-icon {
          width: 38px;
          height: 38px;

          flex: 0 0 38px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 11px;

          color: #4f46e5;

          background: #eef2ff;
        }

        .connection-copy {
          min-width: 0;

          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .connection-copy strong {
          color: #1e293b;

          font-size: 11px;
          font-weight: 850;
        }

        .connection-copy span {
          color: #94a3b8;

          font-size: 10px;
          line-height: 1.45;
        }

        /* =================================================
           RETRY BUTTON
        ================================================= */

        .retry-button {
          position: relative;

          width: 100%;
          height: 54px;

          margin-top: 15px;

          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;

          overflow: hidden;

          border: 0;
          border-radius: 15px;

          color: white;

          background:
            linear-gradient(
              135deg,
              #4338ca,
              #4f46e5,
              #7c3aed
            );

          box-shadow:
            0 16px 30px rgba(79, 70, 229, 0.23);

          font-size: 12px;
          font-weight: 850;

          cursor: pointer;

          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .retry-button::before {
          content: "";

          position: absolute;

          top: 0;
          left: -120%;

          width: 70%;
          height: 100%;

          transform: skewX(-18deg);

          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.18),
            transparent
          );

          transition: left 0.7s ease;
        }

        .retry-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 20px 38px rgba(79, 70, 229, 0.3);
        }

        .retry-button:hover:not(:disabled)::before {
          left: 130%;
        }

        .retry-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .retry-button:disabled {
          opacity: 0.72;
          cursor: not-allowed;
        }

        .retry-icon {
          width: 15px;
          height: 15px;
        }

        .retry-icon.spin {
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* =================================================
           TIPS
        ================================================= */

        .tips-title {
          margin: 25px 0 11px;

          color: #475569;

          font-size: 10px;
          font-weight: 850;

          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .tips {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .tip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;

          min-height: 38px;

          padding: 7px;

          border: 1px solid #e5e7eb;
          border-radius: 11px;

          color: #64748b;

          background: #fff;

          font-size: 9px;
          font-weight: 700;

          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            color 0.2s ease;
        }

        .tip:hover {
          transform: translateY(-2px);

          border-color: #c7d2fe;

          color: #4f46e5;
        }

        .tip svg {
          width: 12px;
          height: 12px;
        }

        /* =================================================
           FOOTER
        ================================================= */

        .footer-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;

          margin-top: 22px;

          color: #94a3b8;

          font-size: 9px;
          line-height: 1.5;

          text-align: center;
        }

        .footer-note svg {
          width: 12px;
          height: 12px;

          color: #22c55e;
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 900px) {
          .offline-container {
            grid-template-columns: 1fr;

            width: min(520px, 100%);

            min-height: auto;
          }

          .offline-visual {
            min-height: 340px;
          }

          .visual-content {
            padding: 35px 20px;
          }

          .signal-stage {
            width: 170px;
            height: 170px;

            margin: 28px auto 22px;
          }

          .signal-core {
            width: 76px;
            height: 76px;

            border-radius: 23px;
          }

          .signal-core svg {
            width: 34px;
            height: 34px;
          }

          .visual-title {
            font-size: 22px;
          }

          .visual-description {
            display: none;
          }

          .floating-one {
            top: 20%;
            left: 7%;
          }

          .floating-two {
            top: 25%;
            right: 7%;
          }

          .floating-three {
            bottom: 15%;
            left: 9%;
          }

          .offline-content {
            padding: 38px 30px 42px;
          }
        }

        @media (max-width: 560px) {
          .offline-page {
            padding: 0;
          }

          .offline-container {
            width: 100%;
            min-height: 100dvh;

            border: 0;
            border-radius: 0;

            box-shadow: none;

            background: rgba(255, 255, 255, 0.82);
          }

          .offline-visual {
            min-height: 285px;
          }

          .visual-content {
            width: 90%;
          }

          .brand {
            padding: 8px 13px;
          }

          .brand img {
            max-width: 125px;
            max-height: 31px;
          }

          .signal-stage {
            width: 140px;
            height: 140px;

            margin: 20px auto;
          }

          .signal-core {
            width: 65px;
            height: 65px;

            border-radius: 19px;
          }

          .signal-core svg {
            width: 29px;
            height: 29px;
          }

          .visual-title {
            font-size: 19px;
          }

          .floating-card {
            padding: 7px 9px;

            font-size: 8px;
          }

          .floating-card svg {
            width: 11px;
            height: 11px;
          }

          .offline-content {
            align-items: flex-start;

            padding: 31px 20px 30px;
          }

          .content-title {
            font-size: 39px;
          }

          .content-description {
            font-size: 13px;
          }

          .connection-box {
            margin-top: 23px;
          }

          .tips {
            gap: 6px;
          }

          .tip {
            min-height: 36px;

            font-size: 8px;
          }
        }

        @media (max-width: 370px) {
          .offline-visual {
            min-height: 260px;
          }

          .content-title {
            font-size: 34px;
          }

          .content-description {
            font-size: 12px;
          }

          .tips {
            grid-template-columns: 1fr;
          }

          .tip {
            justify-content: flex-start;
            padding-left: 12px;
          }
        }

        /* =================================================
           REDUCE MOTION
        ================================================= */

        @media (ps-reduced-motion: reduce) {
          .offline-page *,
          .offline-page *::before,
          .offline-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Background */}
      <div className="offline-grid" />
      <div className="offline-glow offline-glow-one" />
      <div className="offline-glow offline-glow-two" />

      {/* Main */}
      <main className="offline-container">
        {/* =================================================
            VISUAL PANEL
        ================================================= */}

        <section className="offline-visual">
          <div className="visual-content">
            <div className="brand">
              <img src="/logo.png" alt="Odikart" />
            </div>

            <div className="signal-stage">
              <div className="signal-ring" />
              <div className="signal-ring" />
              <div className="signal-ring" />

              <div className="signal-core">
                <WifiOff />
              </div>
            </div>

            <h2 className="visual-title">
              Your shopping journey
              <br />
              is taking a short pause.
            </h2>

            <p className="visual-description">
              Don't worry. Your account and shopping data are safe.
              We'll reconnect as soon as your network is available.
            </p>
          </div>

          {/* Floating status cards */}
          <div className="floating-card floating-one">
            <Signal />
            Network unavailable
          </div>

          <div className="floating-card floating-two">
            <ShoppingBag />
            Cart saved
          </div>

          <div className="floating-card floating-three">
            <CheckCircle2 />
            Data protected
          </div>
        </section>

        {/* =================================================
            CONTENT PANEL
        ================================================= */}

        <section className="offline-content">
          <div className="content-inner">
            {/* Status */}
            <div className={`status ${isOnline ? "online" : ""}`}>
              <span className="status-dot" />

              {isOnline
                ? "Connection restored"
                : "You're offline"}
            </div>

            {/* Heading */}
            <h1 className="content-title">
              Connection
              <span>Lost.</span>
            </h1>

            <p className="content-description">
              We couldn't connect to the Odikart network right now.
              Check your Wi-Fi or mobile data and try again.
            </p>

            {/* Connection status */}
            <div className="connection-box">
              <div className="connection-icon">
                {isOnline ? <Wifi /> : <WifiOff />}
              </div>

              <div className="connection-copy">
                <strong>
                  {checking
                    ? "Checking your connection..."
                    : isOnline
                    ? "Internet connection detected"
                    : "No internet connection"}
                </strong>

                <span>
                  {checking
                    ? "We're checking whether Odikart is reachable."
                    : isOnline
                    ? "Reloading Odikart..."
                    : "Make sure your Wi-Fi or mobile data is turned on."}
                </span>
              </div>
            </div>

            {/* Retry */}
            <button
              type="button"
              className="retry-button"
              onClick={handleRetry}
              disabled={checking || isOnline}
            >
              <RefreshCw
                className={`retry-icon ${
                  checking ? "spin" : ""
                }`}
              />

              {checking
                ? "Checking connection..."
                : isOnline
                ? "Connection restored"
                : "Retry connection"}
            </button>

            {/* Helpful tips */}
            <p className="tips-title">
              Quick things to check
            </p>

            <div className="tips">
              <div className="tip">
                <Wifi />
                Wi-Fi
              </div>

              <div className="tip">
                <Smartphone />
                Mobile Data
              </div>

              <div className="tip">
                <Router />
                Router
              </div>
            </div>

            {/* Footer */}
            <div className="footer-note">
              <CheckCircle2 />
              We'll automatically reconnect when you're back online.
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Offline;