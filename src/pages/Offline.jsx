import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  WifiOff,
  RefreshCw,
  Signal,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Radio,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const Offline = () => {
  const [checking, setChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : false
  );

  const retryTimerRef = useRef(null);
  const reloadTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setChecking(false);

      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current);
      reloadTimerRef.current = setTimeout(() => {
        window.location.reload();
      }, 900);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setChecking(false);

      if (reloadTimerRef.current) {
        clearTimeout(reloadTimerRef.current);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = useCallback(() => {
    if (checking) return;

    setChecking(true);

    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);

    retryTimerRef.current = setTimeout(() => {
      if (navigator.onLine) {
        setIsOnline(true);

        reloadTimerRef.current = setTimeout(() => {
          window.location.reload();
        }, 650);

        return;
      }

      setIsOnline(false);
      setChecking(false);
    }, 900);
  }, [checking]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Enter" && !checking) handleRetry();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRetry, checking]);

  return (
    <main className="odikart-offline">
      <style>{`
        .odikart-offline {
          --blue: #2563eb;
          --indigo: #4f46e5;
          --violet: #7c3aed;
          --purple: #9333ea;
          --ink: #111827;
          --muted: #64748b;
          --line: rgba(79, 70, 229, .11);
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(390px, .92fr);
          color: var(--ink);
          background:
            radial-gradient(circle at 8% 10%, rgba(79,70,229,.13), transparent 30%),
            radial-gradient(circle at 92% 5%, rgba(147,51,234,.10), transparent 28%),
            radial-gradient(circle at 55% 100%, rgba(37,99,235,.10), transparent 35%),
            linear-gradient(135deg, #fff 0%, #fbfbff 46%, #f6f7ff 100%);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .odikart-offline *,
        .odikart-offline *::before,
        .odikart-offline *::after { box-sizing: border-box; }

        .offline-bg,
        .offline-bg::before,
        .offline-bg::after {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .offline-bg {
          z-index: -5;
          overflow: hidden;
          background-image:
            linear-gradient(rgba(79,70,229,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(79,70,229,.035) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: linear-gradient(to bottom, black, transparent 90%);
          animation: gridMove 18s linear infinite;
        }

        .offline-bg::before {
          content: "";
          inset: -20%;
          background:
            conic-gradient(from 210deg at 50% 50%,
              transparent 0 18%,
              rgba(99,102,241,.08) 25%,
              transparent 34% 62%,
              rgba(139,92,246,.07) 70%,
              transparent 78%);
          filter: blur(28px);
          animation: bgRotate 24s linear infinite;
        }

        .offline-bg::after {
          content: "";
          opacity: .035;
          background-image: repeating-linear-gradient(
            0deg,
            #4f46e5 0,
            #4f46e5 1px,
            transparent 1px,
            transparent 4px
          );
        }

        .aurora {
          position: absolute;
          z-index: -4;
          width: 34vw;
          height: 34vw;
          min-width: 240px;
          min-height: 240px;
          border-radius: 50%;
          filter: blur(80px);
          opacity: .18;
          pointer-events: none;
          animation: aurora 11s ease-in-out infinite;
        }

        .aurora.a { left: -13%; top: -18%; background: #6366f1; }
        .aurora.b { right: -13%; bottom: -20%; background: #3b82f6; animation-delay: -4s; }
        .aurora.c {
          width: 20vw;
          height: 20vw;
          left: 43%;
          top: 35%;
          background: #a855f7;
          animation-delay: -7s;
        }

        .spark-field {
          position: absolute;
          inset: 0;
          z-index: -2;
          pointer-events: none;
        }

        .spark-field i {
          position: absolute;
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #818cf8;
          box-shadow: 0 0 12px rgba(99,102,241,.8);
          animation: particle 6s ease-in-out infinite;
        }

        .spark-field i:nth-child(1) { top: 14%; left: 12%; }
        .spark-field i:nth-child(2) { top: 23%; right: 17%; width: 4px; height: 4px; animation-delay: -2s; }
        .spark-field i:nth-child(3) { bottom: 18%; left: 21%; animation-delay: -4s; }
        .spark-field i:nth-child(4) { bottom: 25%; right: 10%; width: 2px; height: 2px; animation-delay: -1s; }
        .spark-field i:nth-child(5) { top: 12%; left: 52%; width: 2px; height: 2px; animation-delay: -5s; }
        .spark-field i:nth-child(6) { bottom: 13%; right: 42%; animation-delay: -3s; }

        .offline-visual {
          position: relative;
          min-height: 100vh;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-right: 1px solid var(--line);
        }

        .brand {
          position: absolute;
          top: 28px;
          left: 32px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand img {
          width: 112px;
          height: auto;
          display: block;
          filter: drop-shadow(0 8px 18px rgba(79,70,229,.18));
        }

        .brand-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 10px;
          border: 1px solid rgba(99,102,241,.13);
          border-radius: 999px;
          color: #4338ca;
          background: rgba(255,255,255,.7);
          backdrop-filter: blur(12px);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .brand-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 4px rgba(239,68,68,.07), 0 0 12px rgba(239,68,68,.5);
        }

        /* Premium anime-style energy scene */
        .energy-scene {
          position: relative;
          width: min(560px, 92%);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
        }

        .energy-scene::before {
          content: "";
          position: absolute;
          width: 74%;
          aspect-ratio: 1;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,.18), rgba(124,58,237,.08) 42%, transparent 70%);
          filter: blur(18px);
          animation: breathe 3.8s ease-in-out infinite;
        }

        .energy-scene::after {
          content: "";
          position: absolute;
          width: 42%;
          aspect-ratio: 1;
          border-radius: 50%;
          background: rgba(255,255,255,.62);
          filter: blur(34px);
          animation: coreAura 2.8s ease-in-out infinite;
        }

        .halo {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .halo.one {
          width: 58%;
          aspect-ratio: 1;
          border: 1px solid rgba(99,102,241,.28);
          box-shadow:
            0 0 45px rgba(99,102,241,.10),
            inset 0 0 30px rgba(99,102,241,.07);
          animation: haloPulse 3.2s ease-in-out infinite;
        }

        .halo.two {
          width: 76%;
          aspect-ratio: 1;
          border: 1px solid rgba(139,92,246,.18);
          animation: haloPulse 4.2s ease-in-out -.8s infinite;
        }

        .halo.three {
          width: 91%;
          aspect-ratio: 1;
          border: 1px dashed rgba(37,99,235,.16);
          animation: spin 22s linear infinite;
        }

        .orbit {
          position: absolute;
          width: 78%;
          height: 28%;
          border: 1px solid rgba(79,70,229,.24);
          border-radius: 50%;
          transform: rotate(-27deg);
          animation: orbit 8s linear infinite;
        }

        .orbit.two {
          width: 66%;
          height: 24%;
          transform: rotate(57deg);
          border-color: rgba(139,92,246,.22);
          animation-direction: reverse;
          animation-duration: 10s;
        }

        .orbit::after {
          content: "";
          position: absolute;
          top: -4px;
          left: 50%;
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #a5b4fc;
          box-shadow: 0 0 12px #6366f1, 0 0 30px rgba(99,102,241,.8);
        }

        .orbit.two::after {
          background: #ddd6fe;
          box-shadow: 0 0 12px #8b5cf6, 0 0 30px rgba(139,92,246,.8);
        }

        .energy-core {
          position: relative;
          z-index: 5;
          width: 148px;
          height: 148px;
          display: grid;
          place-items: center;
          border-radius: 42px;
          transform: rotate(45deg);
          background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(239,242,255,.86));
          border: 1px solid rgba(99,102,241,.2);
          box-shadow:
            inset 0 1px 2px rgba(255,255,255,.98),
            0 0 35px rgba(99,102,241,.22),
            0 28px 70px rgba(49,46,129,.15);
          animation: coreFloat 4s ease-in-out infinite;
        }

        .energy-core::before {
          content: "";
          position: absolute;
          inset: -14px;
          border-radius: 48px;
          border: 1px solid rgba(99,102,241,.25);
          box-shadow: 0 0 30px rgba(99,102,241,.12);
          animation: borderPulse 2.6s ease-in-out infinite;
        }

        .energy-core::after {
          content: "";
          position: absolute;
          inset: 11px;
          border-radius: 33px;
          background: linear-gradient(135deg, rgba(99,102,241,.10), rgba(168,85,247,.13));
          border: 1px solid rgba(255,255,255,.9);
        }

        .core-inner {
          position: relative;
          z-index: 3;
          width: 92px;
          height: 92px;
          display: grid;
          place-items: center;
          border-radius: 29px;
          transform: rotate(-45deg);
          color: #fff;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 45%, #7c3aed 100%);
          box-shadow:
            inset 0 1px 2px rgba(255,255,255,.45),
            0 0 25px rgba(79,70,229,.45),
            0 0 65px rgba(124,58,237,.18);
          overflow: hidden;
        }

        .core-inner::before {
          content: "";
          position: absolute;
          inset: -80%;
          background: linear-gradient(115deg, transparent 43%, rgba(255,255,255,.78) 49%, transparent 55%);
          transform: translateX(-55%) rotate(8deg);
          animation: shineSweep 2.7s ease-in-out infinite;
        }

        .core-inner svg {
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 0 8px rgba(255,255,255,.35));
        }

        .anime-spark {
          position: absolute;
          z-index: 10;
          color: #6366f1;
          filter: drop-shadow(0 0 9px rgba(99,102,241,.55));
          animation: sparkle 2.7s ease-in-out infinite;
        }

        .anime-spark.one { top: 19%; left: 18%; }
        .anime-spark.two { top: 27%; right: 15%; animation-delay: -.8s; transform: scale(.7); }
        .anime-spark.three { bottom: 20%; left: 22%; animation-delay: -1.6s; transform: scale(.55); }

        .scene-caption {
          position: absolute;
          bottom: 38px;
          left: 50%;
          z-index: 15;
          width: min(460px, 80%);
          transform: translateX(-50%);
          text-align: center;
        }

        .scene-caption h2 {
          margin: 0;
          font-size: clamp(21px, 2vw, 27px);
          line-height: 1.2;
          letter-spacing: -.04em;
          font-weight: 850;
          color: #1e1b4b;
        }

        .scene-caption h2 span {
          background: linear-gradient(90deg, #2563eb, #4f46e5, #9333ea);
          background-size: 180% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientFlow 5s linear infinite;
        }

        .scene-caption p {
          margin: 9px auto 0;
          max-width: 390px;
          color: #64748b;
          font-size: 11px;
          line-height: 1.65;
        }

        .floating-chip {
          position: absolute;
          z-index: 20;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border: 1px solid rgba(99,102,241,.13);
          border-radius: 14px;
          color: #3730a3;
          background: rgba(255,255,255,.68);
          box-shadow: 0 16px 36px rgba(49,46,129,.08);
          backdrop-filter: blur(14px);
          font-size: 9px;
          font-weight: 800;
          animation: chipFloat 5s ease-in-out infinite;
        }

        .floating-chip svg { width: 15px; height: 15px; }
        .chip-one { top: 27%; left: 7%; color: #dc2626; }
        .chip-two { top: 34%; right: 7%; color: #7c3aed; animation-delay: -1.3s; }
        .chip-three { bottom: 23%; left: 10%; color: #16a34a; animation-delay: -2.4s; }

        .offline-content {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
          padding: 60px clamp(30px, 5vw, 76px);
          background: radial-gradient(circle at 100% 0%, rgba(99,102,241,.08), transparent 38%);
        }

        .content-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          // margin-bottom: 34px;
        }

        .content-logo { width: 82px; }
        .content-logo img {
          display: block;
          width: 100%;
          height: auto;
          filter: drop-shadow(0 8px 16px rgba(79,70,229,.14));
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 11px;
          border: 1px solid rgba(239,68,68,.15);
          border-radius: 999px;
          color: #dc2626;
          background: rgba(239,68,68,.055);
          font-size: 10px;
          font-weight: 850;
        }

        .status.online {
          color: #15803d;
          border-color: rgba(34,197,94,.2);
          background: rgba(34,197,94,.07);
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 0 4px rgba(239,68,68,.07), 0 0 12px rgba(239,68,68,.5);
          animation: statusPulse 1.8s ease-in-out infinite;
        }

        .status.online .status-dot {
          background: #22c55e;
          box-shadow: 0 0 0 4px rgba(34,197,94,.07), 0 0 12px rgba(34,197,94,.5);
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 13px;
          color: #4f46e5;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .17em;
          text-transform: uppercase;
        }

        .eyebrow::before {
          content: "";
          width: 23px;
          height: 1px;
          background: linear-gradient(90deg, #4f46e5, transparent);
        }

        .content-title {
          max-width: 560px;
          margin: 0;
          font-size: clamp(48px, 5vw, 72px);
          line-height: .92;
          letter-spacing: -.065em;
          font-weight: 950;
          color: #111827;
        }

        .content-title span {
          display: block;
          background: linear-gradient(90deg, #2563eb, #4f46e5 42%, #7c3aed 72%, #9333ea);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientFlow 5s linear infinite;
        }

        .content-description {
          max-width: 480px;
          margin: 21px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.75;
        }

        .connection-box {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          margin-top: 9px;
          padding: 15px;
          overflow: hidden;
          border: 1px solid rgba(99,102,241,.12);
          border-radius: 18px;
          background: rgba(255,255,255,.72);
          box-shadow: 0 14px 35px rgba(49,46,129,.05);
          backdrop-filter: blur(16px);
        }

        .connection-box::after {
          content: "";
          position: absolute;
          inset: 0;
          width: 35%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
          transform: translateX(-140%);
          animation: panelShine 4.5s ease-in-out infinite;
        }

        .connection-icon {
          position: relative;
          z-index: 1;
          flex: 0 0 45px;
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(99,102,241,.15);
          border-radius: 14px;
          color: #4f46e5;
          background: rgba(255,255,255,.92);
        }

        .connection-title {
          margin: 0 0 3px;
          color: #1e293b;
          font-size: 13px;
          font-weight: 850;
        }

        .connection-text {
          margin: 0;
          color: #64748b;
          font-size: 11px;
          line-height: 1.5;
        }

        .retry-button {
          position: relative;
          isolation: isolate;
          width: 100%;
          min-height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 14px;
          padding: 15px 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.5);
          border-radius: 16px;
          color: #fff;
          background: linear-gradient(105deg, #2563eb, #4f46e5 42%, #7c3aed 74%, #9333ea);
          background-size: 220% 100%;
          box-shadow: 0 16px 38px rgba(79,70,229,.24);
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
          transition: transform .22s ease, box-shadow .22s ease, filter .22s ease;
          animation: buttonFlow 6s ease infinite;
        }

        .retry-button::before {
          content: "";
          position: absolute;
          inset: -60% -25%;
          z-index: -1;
          background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,.42) 50%, transparent 60%);
          transform: translateX(-65%) rotate(8deg);
          animation: buttonShine 3.2s ease-in-out infinite;
        }

        .retry-button:hover {
          transform: translateY(-2px);
          filter: brightness(1.04);
          box-shadow: 0 20px 46px rgba(79,70,229,.31);
        }

        .retry-button:active { transform: translateY(0) scale(.99); }
        .retry-button:disabled { cursor: not-allowed; opacity: .82; transform: none; }
        .retry-button.loading svg { animation: spin .8s linear infinite; }
        .retry-label { position: relative; z-index: 2; }

        .tips {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .tip {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #64748b;
          font-size: 10px;
          line-height: 1.5;
        }

        .tip svg { flex-shrink: 0; color: #4f46e5; }

        .offline-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-top: 27px;
          padding-top: 17px;
          border-top: 1px solid rgba(99,102,241,.1);
          color: #64748b;
          font-size: 9px;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #3730a3;
          font-weight: 800;
        }

        .footer-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #6366f1;
          box-shadow: 0 0 10px rgba(99,102,241,.55);
        }

        @keyframes gridMove {
          to { background-position: 0 52px, 52px 0; }
        }

        @keyframes bgRotate { to { transform: rotate(360deg); } }

        @keyframes aurora {
          0%,100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(25px,18px,0) scale(1.08); }
        }

        @keyframes particle {
          0%,100% { opacity: .25; transform: translate3d(0,0,0); }
          50% { opacity: 1; transform: translate3d(12px,-18px,0); }
        }

        @keyframes breathe {
          0%,100% { transform: scale(.9); opacity: .65; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        @keyframes coreAura {
          0%,100% { transform: scale(.82); opacity: .45; }
          50% { transform: scale(1.12); opacity: .9; }
        }

        @keyframes haloPulse {
          0%,100% { transform: scale(.94); opacity: .45; }
          50% { transform: scale(1.04); opacity: .9; }
        }

        @keyframes orbit {
          from { transform: rotate(-27deg) rotate(0deg); }
          to { transform: rotate(-27deg) rotate(360deg); }
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        @keyframes coreFloat {
          0%,100% { transform: rotate(45deg) translateY(0); }
          50% { transform: rotate(45deg) translateY(-9px); }
        }

        @keyframes borderPulse {
          0%,100% { transform: scale(1); opacity: .28; }
          50% { transform: scale(1.1); opacity: .82; }
        }

        @keyframes shineSweep {
          0% { transform: translateX(-70%) rotate(8deg); }
          45%,100% { transform: translateX(75%) rotate(8deg); }
        }

        @keyframes sparkle {
          0%,100% { opacity: .25; transform: translate3d(0,0,0) scale(1) rotate(0); }
          50% { opacity: 1; transform: translate3d(8px,-10px,0) scale(1.18) rotate(12deg); }
        }

        @keyframes chipFloat {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes gradientFlow { to { background-position: 200% center; } }

        @keyframes panelShine {
          0%,45% { transform: translateX(-140%); }
          65%,100% { transform: translateX(340%); }
        }

        @keyframes buttonFlow {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes buttonShine {
          0%,45% { transform: translateX(-70%) rotate(8deg); }
          65%,100% { transform: translateX(110%) rotate(8deg); }
        }

        @keyframes statusPulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50% { opacity: .45; transform: scale(.82); }
        }

        @media (max-width: 980px) {
          .odikart-offline { grid-template-columns: 1fr; overflow-y: auto; }

          .offline-visual {
            min-height: 500px;
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }

          .energy-scene { width: min(520px, 86%); }

          .scene-caption { bottom: 24px; }

          .offline-content { padding: 46px 42px; }

          .content-title { font-size: 58px; }
        }

        @media (max-width: 620px) {
          .offline-visual { min-height: 360px; }

          .brand { top: 18px; left: 18px; }
          .brand img { width: 86px; }
          .brand-badge { display: none; }

          .energy-scene {
            width: 350px;
            max-width: 112%;
          }

          .energy-core { width: 120px; height: 120px; border-radius: 36px; }
          .core-inner { width: 76px; height: 76px; border-radius: 24px; }
          .core-inner svg { width: 31px; height: 31px; }

          .scene-caption { display: none; }
          .floating-chip { padding: 7px 9px; font-size: 8px; }
          .chip-one { left: 8px; top: 30%; }
          .chip-two { right: 8px; top: 36%; }
          .chip-three { left: 12px; bottom: 13%; }

          .offline-content { padding: 28px 19px 23px; }

          .content-top { margin-bottom: 27px; }
          .content-logo { width: 70px; }

          .content-title { font-size: 44px; }
          .content-description { font-size: 12px; line-height: 1.65; }

          .tips { gap: 8px; }
          .offline-footer { margin-top: 22px; }
        }

        @media (max-width: 390px) {
          .offline-visual { min-height: 315px; }
          .energy-scene { transform: scale(.86); }
          .floating-chip { display: none; }
          .content-title { font-size: 39px; }
          .tips { grid-template-columns: 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          .odikart-offline *,
          .odikart-offline *::before,
          .odikart-offline *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <div className="offline-bg" aria-hidden="true" />
      <div className="aurora a" aria-hidden="true" />
      <div className="aurora b" aria-hidden="true" />
      <div className="aurora c" aria-hidden="true" />

      <div className="spark-field" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => <i key={index} />)}
      </div>

      <section className="offline-visual">
        <div className="brand">
          <img src="/logo.png" alt="Odikart" />
          <span className="brand-badge">
            <span className="brand-dot" />
            Offline mode
          </span>
        </div>

        <div className="energy-scene" aria-hidden="true">
          <div className="halo one" />
          <div className="halo two" />
          <div className="halo three" />
          <div className="orbit" />
          <div className="orbit two" />

          <Sparkles className="anime-spark one" size={21} />
          <Sparkles className="anime-spark two" size={16} />
          <Sparkles className="anime-spark three" size={14} />

          <div className="energy-core">
            <div className="core-inner">
              <WifiOff size={40} strokeWidth={1.7} />
            </div>
          </div>
        </div>

        <div className="scene-caption">
          <h2>
            Your shopping journey is{" "}
            <span>charging back up.</span>
          </h2>
          <p>
            Your cart and account stay safe while Odikart waits for the
            network to reconnect.
          </p>
        </div>

        <div className="floating-chip chip-one">
          <Signal /> Network unavailable
        </div>

        <div className="floating-chip chip-two">
          <ShoppingBag /> Cart protected
        </div>

        <div className="floating-chip chip-three">
          <CheckCircle2 /> Data protected
        </div>
      </section>

      <section className="offline-content">
        <div className="content-top">
          <div className="content-logo">
            <img src="/logo.png" alt="Odikart" />
          </div>

          <div className={`status ${isOnline ? "online" : ""}`}>
            <span className="status-dot" />
            {isOnline ? "Connection restored" : "You're offline"}
          </div>
        </div>

        <div className="connection-box">
          <div className="connection-icon">
            {checking ? (
              <RefreshCw size={21} />
            ) : isOnline ? (
              <Radio size={21} />
            ) : (
              <WifiOff size={21} />
            )}
          </div>

          <div>
            <p className="connection-title">
              {checking
                ? "Checking connection..."
                : isOnline
                  ? "Connection restored"
                  : "No internet connection"}
            </p>
            <p className="connection-text">
              {checking
                ? "We&apos;re checking your network."
                : isOnline
                  ? "Reloading Odikart..."
                  : "Reconnect to Wi-Fi or mobile data to continue."}
            </p>
          </div>
        </div>

        <button
          type="button"
          className={`retry-button ${checking ? "loading" : ""}`}
          onClick={handleRetry}
          disabled={checking}
          aria-label="Retry connection"
        >
          <span className="retry-label">
            {checking ? "Checking connection..." : "Try Again"}
          </span>
          {checking ? <RefreshCw size={18} /> : <ArrowRight size={18} />}
        </button>

        <div className="tips">
          <div className="tip">
            <Zap size={14} />
            <span>Check your Wi-Fi or mobile data.</span>
          </div>
          <div className="tip">
            <ShieldCheck size={14} />
            <span>Your account data stays protected.</span>
          </div>
        </div>

        <footer className="offline-footer">
          <div className="footer-brand">
            <span className="footer-dot" />
            Odikart
          </div>
          <span>Press Enter to retry</span>
        </footer>
      </section>
    </main>
  );
};

export default Offline;
