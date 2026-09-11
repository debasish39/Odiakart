import React, { useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Breadcrums from "../components/Breadcrums";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/wishlistContext";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure
} from "@heroui/react";
import {
} from "react-icons/fa";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import {
  FaShoppingCart, FaHeart, FaRegHeart,
  FaStar, FaStarHalfAlt, FaRegStar,
  FaTag, FaTruck, FaUndoAlt, FaLock,
  FaIndustry, FaListAlt, FaRupeeSign,
  FaCheckCircle, FaShieldAlt,
  FaUser, FaThumbsUp, FaThumbsDown, FaTrash,
  FaBoxOpen, FaLayerGroup, FaInfoCircle, FaCog, FaComments,
} from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { SlActionRedo } from "react-icons/sl";
import { AiOutlineZoomIn } from "react-icons/ai";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { MdVerified } from "react-icons/md";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
/* ─── colour map ─── */
const COLOR_MAP = {
  Blue: "#3b82f6", Black: "#1f2937", White: "#e5e7eb", Red: "#ef4444",
  Green: "#22c55e", Grey: "#9ca3af", Yellow: "#fbbf24", Brown: "#92400e",
  Pink: "#f472b6", Purple: "#a855f7", Orange: "#f97316", Navy: "#1e3a5f",
};

/* ─── Stars ─── */
const Stars = ({ rating = 0, size = 13, interactive = false, onRate, hover = 0, setHover }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => {
      const lit = interactive ? i <= (hover || rating) : i <= rating;
      const half = !lit && !interactive && rating >= i - .5;
      const Icon = lit ? FaStar : half ? FaStarHalfAlt : FaRegStar;
      return interactive ? (
        <button key={i} type="button"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: lit ? "#fbbf24" : "#d1d5db", transition: "transform .15s,color .15s" }}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onRate(i)}>
          <Icon size={size} />
        </button>
      ) : <Icon key={i} size={size} color={(lit || half) ? "#fbbf24" : "#d1d5db"} />;
    })}
  </div>
);

/* ─── CSS (no :root changes) ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');

.sp {
  --sp-primary:#4f46e5;
  --sp-primary-2:#6366f1;
  --sp-text:#0f172a;
  --sp-muted:#64748b;
  --sp-soft:#f8fafc;
  --sp-border:#e2e8f0;
  --sp-radius:20px;
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color:var(--sp-text);
}
.sp-bg {
  min-height:100vh;
  background:
    radial-gradient(circle at 8% 0%,rgba(99,102,241,.07),transparent 28%),
    radial-gradient(circle at 94% 15%,rgba(59,130,246,.055),transparent 24%),
    #f8fafc;
  overflow-x:hidden;
}
.sp-orb,.sp-grid{display:none}

@keyframes spFU{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes spFR{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
@keyframes spFL{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
@keyframes spSpin{to{transform:rotate(360deg)}}
@keyframes spPop{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
.sp-fu{animation:spFU .45s ease both}
.sp-fr{animation:spFR .5s ease both}
.sp-fl{animation:spFL .5s .06s ease both}

.spx-wrap{
  position:relative;
  z-index:1;
  width:min(1320px,100%);
  margin:0 auto;
  padding:26px 24px 90px;
  display:grid;
  grid-template-columns:minmax(0,560px) minmax(0,1fr);
  gap:46px;
  align-items:start;
}
.spx-left{position:sticky;top:76px;display:flex;flex-direction:column;gap:14px}
.spx-right{display:flex;flex-direction:column;gap:16px}

.spx-card{
  background:rgba(255,255,255,.96);
  border:1px solid var(--sp-border);
  border-radius:var(--sp-radius);
  box-shadow:0 6px 26px rgba(15,23,42,.045);
  transition:box-shadow .2s ease,border-color .2s ease,transform .2s ease;
}
.spx-card:hover{border-color:#d9e1ec;box-shadow:0 12px 34px rgba(15,23,42,.065)}

.spx-gallery{
  position:relative;
  overflow:hidden;
  border-radius:24px;
  background:#fff;
  border:1px solid var(--sp-border);
  box-shadow:0 12px 38px rgba(15,23,42,.07);
}
.spx-track{
  display:flex;
  overflow-x:auto;
  overflow-y:hidden;
  scroll-snap-type:x mandatory;
  scroll-behavior:smooth;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
  will-change:scroll-position;
  touch-action:pan-x;
}
.spx-track::-webkit-scrollbar{display:none}
.spx-slide{
  flex:0 0 100%;
  scroll-snap-align:start;
  scroll-snap-stop:always;
  min-height:500px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:44px;
  background:
    radial-gradient(circle at 50% 45%,#f8faff 0%,#fff 58%);
}
.spx-img{
  width:100%;
  max-height:470px;
  object-fit:contain;
  cursor:zoom-in;
  transition:transform .4s ease,filter .25s ease;
  filter:drop-shadow(0 22px 34px rgba(15,23,42,.11));
}
.spx-gallery:hover .spx-img{transform:scale(1.025)}
.spx-disc{
  position:absolute;top:16px;left:16px;z-index:10;
  display:inline-flex;align-items:center;gap:5px;
  padding:7px 12px;border-radius:999px;
  background:#eef2ff;color:#4338ca;
  border:1px solid #c7d2fe;
  font-size:11px;font-weight:800;
}
.spx-acts{position:absolute;top:15px;right:15px;z-index:10;display:flex;flex-direction:column;gap:8px}
.spx-act{
  width:40px;height:40px;border-radius:12px;
  display:flex;align-items:center;justify-content:center;
  background:rgba(255,255,255,.94);
  border:1px solid var(--sp-border);
  box-shadow:0 4px 14px rgba(15,23,42,.08);
  color:#64748b;cursor:pointer;
  transition:.18s ease;
}
.spx-act:hover{color:var(--sp-primary);border-color:#c7d2fe;transform:translateY(-1px)}
.spx-act.wl{color:#e11d48;background:#fff1f2;border-color:#fecdd3}
.spx-dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:9;opacity:0}
.spx-gallery:hover .spx-dots{opacity:1}
.spx-dot{height:5px;border:0;border-radius:99px;padding:0;background:#c7d2fe;cursor:pointer}
.spx-dot.on{background:var(--sp-primary)}
.spx-cnt{
  position:absolute;right:14px;bottom:14px;z-index:8;
  padding:5px 9px;border-radius:8px;
  background:rgba(255,255,255,.9);border:1px solid var(--sp-border);
  color:#64748b;font:700 10px "JetBrains Mono",monospace;
}
.spx-thumbs{display:flex;gap:9px;overflow-x:auto;padding:2px 1px;scrollbar-width:none}
.spx-thumbs::-webkit-scrollbar{display:none}
.spx-thumb{
  position:relative;flex:0 0 66px;width:66px;height:66px;border-radius:13px;overflow:hidden;
  background:#fff;border:0;cursor:pointer;padding:0;
  box-shadow:none;transition:.18s ease;
}
.spx-thumb:after{content:"";position:absolute;left:8px;right:8px;bottom:0;height:3px;border-radius:99px;background:transparent;transition:.2s ease}
.spx-thumb:hover:after{background:#c7d2fe}
.spx-thumb.on:after{background:var(--sp-primary)}
.spx-thumb.on{transform:translateY(-1px)}
.spx-thumb img{width:100%;height:100%;object-fit:contain}
.spx-seller{
  display:flex;align-items:center;gap:12px;padding:14px 16px;
  background:#fff;border:1px solid var(--sp-border);border-radius:16px;
  box-shadow:0 3px 12px rgba(15,23,42,.04)
}
.spx-sel-av{width:44px;height:44px;border-radius:13px;object-fit:cover;border:1px solid #e0e7ff}

.spx-pill{
  display:inline-flex;align-items:center;gap:5px;
  padding:5px 10px;border-radius:999px;
  font-size:10.5px;font-weight:800;
}
.pp{background:#eef2ff;border:1px solid #c7d2fe;color:#4338ca}
.pg{background:#f8fafc;border:1px solid #e2e8f0;color:#64748b}
.pgn{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
.prd{background:#fff1f2;border:1px solid #fecdd3;color:#be123c}
.pam{background:#fffbeb;border:1px solid #fde68a;color:#b45309}

.spx-title{
  font-family:Manrope,Inter,sans-serif;
  text-wrap:balance;
  overflow-wrap:anywhere;
  font-size:clamp(1.5rem,2.5vw,2.25rem);
  font-weight:800;line-height:1.16;letter-spacing:-.035em;color:#0f172a;
}
.spx-title span{display:block;max-width:34ch}
.spx-right p{overflow-wrap:anywhere}
.spx-card{min-width:0}

.spx-price{
  font-family:Manrope,Inter,sans-serif;
  font-size:clamp(2rem,3vw,2.65rem);
  font-weight:800;line-height:1;color:#111827;
}
.spx-label{
  margin-bottom:10px;font-size:11px;font-weight:800;
  letter-spacing:.08em;text-transform:uppercase;color:#64748b;
}
.spx-size{
  padding:9px 15px;border-radius:11px;border:1px solid #dbe3ef;
  background:#fff;color:#475569;font-size:13px;font-weight:700;cursor:pointer;
  transition:.18s ease;
}
.spx-size:hover{border-color:#a5b4fc;color:#4338ca;transform:translateY(-1px)}
.spx-size.on{background:#4f46e5;color:#fff;border-color:#4f46e5;box-shadow:0 6px 16px rgba(79,70,229,.2)}
.spx-size:disabled{opacity:.35;cursor:not-allowed;transform:none}
.spx-cd{width:30px;height:30px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:.18s ease}
.spx-cd:hover{transform:scale(1.1)}
.spx-cd.on{box-shadow:0 0 0 3px #fff,0 0 0 5px #4f46e5}
.spx-qty{display:flex;align-items:center;background:#f8fafc;border:1px solid #dbe3ef;border-radius:12px;overflow:hidden}
.spx-qb{width:40px;height:40px;border:0;background:transparent;color:#4f46e5;font-size:18px;font-weight:700;cursor:pointer}
.spx-qb:hover{background:#eef2ff}
.spx-qn{width:38px;text-align:center;font:800 13px "JetBrains Mono",monospace;color:#0f172a}

.spx-btn{
  flex:1;min-height:54px;display:flex;align-items:center;justify-content:center;gap:9px;
  padding:14px 20px;border:0;border-radius:14px;font:800 14px Inter,sans-serif;
  cursor:pointer;transition:.2s ease;
}
.spx-add{background:#4f46e5;color:#fff;box-shadow:0 8px 20px rgba(79,70,229,.23)}
.spx-add:hover{background:#4338ca;transform:translateY(-2px);box-shadow:0 12px 26px rgba(79,70,229,.28)}
.spx-ic{background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe}
.spx-wb{
  width:54px;height:54px;border-radius:14px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  background:#fff;border:1px solid #fecdd3;cursor:pointer;transition:.18s ease;
}
.spx-wb:hover,.spx-wb.on{background:#fff1f2;transform:translateY(-1px)}
.spx-tr{
  display:flex;align-items:center;gap:9px;min-height:46px;
  padding:11px 13px;border:1px solid var(--sp-border);border-radius:13px;
  background:#fff;color:#334155;font-size:11.5px;font-weight:650;
  box-shadow:0 2px 8px rgba(15,23,42,.025);transition:.18s ease;
}
.spx-tr:hover{border-color:#cbd5e1;background:#fbfdff;transform:translateY(-1px)}
.spx-emi{
  display:inline-flex;align-items:center;gap:8px;padding:8px 12px;
  border-radius:10px;background:#f5f3ff;border:1px solid #ddd6fe;
  color:#475569;font-size:11.5px
}
.spx-tag{font-size:11px;font-weight:700;padding:5px 10px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;color:#64748b}

.spx-toggler{
  display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;
  margin-bottom:22px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:14px;
}
.spx-tgl{
  min-height:42px;display:flex;align-items:center;justify-content:center;gap:7px;
  border:0;border-radius:10px;background:transparent;color:#64748b;
  font:800 12.5px Inter,sans-serif;cursor:pointer;transition:.18s ease;
}
.spx-tgl:hover{color:#4338ca;background:#eef2ff}
.spx-tgl.on{background:#fff;color:#4338ca;box-shadow:0 2px 8px rgba(15,23,42,.08)}

.spx-spec-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.spx-spec-group{
  overflow:hidden;background:#fff;border:1px solid #e2e8f0;border-radius:16px;
}
.spx-spec-head{
  display:flex;align-items:center;gap:8px;
  padding:13px 15px;background:#f8fafc;border-bottom:1px solid #e2e8f0;
  color:#334155;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
}
.spx-spec-head:before{content:"";width:7px;height:7px;border-radius:50%;background:#6366f1;box-shadow:0 0 0 4px #eef2ff}
.spx-spec-row{
  min-height:48px;display:grid;grid-template-columns:minmax(90px,.7fr) minmax(0,1.3fr);
  gap:14px;align-items:center;padding:11px 15px;
  border-bottom:1px solid #f1f5f9;background:#fff;transition:.15s ease;
}
.spx-spec-row:last-child{border-bottom:0}
.spx-spec-row:hover{background:#fafbff}
.spx-spec-key{color:#64748b;font-size:12px;font-weight:600}
.spx-spec-val{
  color:#0f172a;font:700 12px "JetBrains Mono",monospace;text-align:right;
  overflow:hidden;text-overflow:ellipsis;word-break:break-word;
}

.spx-rev-summary{
  display:grid;grid-template-columns:170px 1fr;gap:24px;align-items:center;
  padding:20px;border:1px solid #e0e7ff;border-radius:18px;
  background:linear-gradient(135deg,#f8faff,#fff);
}
.spx-rev-big{font:800 2.7rem/1 Manrope,Inter,sans-serif;color:#111827}
.spx-rb-w{height:7px;border-radius:99px;background:#e2e8f0;overflow:hidden}
.spx-rb-f{height:100%;border-radius:99px;background:#f59e0b;transition:width .5s ease}
.spx-gate{
  display:flex;flex-direction:column;align-items:center;gap:10px;
  padding:28px;border:1px dashed #c7d2fe;border-radius:18px;
  background:#fafaff;text-align:center;animation:spPop .3s ease both;
}
.spx-rv{
  position:relative;background:#fff;border:1px solid #e2e8f0;border-radius:18px;
  padding:18px;box-shadow:0 3px 12px rgba(15,23,42,.025);
  transition:.2s ease;
}
.spx-rv:hover{border-color:#cbd5e1;box-shadow:0 10px 26px rgba(15,23,42,.065);transform:translateY(-1px)}
.spx-rv + .spx-rv{margin-top:2px}
.spx-rv p{max-width:850px}
.spx-lb{
  display:inline-flex;align-items:center;gap:6px;border:1px solid #e2e8f0;
  background:#f8fafc;color:#64748b;cursor:pointer;font:700 11px Inter,sans-serif;
  padding:7px 11px;border-radius:10px;transition:.18s ease;
}
.spx-lb:hover{background:#eef2ff;color:#4338ca;border-color:#c7d2fe}
.spx-lb.liked{color:#dc2626;background:#fff1f2;border-color:#fecdd3}

.spx-in{width:100%;padding:12px 14px;background:#fff;border:1px solid #dbe3ef;border-radius:12px;font:400 13px Inter,sans-serif;color:#0f172a;outline:none;transition:.18s ease}
.spx-in:focus{border-color:#818cf8;box-shadow:0 0 0 3px #eef2ff}
.spx-upload-zone,.rv-upload-zone{
  border:1.5px dashed #c7d2fe!important;border-radius:16px!important;background:#fafaff!important;
}
.spx-spin{width:16px;height:16px;border-radius:50%;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;animation:spSpin .7s linear infinite}


.sp-detail-item{transition:.18s ease!important}
.sp-detail-item:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(15,23,42,.05)}
.sp-review-media{transition:.18s ease!important}
.sp-review-media:hover{transform:scale(1.025);box-shadow:0 8px 20px rgba(15,23,42,.10)}
.sp-review-video{background:#0f172a;max-width:260px;min-height:90px}

.sp-mobile-buybar{display:none}

/* ── react-medium-image-zoom customization ── */
[data-rmiz-modal-overlay="visible"]{
  background:rgba(2,6,23,.94)!important;
  backdrop-filter:blur(14px);
}
[data-rmiz-modal-img]{
  max-width:94vw!important;
  max-height:90vh!important;
  object-fit:contain;
}
[data-rmiz-btn-unzoom]{
  top:18px!important;
  right:18px!important;
  width:44px!important;
  height:44px!important;
  border-radius:50%!important;
  background:rgba(255,255,255,.12)!important;
  color:#fff!important;
  backdrop-filter:blur(10px);
}

/* Main image interaction */
.spx-slide{user-select:none}
.spx-img{user-select:none;-webkit-user-drag:none}

.spx-loading{background:#f8fafc!important}

@media(max-width:900px){
  .spx-wrap{grid-template-columns:1fr;gap:22px;padding:18px 16px 100px}
  .spx-left{position:static}
  .spx-slide{min-height:420px;padding:30px}
  .spx-img{max-height:390px}
  .spx-mobile-buybar{display:flex}
  .sp-mobile-buybar{
    position:fixed;left:0;right:0;bottom:0;z-index:120;
    display:flex;gap:9px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));
    background:rgba(255,255,255,.94);backdrop-filter:blur(16px);
    border-top:1px solid #e2e8f0;box-shadow:0 -8px 26px rgba(15,23,42,.09)
  }
  .sp-mobile-cart{
    flex:1;min-height:50px;border:0;border-radius:13px;background:#4f46e5;color:#fff;
    font:800 13.5px Inter,sans-serif;display:flex;align-items:center;justify-content:center;gap:8px
  }
  .sp-mobile-wish{
    width:50px;min-width:50px;border-radius:13px;border:1px solid #fecdd3;
    background:#fff;color:#e11d48;display:flex;align-items:center;justify-content:center
  }
}
@media(max-width:600px){
  .spx-wrap{padding:12px 12px 96px;gap:14px}
  .spx-slide{min-height:350px;padding:22px}
  .spx-img{max-height:325px}
  .spx-card{border-radius:16px}
  .spx-toggler{grid-template-columns:1fr 1fr 1fr}
  .spx-tgl{font-size:11px;padding:8px 5px}
  .spx-spec-grid{grid-template-columns:1fr}
  .spx-spec-row{grid-template-columns:1fr;gap:4px;min-height:58px}
  .spx-spec-val{text-align:left;font-size:11.5px}
  .spx-rev-summary{grid-template-columns:1fr;gap:16px}
  .spx-rv{padding:14px}
  .spx-rv > div:first-child{gap:8px}
  .spx-title{font-size:1.45rem}
  .spx-price{font-size:2rem}
}

@media(prefers-reduced-motion:reduce){
}

/* =========================================================
   FLIPKART-INSPIRED MOBILE PRODUCT PAGE
   Compact cards, stronger hierarchy and horizontal sections
   ========================================================= */
@media (max-width: 768px){
  .sp-bg{background:#f1f3f6;min-height:100vh}
  .spx-wrap{display:block;width:100%;padding:0 0 82px}
  .spx-left,.spx-right{display:block;width:100%}
  .spx-left{position:static}

  /* Hide desktop breadcrumb spacing on small screens */
  .spx-wrap + *{margin:0}

  .spx-gallery{border:0;border-radius:0;box-shadow:none;background:#fff}
  .spx-slide{min-height:0;height:390px;padding:12px 30px;background:#fff}
  .spx-img{max-height:366px;width:100%;object-fit:contain;filter:none}

  .spx-disc{top:10px;left:10px;padding:5px 8px;font-size:9px}
  .spx-acts{top:10px;right:10px;gap:7px}
  .spx-act{width:34px;height:34px;border-radius:9px;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.12)}
  .spx-cnt{bottom:9px;right:9px;font-size:9px;padding:4px 7px}

  .spx-thumbs{background:#fff;border-top:1px solid #eee;border-bottom:1px solid #eee;padding:8px 10px;gap:7px;overflow-x:auto;scroll-snap-type:x proximity}
  .spx-thumb{flex:0 0 56px;width:56px;height:56px;border-radius:8px;scroll-snap-align:start}

  .spx-seller{margin:0;border-radius:0;border-left:0;border-right:0;box-shadow:none;padding:10px 12px;background:#fff}
  .spx-sel-av{width:36px;height:36px;border-radius:9px}

  .spx-right{display:flex;flex-direction:column;gap:7px}
  .spx-card{border:0;border-radius:0;box-shadow:none;background:#fff}
  .spx-card:hover{border-color:transparent;box-shadow:none;transform:none}

  /* Product title */
  .spx-title{font-family:Inter,system-ui,sans-serif;font-size:15px;line-height:1.42;letter-spacing:-.01em;font-weight:600;color:#212121}
  .spx-title span{display:block;max-width:none}
  .spx-card[style*="22px 24px"]{padding:12px 12px !important}
  .spx-card[style*="22px 24px"] > div:first-child{margin-bottom:7px !important}
  .spx-pill{font-size:9px;padding:4px 7px}
  .spx-card p{font-size:11.5px !important;line-height:1.55 !important;color:#666 !important}

  /* Rating row */
  .spx-title + p + div{margin-top:9px !important;padding-top:9px !important}

  /* Price */
  .spx-price{font-size:24px;line-height:1;font-family:Inter,system-ui,sans-serif;font-weight:700}
  .spx-card[style*="20px 24px"]{padding:12px !important}
  .spx-card[style*="20px 24px"] .spx-emi{margin-top:7px;font-size:10px;padding:6px 8px}

  /* Variant / quantity area */
  .spx-size{padding:8px 13px;border-radius:7px;font-size:11px}
  .spx-cd{width:27px;height:27px}
  .spx-label{font-size:10px;margin-bottom:7px}
  .spx-qty{border-radius:8px}
  .spx-qb{width:34px;height:34px}
  .spx-qn{width:32px}

  /* Buttons */
  .spx-btn{min-height:48px;border-radius:8px;font-size:12px}
  .spx-wb{width:48px;height:48px;border-radius:8px}

  /* Trust information */
  .spx-tr{min-height:42px;padding:8px 9px;border-radius:7px;font-size:10px}

  /* Details / specs / reviews */
  .spx-toggler{margin:0 0 12px;border-radius:7px;padding:3px}
  .spx-tgl{min-height:36px;font-size:10px;border-radius:5px}
  .spx-spec-grid{gap:7px}
  .spx-spec-group{border-radius:8px}
  .spx-spec-head{padding:9px 10px;font-size:9px}
  .spx-spec-row{padding:9px 10px;min-height:42px}
  .spx-spec-key,.spx-spec-val{font-size:10px}
  .spx-rev-summary{padding:12px;border-radius:9px}
  .spx-rev-big{font-size:30px}
  .spx-rv{border-radius:9px;padding:11px}

  /* Make long text safe on narrow screens */
  .spx-right,.spx-card,.spx-card p,.spx-spec-val,.spx-rv{min-width:0;overflow-wrap:anywhere}

  /* Horizontal recommendation/review media rows */
  .sp-review-media{max-width:92px !important;height:110px !important}

  /* Hide the inline Cart/Wishlist buttons on mobile.
     Mobile uses only the fixed bottom purchase bar. */
  .spx-inline-cta{display:none !important}

  /* Mobile sticky purchase bar */
  .sp-mobile-buybar{padding:8px 9px calc(8px + env(safe-area-inset-bottom));gap:7px}
  .sp-mobile-cart{min-height:48px;border-radius:8px;font-size:12px}
  .sp-mobile-wish{width:48px;min-width:48px;border-radius:8px}
}

@media (max-width: 420px){
  .spx-slide{height:350px;padding:8px 25px}
  .spx-img{max-height:330px}
  .spx-thumb{flex-basis:52px;width:52px;height:52px}
  .spx-title{font-size:14px}
  .spx-price{font-size:22px}
  .spx-card[style*="20px 24px"] > div:first-child{gap:9px !important}
}


/* =========================================================
   PRODUCT INFORMATION ACCORDIONS
   ========================================================= */
.spx-accordion{
  border:1px solid #e2e8f0;
  border-radius:16px;
  background:#fff;
  overflow:hidden;
}
.spx-accordion + .spx-accordion{margin-top:10px}
.spx-accordion-head{
  width:100%;
  min-height:58px;
  padding:14px 17px;
  border:0;
  background:#fff;
  color:#0f172a;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  text-align:left;
  cursor:pointer;
  font:800 14px Inter,system-ui,sans-serif;
  transition:.18s ease;
}
.spx-accordion-head:hover{background:#f8fafc}
.spx-accordion-title{
  display:flex;
  align-items:center;
  gap:10px;
  min-width:0;
}
.spx-accordion-icon{
  width:34px;
  height:34px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
  background:#eef2ff;
  color:#4f46e5;
  flex-shrink:0;
}
.spx-accordion-chevron{
  color:#64748b;
  transition:transform .2s ease;
  flex-shrink:0;
}
.spx-accordion.open .spx-accordion-chevron{transform:rotate(180deg)}
.spx-accordion-body{
  padding:0 17px 17px;
  animation:spFU .22s ease both;
}
.spx-accordion-meta{
  margin-left:auto;
  color:#64748b;
  font-size:11px;
  font-weight:700;
  white-space:nowrap;
}
/* ── Modern marketplace reviews ── */
.spx-reviews-modern{display:flex;flex-direction:column;gap:14px}
.spx-review-hero{display:grid;grid-template-columns:190px minmax(0,1fr);gap:22px;padding:20px;border:1px solid #e0e7ff;border-radius:20px;background:linear-gradient(135deg,#f8faff 0%,#fff 55%,#fafaff 100%);box-shadow:0 8px 28px rgba(79,70,229,.06)}
.spx-review-score{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 12px;border-right:1px solid #e8ecf7}
.spx-review-score-num{font:800 46px/1 Manrope,Inter,sans-serif;letter-spacing:-.05em;color:#111827}
.spx-review-score-label{margin-top:6px;color:#64748b;font-size:10px;font-weight:700}
.spx-review-bars{display:flex;flex-direction:column;gap:8px;justify-content:center}
.spx-review-bar{display:grid;grid-template-columns:28px minmax(70px,1fr) 34px;align-items:center;gap:8px;border:0;background:transparent;padding:2px 4px;border-radius:9px;cursor:pointer}
.spx-review-bar:hover{background:#eef2ff}
.spx-review-bar-label{font-size:10px;font-weight:800;color:#64748b;text-align:right}
.spx-review-bar-track{height:8px;border-radius:99px;background:#e8edf5;overflow:hidden}
.spx-review-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#f59e0b,#fbbf24);transition:width .45s ease}
.spx-review-bar-count{font-size:10px;font-weight:800;color:#94a3b8}
.spx-review-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.spx-review-filter-scroll{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;flex:1;min-width:0}
.spx-review-filter-scroll::-webkit-scrollbar{display:none}
.spx-review-chip{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;padding:8px 11px;border:1px solid #e2e8f0;border-radius:999px;background:#fff;color:#64748b;font:800 10.5px Inter,sans-serif;cursor:pointer;transition:.18s ease}
.spx-review-chip:hover{border-color:#c7d2fe;background:#f8faff;color:#4338ca}
.spx-review-chip.on{background:#eef2ff;border-color:#c7d2fe;color:#4338ca;box-shadow:0 3px 10px rgba(79,70,229,.08)}
.spx-review-sort{min-width:130px;padding:8px 10px;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#475569;font:700 10.5px Inter,sans-serif;outline:none}
.spx-review-countline{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#94a3b8;font-size:10px;font-weight:700}
.spx-modern-review{position:relative;padding:17px;border:1px solid #e5e7eb;border-radius:18px;background:#fff;box-shadow:0 3px 14px rgba(15,23,42,.025);transition:.2s ease}
.spx-modern-review:hover{border-color:#cbd5e1;box-shadow:0 10px 28px rgba(15,23,42,.06);transform:translateY(-1px)}
.spx-review-user{display:flex;align-items:center;gap:10px;min-width:0}
.spx-review-avatar{width:40px;height:40px;border-radius:12px;object-fit:cover;flex:0 0 40px;border:1px solid #e2e8f0}
.spx-review-avatar-fallback{display:grid;place-items:center;background:linear-gradient(135deg,#eef2ff,#e0e7ff);color:#4338ca;font-size:14px;font-weight:900}
.spx-review-name{font-size:12.5px;font-weight:850;color:#111827;overflow-wrap:anywhere}
.spx-review-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:3px}
.spx-review-date{font-size:9.5px;color:#94a3b8}
.spx-verified{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:8.5px;font-weight:850}
.spx-review-rating-pill{display:inline-flex;align-items:center;gap:4px;padding:5px 8px;border-radius:8px;background:#fffbeb;color:#b45309;font-size:10px;font-weight:900}
.spx-review-comment{margin:12px 0 0;color:#334155;font-size:12.5px;line-height:1.7;overflow-wrap:anywhere}
.spx-review-photos{display:flex;gap:8px;overflow-x:auto;margin-top:13px;padding:1px 1px 4px;scroll-snap-type:x proximity;scrollbar-width:none}
.spx-review-photos::-webkit-scrollbar{display:none}
.spx-review-photo{position:relative;width:84px;height:84px;min-width:84px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#f8fafc;padding:0;cursor:pointer;scroll-snap-align:start}
.spx-review-photo img{width:100%;height:100%;object-fit:cover;transition:transform .25s ease}
.spx-review-photo:hover img{transform:scale(1.06)}
.spx-review-photo-more{position:absolute;right:5px;bottom:5px;padding:4px 6px;border-radius:7px;background:rgba(15,23,42,.72);color:#fff;font-size:8px;font-weight:800}
.spx-review-actions{display:flex;align-items:center;gap:7px;margin-top:13px;padding-top:11px;border-top:1px solid #f1f5f9}
.spx-review-actions-label{font-size:9px;color:#94a3b8;font-weight:700;margin-right:2px}
.spx-review-empty{padding:32px 18px;text-align:center;border:1px dashed #cbd5e1;border-radius:18px;background:linear-gradient(180deg,#fafbff,#fff)}
@media(max-width:600px){
  .spx-review-hero{grid-template-columns:1fr;gap:14px;padding:14px;border-radius:14px}
  .spx-review-score{border-right:0;border-bottom:1px solid #e8ecf7;padding-bottom:14px}
  .spx-review-score-num{font-size:38px}
  .spx-review-toolbar{display:block}
  .spx-review-filter-scroll{padding-bottom:4px;margin-bottom:8px}
  .spx-review-sort{width:100%}
  .spx-modern-review{padding:13px;border-radius:13px}
  .spx-review-photo{width:72px;height:72px;min-width:72px}
}

.spx-review-preview{
  display:flex;
  flex-direction:column;
  gap:12px;
}
.spx-review-preview-card{
  padding:15px;
  border:1px solid #e2e8f0;
  border-radius:14px;
  background:#fff;
}
.spx-view-all-reviews{
  width:100%;
  min-height:46px;
  border:1px solid #c7d2fe;
  border-radius:12px;
  background:#eef2ff;
  color:#4338ca;
  font:800 12px Inter,sans-serif;
  cursor:pointer;
  transition:.18s ease;
}
.spx-view-all-reviews:hover{
  background:#e0e7ff;
  transform:translateY(-1px);
}
.spx-related-accordion{
  max-width:1280px;
  margin:0 auto;
  padding:0 22px 88px;
}
.spx-related-body{
  padding:4px 0 0;
}
.spx-related-grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(186px,1fr));
  gap:13px;
}
@media(max-width:768px){
  .spx-accordion{
    border-radius:0;
    border-left:0;
    border-right:0;
    border-color:#e5e7eb;
  }
  .spx-accordion + .spx-accordion{margin-top:7px}
  .spx-accordion-head{
    min-height:52px;
    padding:11px 12px;
    font-size:13px;
  }
  .spx-accordion-icon{width:30px;height:30px;border-radius:8px}
  .spx-accordion-body{padding:0 12px 13px}
  .spx-accordion-meta{font-size:10px}
  .spx-related-accordion{
    padding:0 0 82px;
    margin-top:7px;
  }
  .spx-related-accordion .spx-accordion{
    border-radius:0;
  }
  .spx-related-body{padding:4px 10px 12px}
  .spx-related-grid{
    display:flex;
    overflow-x:auto;
    gap:9px;
    padding:2px 0 8px;
    scroll-snap-type:x proximity;
    scrollbar-width:none;
  }
  .spx-related-grid::-webkit-scrollbar{display:none}
  .spx-related-grid > *{
    flex:0 0 168px;
    min-width:168px;
    scroll-snap-align:start;
  }
}

/* Desktop stays spacious and card based */
@media (min-width: 769px){
  .spx-gallery{min-width:0}
}
`;


export default function SingleProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomedImageIndex, setZoomedImageIndex] = useState(null);
  const [selSize, setSelSize] = useState(null);
  const [selColor, setSelColor] = useState(null);
  const [qty, setQty] = useState(1);

  // ── Product PIN-code serviceability ──
  const [servicePincode, setServicePincode] = useState("");
  const [serviceability, setServiceability] = useState({
    checking: false,
    checked: false,
    serviceable: null,
    message: "",
  });
  const [reviews, setReviews] = useState([]);
  const [reviewRatingFilter, setReviewRatingFilter] = useState("all");
  const [reviewSort, setReviewSort] = useState("relevant");
  const [selectedReview, setSelectedReview] = useState(null);

  const { addToCart, cartItem } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const token = localStorage.getItem("token");
  const isSignedIn = !!token;
  const { isOpen, onOpen, onOpenChange } =
    useDisclosure();

  const [selectedImage, setSelectedImage] =
    useState("");
  const galleryRef = useRef(null);
  const mainGalleryRef = useRef(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [startX, setStartX] =
    useState(0);

  const [scrollLeft, setScrollLeft] =
    useState(0);
  const [galleryImages, setGalleryImages] =
    useState([]);
  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [openInfoSections, setOpenInfoSections] = useState({
    details: true,
    specs: true,
    reviews: true,
  });

  const toggleInfoSection = useCallback((section) => {
    setOpenInfoSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);
  const [relatedOpen, setRelatedOpen] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  // ── Product cache: shared key keeps product navigation fast.
  const {
    data: product = null,
    isLoading: productLoading,
    isFetching: productFetching,
    error: productError,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/products/${id}`);
      const p = res.data?.product;
      if (!p) throw new Error("Product not found");
      return p;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  /* ── Schema-compatible variant/media helpers ── */
  const variants = product?.variants || [];

  const getVariantAttr = (variant, key) => {
    const attrs = variant?.attributes;
    if (!attrs) return "";
    if (typeof attrs.get === "function") {
      return attrs.get(key) || attrs.get(key.toLowerCase()) || "";
    }
    return attrs[key] || attrs[key.toLowerCase()] || "";
  };

  const variantSize = (variant) =>
    getVariantAttr(variant, "Size");

  const variantColor = (variant) =>
    getVariantAttr(variant, "Color");

  const sizeOptions = [...new Set(variants.map(variantSize).filter(Boolean))];
  const colorOptions = [...new Set(variants.map(variantColor).filter(Boolean))];

  const selectedVariant = variants.find((variant) => {
    const sizeMatches =
      !selSize || !sizeOptions.length || variantSize(variant) === selSize;
    const colorMatches =
      !selColor || !colorOptions.length || variantColor(variant) === selColor;
    return sizeMatches && colorMatches && variant.isActive !== false;
  }) || variants.find((variant) => variant.isActive !== false) || variants[0];

  const productStock = selectedVariant?.stock ?? 0;
  const productPrice = selectedVariant?.price ?? 0;
  const productOriginalPrice = selectedVariant?.originalPrice ?? 0;
  const productDiscount = selectedVariant?.discountPercentage || 0;
  const productShippingCharge = product?.shipping?.shippingCharge ?? 0;
  const productMinQty = product?.minimumOrderQuantity || 1;
  const productMaxQty = product?.maximumOrderQuantity || 10;
  const productImages = [
    product?.media?.thumbnail,
    ...(product?.media?.images || []),
  ].filter(Boolean);
  useEffect(() => {
    window.scrollTo(0, 0);
    setActiveIdx(0);
    setCurrentIndex(0);
    setQty(1);
    setServiceability({ checking: false, checked: false, serviceable: null, message: "" });
  }, [id]);

  useEffect(() => {
    if (!product) return;
    setReviews(product.reviews || []);
    const firstVariant =
      product.variants?.find((v) => v.isActive !== false) || product.variants?.[0];
    const attrs = firstVariant?.attributes || {};
    const readAttr = (key) => {
      if (typeof attrs.get === "function") {
        return attrs.get(key) || attrs.get(key.toLowerCase()) || "";
      }
      return attrs[key] || attrs[key.toLowerCase()] || "";
    };
    setSelSize(readAttr("Size"));
    setSelColor(readAttr("Color"));
  }, [product]);
/* =====================================================
   RECENTLY VIEWED
   NO AUTHENTICATION REQUIRED
   COOKIE BASED
===================================================== */

useEffect(() => {
  if (!id) {
    console.log(
      "🟡 RECENTLY VIEWED: Product ID missing"
    );
    return;
  }

  const saveRecentlyViewed = async () => {
    console.log("");
    console.log(
      "=========================================="
    );
    console.log(
      "🟣 SAVE RECENTLY VIEWED START"
    );
    console.log(
      "🟣 Product ID:",
      id
    );
    console.log(
      "🟣 API:",
      `${BACKEND_URL}/api/products/recently-viewed/${id}`
    );

    try {
      const url =
        `${BACKEND_URL}/api/products/recently-viewed/${id}`;

      console.log(
        "🟣 Sending POST request..."
      );

      console.log(
        "🟣 credentials: include"
      );

      const response =
        await fetch(url, {
          method: "POST",

          credentials: "include",

          headers: {
            Accept:
              "application/json",
          },
        });

      console.log(
        "🟢 Recently Viewed POST status:",
        response.status
      );

      console.log(
        "🟢 Recently Viewed POST ok:",
        response.ok
      );

      const contentType =
        response.headers.get(
          "content-type"
        );

      console.log(
        "🟢 Content-Type:",
        contentType
      );

      const data =
        await response.json();

      console.log(
        "🟢 Recently Viewed response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Request failed with status ${response.status}`
        );
      }

      console.log(
        "✅ RECENTLY VIEWED SAVED SUCCESSFULLY"
      );

    } catch (error) {
      console.error(
        "🔴 RECENTLY VIEWED SAVE ERROR:",
        error
      );

      console.error(
        "🔴 Error message:",
        error?.message
      );

    } finally {
      console.log(
        "🟣 SAVE RECENTLY VIEWED END"
      );

      console.log(
        "=========================================="
      );
    }
  };

  saveRecentlyViewed();

}, [id, BACKEND_URL]);
  // ── Similar products cache by category + product.
  const { data: related = [], isFetching: relatedFetching } = useQuery({
    queryKey: ["related-products", product?.category?.name, product?._id],
    queryFn: async () => {
      const res = await axios.get(`${BACKEND_URL}/api/products`, {
        params: { category: product.category?.name, limit: 6 },
      });
      return (res.data?.products || []).filter((p) => p._id !== product._id);
    },
    enabled: !!product?.category?.name && !!product?._id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const allImgs = productImages.filter(
    (img, index, arr) => arr.indexOf(img) === index
  );

  const handleMainGalleryScroll = useCallback((e) => {
    const el = e.currentTarget;
    if (!el.clientWidth) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (allImgs.length > 0) {
      setActiveIdx(Math.max(0, Math.min(index, allImgs.length - 1)));
    }
  }, [allImgs.length]);

  const scrollToImage = useCallback((index) => {
    const el = mainGalleryRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' });
  }, []);
const showPrevImage = useCallback(() => {
  if (!galleryImages.length) return;

  setCurrentIndex((prev) => {
    const nextIndex =
      prev === 0 ? galleryImages.length - 1 : prev - 1;

    setSelectedImage(galleryImages[nextIndex]);

    return nextIndex;
  });
}, [galleryImages]);

const showNextImage = useCallback(() => {
  if (!galleryImages.length) return;

  setCurrentIndex((prev) => {
    const nextIndex =
      prev === galleryImages.length - 1 ? 0 : prev + 1;

    setSelectedImage(galleryImages[nextIndex]);

    return nextIndex;
  });
}, [galleryImages]);
const handleMouseDown = useCallback((e) => {
  const slider = galleryRef.current;
  if (!slider) return;

  setIsDragging(true);
  setStartX(e.pageX - slider.offsetLeft);
  setScrollLeft(slider.scrollLeft);
}, []);

const handleMouseMove = useCallback((e) => {
  if (!isDragging) return;

  const slider = galleryRef.current;
  if (!slider) return;

  e.preventDefault();

  const x = e.pageX - slider.offsetLeft;
  const walk = (x - startX) * 1.5;

  slider.scrollLeft = scrollLeft - walk;
}, [isDragging, startX, scrollLeft]);

const handleMouseUp = useCallback(() => {
  setIsDragging(false);
}, []);

const handleMouseLeave = useCallback(() => {
  setIsDragging(false);
}, []);
  const isInCart = cartItem.some(c => String(c.productId) === String(product?._id));
  const isWishlisted = wishlist.some(w => String(w.productId) === String(product?._id));

  const finalPrice = productPrice;
  const origPrice = productOriginalPrice || (
    productDiscount > 0
      ? Math.round(finalPrice / (1 - productDiscount / 100))
      : finalPrice
  );

  // ── CHECK WHETHER THIS PRODUCT CAN BE DELIVERED ──
  const checkProductServiceability = async () => {
    const pincode = String(servicePincode || "").replace(/\D/g, "").slice(0, 6);

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setServiceability({
        checking: false,
        checked: false,
        serviceable: null,
        message: "Enter a valid 6-digit PIN code.",
      });
      toast.error("Enter a valid 6-digit PIN code");
      return false;
    }

    setServiceability({
      checking: true,
      checked: false,
      serviceable: null,
      message: "",
    });

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/serviceability/cart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            pincode,
            postalCode: pincode,
            items: [{
              productId: product._id,
              variantSku: selectedVariant?.sku || "",
              quantity: Number(qty || 1),
              sellerId: product.seller?._id || product.sellerId || null,
            }],
          }),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || "Unable to check delivery availability"
        );
      }

      const unavailableItems = Array.isArray(data.unavailableItems)
        ? data.unavailableItems
        : Array.isArray(data.items)
          ? data.items.filter(item => item.serviceable === false)
          : [];

      const serviceableItems = Array.isArray(data.serviceableItems)
        ? data.serviceableItems
        : Array.isArray(data.items)
          ? data.items.filter(item => item.serviceable !== false)
          : [];

      const isServiceable =
        unavailableItems.length === 0 && serviceableItems.length > 0;

      setServiceability({
        checking: false,
        checked: true,
        serviceable: isServiceable,
        message:
          data.message ||
          (isServiceable
            ? `Delivery is available to ${pincode}.`
            : `This product cannot be delivered to ${pincode}.`),
      });

      if (isServiceable) {
        toast.success(`Delivery available to ${pincode}`);
        return true;
      }

      toast.error(`This product is not deliverable to ${pincode}`);
      return false;
    } catch (error) {
      console.error("PRODUCT SERVICEABILITY ERROR:", error);
      setServiceability({
        checking: false,
        checked: false,
        serviceable: null,
        message: error?.message || "Unable to check delivery availability.",
      });
      toast.error(error?.message || "Unable to check delivery availability");
      return false;
    }
  };

  const handleServicePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setServicePincode(value);
    setServiceability({
      checking: false,
      checked: false,
      serviceable: null,
      message: "",
    });
  };

  const validatePurchase = () => {
    if (!isSignedIn) {
      toast.error("Please login first");
      navigate("/sign-in");
      return false;
    }
    if (!selectedVariant) {
      toast.error("Please select a product variant");
      return false;
    }
    if (!productStock) {
      toast.error("Out of Stock");
      return false;
    }
    if (qty < productMinQty || qty > productMaxQty) {
      toast.error(`Quantity must be between ${productMinQty} and ${productMaxQty}`);
      return false;
    }
    return true;
  };

  const handleCart = () => {
    if (!validatePurchase()) return;
    if (isInCart) {
      navigate("/cart");
      return;
    }
    addToCart(product, selectedVariant, qty);
  };

  const handleBuyNow = async () => {
    if (!validatePurchase()) return;
    if (!isInCart) await addToCart(product, selectedVariant, qty);
    navigate("/cart");
  };
  const handleWish = () => {
    if (!isSignedIn) { toast.error("Please login first"); navigate("/sign-in"); return; }
    if (isWishlisted) { removeFromWishlist(String(product._id)); toast("Removed ❌"); }
    else { addToWishlist({ ...product, productId: product._id }); toast.success("Wishlisted ❤️"); }
  };
  const handleShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: product.title, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied 🔗"); }
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
  };

  const toggleLike = async (rid, type = "like") => {
    if (!token) { toast.error("Please login first"); return; }
    try {
      const endpoint = type === "like" ? "like" : "dislike";
      const res = await axios.put(
        `${BACKEND_URL}/api/products/${product._id}/review/${rid}/${endpoint}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReviews(prev => prev.map(r => r._id === rid
        ? { ...r, likesCount: res.data.likes, dislikesCount: res.data.dislikes } : r));
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
  };

  const deleteReview = async rid => {
    if (!token) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/products/${product._id}/review/${rid}`,
        { headers: { Authorization: `Bearer ${token}` } });
      setReviews(prev => prev.filter(r => r._id !== rid));
      toast.success("Review deleted");
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
  };

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + Number(r?.rating || 0), 0) / reviews.length).toFixed(1)
    : Number(product?.rating || 0).toFixed(1);

  /* ── Interactive review rating filter ── */
  const reviewRatingCounts = {
    5: reviews.filter(r => Math.round(Number(r?.rating || 0)) === 5).length,
    4: reviews.filter(r => Math.round(Number(r?.rating || 0)) === 4).length,
    3: reviews.filter(r => Math.round(Number(r?.rating || 0)) === 3).length,
    2: reviews.filter(r => Math.round(Number(r?.rating || 0)) === 2).length,
    1: reviews.filter(r => Math.round(Number(r?.rating || 0)) === 1).length,
  };

  const filteredReviews = [...reviews]
    .filter((r) => {
      if (reviewRatingFilter === "all") return true;
      if (reviewRatingFilter === "photos") return getReviewImages(r).length > 0;
      return Math.round(Number(r?.rating || 0)) === Number(reviewRatingFilter);
    })
    .sort((a, b) => {
      if (reviewSort === "recent") {
        return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
      }
      if (reviewSort === "highest") return Number(b?.rating || 0) - Number(a?.rating || 0);
      if (reviewSort === "lowest") return Number(a?.rating || 0) - Number(b?.rating || 0);
      return (Number(b?.likesCount || 0) - Number(a?.likesCount || 0));
    });

  const getReviewImages = (review) => {
    const images = [
      ...(Array.isArray(review?.images) ? review.images : []),
      ...(Array.isArray(review?.photos) ? review.photos : []),
      ...(Array.isArray(review?.imageUrls) ? review.imageUrls : []),
    ];

    return [...new Set(images.filter(Boolean))];
  };

  /* ── Loading / error ── */
  if (productLoading && !product) return (
    <div className="spx-loading sp" style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <Spinner />
        <div style={{ marginTop: 12, fontSize: 12, color: "#64748b", fontWeight: 700 }}>Loading product…</div>
      </div>
    </div>
  );

  if (productError && !product) return (
    <div className="spx-loading sp" style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center", padding: 28, border: "1px solid #e2e8f0", borderRadius: 20, background: "#fff" }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>🛍️</div>
        <h2 style={{ margin: 0, color: "#111827", fontSize: 20 }}>Product unavailable</h2>
        <p style={{ margin: "8px 0 18px", color: "#64748b", fontSize: 13 }}>{productError.message || "We couldn't load this product."}</p>
        <button type="button" onClick={() => refetchProduct()} style={{ border: 0, borderRadius: 12, padding: "11px 18px", background: "#4f46e5", color: "#fff", fontWeight: 800, cursor: "pointer" }}>Try again</button>
      </div>
    </div>
  );

  if (!product) return null;

  const disc = Math.round(productDiscount || 0);

  /* spec rows */
  const specsA = [
    { l: "SKU", v: selectedVariant?.sku || "—" },
    { l: "Barcode", v: selectedVariant?.barcode || "—" },
    { l: "Material", v: product.material },
    { l: "Weight", v: selectedVariant?.weight ? `${selectedVariant.weight}g` : null },
    { l: "Currency", v: product.currency },
  ].filter(r => r.v);

  const specsB = [
    { l: "Dimensions", v: selectedVariant?.dimensions ? `${selectedVariant.dimensions.width || 0}×${selectedVariant.dimensions.height || 0}×${selectedVariant.dimensions.depth || 0} cm` : null },
    { l: "Tax", v: selectedVariant?.tax ? `${selectedVariant.tax}%` : null },
    { l: "Shipping", v: productShippingCharge ? `₹${productShippingCharge}` : "Free" },
    { l: "Min Order", v: `${productMinQty} unit` },
    { l: "Max Order", v: `${productMaxQty} units` },
    { l: "Warranty", v: product.warrantyInformation },
  ].filter(r => r.v);

  /* ════════════════════════════ JSX ════════════════════════════ */
  return (
    <>
      <style>{CSS}</style>
      <div className="sp sp-bg">


        {/* breadcrumb */}
        {/* <div style={{ position: "relative", zIndex: 1, maxWidth: 1320, margin: "0 auto", padding: "22px 24px 0" }}>
          <Breadcrums title={product.title} />
        </div> */}

        {/* ══ MAIN ══ */}
        <div className="spx-wrap">
          {productFetching && (
            <div style={{ position: "fixed", top: 68, right: 16, zIndex: 30, padding: "7px 10px", borderRadius: 999, background: "rgba(17,24,39,.92)", color: "#fff", fontSize: 10, fontWeight: 800, boxShadow: "0 8px 24px rgba(15,23,42,.18)" }}>Updating product…</div>
          )}

          {/* ── LEFT: sticky gallery ── */}
          <div className="spx-left sp-fr mt-3">

            {/* Gallery */}
            <div
              className="spx-gallery"
            >
              {disc > 0 && (
                <div className="spx-disc">
                  <FaTag size={9} /> {disc}% OFF
                </div>
              )}

              <div className="spx-acts">
                {/* <button className={`spx-act${isWishlisted ? " wl" : ""}`} onClick={handleWish} title="Wishlist">
                  {isWishlisted ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
                </button> */}
                <button className="spx-act" onClick={handleShare} title="Share">
                  <SlActionRedo size={13} />
                </button>
                <button className="spx-act" type="button" onClick={() => setZoomedImageIndex(activeIdx)} title="Zoom image">
                  <AiOutlineZoomIn size={15} />
                </button>
              </div>

              <div ref={mainGalleryRef} className="spx-track spx-main-track" onScroll={handleMainGalleryScroll}>
                  {allImgs.map((src, i) => (
                    <div key={i} className="spx-slide">
                      <ControlledZoom
                        isZoomed={zoomedImageIndex === i}
                        onZoomChange={(isZoomed) => {
                          setZoomedImageIndex(isZoomed ? i : null);
                        }}
                        zoomMargin={24}
                        a11yNameButtonZoom={`Zoom ${product.title}`}
                        a11yNameButtonUnzoom="Close image zoom"
                        zoomImg={{
                          src,
                          alt: product.title,
                        }}
                      >
                        <img
                          src={src}
                          alt={product.title}
                          loading={i === 0 ? "eager" : "lazy"}
                          draggable={false}
                          className="spx-img"
                        />
                      </ControlledZoom>
                    </div>
                  ))}
                </div>

              {allImgs.length > 1 && (
                <div className="spx-cnt">{activeIdx + 1} / {allImgs.length}</div>
              )}
            </div>

            {/* thumbs */}
            <div className="spx-thumbs">
              {allImgs.map((src, i) => (
                <div key={i} className={`spx-thumb${i === activeIdx ? " on" : ""}`} onClick={() => { setActiveIdx(i); scrollToImage(i); }}>
                  <img src={src} alt="" />
                </div>
              ))}
            </div>

            {/* seller */}
            {product.seller && (
              <div className="spx-seller sp-fu">
                <img src={product.seller.image} alt="seller" className="spx-sel-av"
                  onError={e => e.target.src = "https://via.placeholder.com/44"} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1a1535" }}>{product.seller.firstName} {product.seller.lastName}</div>
                  <div style={{ fontSize: 10.5, color: "#8893a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.seller.email}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, color: "#5046e4", background: "rgba(80,70,228,.08)", padding: "4px 10px", borderRadius: 40, flexShrink: 0 }}>
                  <MdVerified size={13} /> Verified Seller
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT ── */}
          <div className="spx-right sp-fl">

            {/* ── Title card ── */}
            <div className="spx-card" style={{ padding: "22px 24px" }}>
              {/* badges row */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
                <span className="spx-pill pp"><FaListAlt size={9} />{<span>{product.category?.name}</span>}</span>
                {product.subCategory && <span className="spx-pill pg">{product.subCategory?.name}</span>}
                <span className="spx-pill pg"><FaIndustry size={9} />{product.brand}</span>
                <span className={`spx-pill ${productStock > 0 ? "pgn" : "prd"}`}>
                  {productStock > 0 ? `✓ In Stock (${productStock})` : "Out of Stock"}
                </span>
                {product.bestSeller && <span className="spx-pill pam">🏆 Best Seller</span>}
                {product.trending && <span className="spx-pill pp">🔥 Trending</span>}
                {product.isNewArrival && <span className="spx-pill pgn">✨ New</span>}
              </div>

              <h1 className="spx-title">
                <span>{product.title}</span>
              </h1>
              {product.shortDescription && (
                <p style={{ fontSize: 13.5, color: "#5a6278", marginTop: 10, lineHeight: 1.70 }}>{product.shortDescription}</p>
              )}

              {/* rating row */}
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(80,70,228,.07)", flexWrap: "wrap" }}>
                <Stars rating={parseFloat(avgRating)} />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: "#1a1535", fontFamily: "var(--fm)" }}>{avgRating}</span>
                <span style={{ fontSize: 12, color: "#a0aec0" }}>({reviews.length} reviews)</span>
                <span style={{ fontSize: 10.5, color: "#c4cce0", marginLeft: "auto", fontFamily: "var(--fm)" }}>SKU: {selectedVariant?.sku || "—"}</span>
              </div>
            </div>

            {/* ── Price card ── */}
            <div className="spx-card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <FaRupeeSign size={15} style={{ color: "#5046e4", marginBottom: 8 }} />
                  <span className="spx-price">{finalPrice.toLocaleString("en-IN")}</span>
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ fontSize: 13, color: "#a0aec0", textDecoration: "line-through" }}>₹{origPrice.toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#10b981" }}>Save ₹{(origPrice - finalPrice).toLocaleString("en-IN")}</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 11, color: "#a0aec0", fontWeight: 600 }}>+₹{productShippingCharge} shipping</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div className="spx-emi">
                  <FaTag size={10} color="#5046e4" />
                  <span style={{ fontWeight: 600 }}>No-cost EMI from</span>
                  <span style={{ fontWeight: 800, color: "#5046e4", fontFamily: "var(--fm)" }}>₹{Math.round(finalPrice / 6).toLocaleString("en-IN")}/mo</span>
                </div>
              </div>
            </div>

            {/* ── Size + Color + Qty card ── */}
            <div className="spx-card" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

              {sizeOptions.length > 0 && (
                <div>
                  <div className="spx-label">
                    Size — <span style={{ color: "#5046e4", textTransform: "none", letterSpacing: 0, fontFamily: "var(--fb)" }}>{selSize}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {sizeOptions.map((size) => {
                      const sizeVariant = variants.find(
                        (v) => variantSize(v) === size && v.isActive !== false
                      );
                      return (
                        <button key={size}
                          className={`spx-size${selSize === size ? " on" : ""}`}
                          disabled={!sizeVariant || sizeVariant.stock === 0}
                          onClick={() => setSelSize(size)}>
                          {size}
                          {sizeVariant?.price != null && sizeVariant.price !== productPrice && (
                            <span style={{ fontSize: 10, opacity: .7, marginLeft: 4 }}>₹{sizeVariant.price}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {colorOptions.length > 0 && (
                <div>
                  <div className="spx-label">
                    Color — <span style={{ color: "#5046e4", textTransform: "none", letterSpacing: 0, fontFamily: "var(--fb)" }}>{selColor}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    {colorOptions.map((c) => (
                      <button key={c}
                        className={`spx-cd${selColor === c ? " on" : ""}`}
                        style={{ background: COLOR_MAP[c] || "#9ca3af", outline: c === "White" ? "1.5px solid #e2e8f0" : "none" }}
                        onClick={() => setSelColor(c)} title={c} />
                    ))}
                  </div>
                </div>
              )}

              {/* qty */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="spx-label" style={{ marginBottom: 0 }}>Quantity</div>
                <div className="spx-qty">
                  <button className="spx-qb" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span className="spx-qn">{qty}</span>
                  <button className="spx-qb" onClick={() => setQty(q => Math.min(productMaxQty, q + 1))}>+</button>
                </div>
                <span style={{ fontSize: 11, color: "#c4cce0" }}>Max {productMaxQty}</span>
              </div>
            </div>

            {/* ── Desktop CTA row ──
                 On mobile these actions are shown only in the fixed bottom bar,
                 so there is no duplicate Add to Cart / Wishlist row. ── */}
            {/* ── Delivery PIN checker ── */}
            <div
              className="spx-card"
              style={{
                padding: "16px 18px",
                border: serviceability.checked
                  ? serviceability.serviceable
                    ? "1px solid #a7f3d0"
                    : "1px solid #fecaca"
                  : "1px solid #e2e8f0",
                background: serviceability.checked
                  ? serviceability.serviceable
                    ? "#f0fdf4"
                    : "#fef2f2"
                  : "#fff",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                <FaTruck size={14} style={{ color: "#5046e4" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>
                    Check delivery availability
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748b", marginTop: 2 }}>
                    Enter your PIN code to check whether this product is deliverable.
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                <input
                  className="spx-in"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN code"
                  value={servicePincode}
                  onChange={handleServicePincodeChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") checkProductServiceability();
                  }}
                  aria-label="Delivery PIN code"
                />

                <button
                  type="button"
                  onClick={checkProductServiceability}
                  disabled={
                    serviceability.checking ||
                    !/^[1-9][0-9]{5}$/.test(servicePincode)
                  }
                  style={{
                    minWidth: 105,
                    border: 0,
                    borderRadius: 12,
                    padding: "0 14px",
                    background: "#4f46e5",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    opacity:
                      serviceability.checking ||
                      !/^[1-9][0-9]{5}$/.test(servicePincode)
                        ? 0.55
                        : 1,
                  }}
                >
                  {serviceability.checking ? "Checking..." : "Check"}
                </button>
              </div>

              {serviceability.message && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color:
                      serviceability.serviceable === true
                        ? "#047857"
                        : serviceability.serviceable === false
                          ? "#b91c1c"
                          : "#64748b",
                  }}
                >
                  {serviceability.serviceable === true ? "✓ " : ""}
                  {serviceability.serviceable === false ? "✕ " : ""}
                  {serviceability.message}
                </div>
              )}
            </div>

            <div className="spx-inline-cta" style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
              <button
                type="button"
                className={`spx-btn ${isInCart ? "spx-ic" : "spx-add"}`}
                onClick={handleCart}
              >
                <FaShoppingCart size={15} />
                <span>{isInCart ? "Go to Cart" : "Add to Cart"}</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                style={{
                  flex: 1, border: 0, borderRadius: 14, padding: "0 18px",
                  minHeight: 48, background: "#111827", color: "#fff",
                  fontWeight: 900, fontSize: 13, cursor: "pointer",
                }}
              >
                Buy Now
              </button>
              <button
                type="button"
                className={`spx-wb${isWishlisted ? " on" : ""}`}
                onClick={handleWish}
                aria-label="Wishlist"
              >
                {isWishlisted
                  ? <FaHeart size={18} style={{ color: "#f43f5e" }} />
                  : <FaRegHeart size={18} style={{ color: "#f43f5e" }} />}
              </button>
            </div>

            {/* ── Trust badges ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: <FaTruck size={13} style={{ color: "#10b981" }} />, text: product.shipping?.freeShipping ? "Free Delivery" : (product.shippingInformation || "Delivery available") },
                { icon: <FaUndoAlt size={12} style={{ color: "#3b82f6" }} />, text: product.returnPolicy || "Easy Returns" },
                { icon: <FaShieldAlt size={12} style={{ color: "#5046e4" }} />, text: "Secure Payment" },
                { icon: <FaCheckCircle size={12} style={{ color: "#f59e0b" }} />, text: product.warrantyInformation || "Genuine" },
              ].map(({ icon, text }) => (
                <div key={text} className="spx-tr">{icon}<span>{text}</span></div>
              ))}
            </div>

            {/* ══ PRODUCT INFORMATION ACCORDIONS ══ */}
            <div className="spx-card" style={{ padding: 0, overflow: "hidden" }}>

              {/* DETAILS */}
              {/* <div className={`spx-accordion${openInfoSections.details ? " open" : ""}`}>
                <button
                  type="button"
                  className="spx-accordion-head"
                  onClick={() => toggleInfoSection("details")}
                  aria-expanded={openInfoSections.details}
                >
                  <span className="spx-accordion-title">
                    <span className="spx-accordion-icon"><FaInfoCircle size={13} /></span>
                    <span>Product Details</span>
                  </span>
                  <ChevronDown className="spx-accordion-chevron" size={17} />
                </button>

                {openInfoSections.details && (
                  <div className="spx-accordion-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <p style={{ fontSize: 14, color: "#5a6278", lineHeight: 1.76, margin: 0 }}>
                        {product.description || "No product description available."}
                      </p>

                      {(product.shippingInformation || product.returnPolicy || product.warrantyInformation) && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>
                          {[
                            { label: "Shipping", val: product.shippingInformation, color: "#10b981" },
                            { label: "Returns", val: product.returnPolicy, color: "#3b82f6" },
                            { label: "Warranty", val: product.warrantyInformation, color: "#f59e0b" },
                          ].filter(x => x.val).map(x => (
                            <div key={x.label} className="sp-detail-item" style={{
                              padding: "12px 14px",
                              borderRadius: 14,
                              background: `${x.color}0d`,
                              border: `1px solid ${x.color}22`
                            }}>
                              <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: x.color, marginBottom: 4 }}>
                                {x.label}
                              </div>
                              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#374151" }}>{x.val}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {product.tags?.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          {product.tags.map(t => <span key={t} className="spx-tag">#{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div> */}

              {/* SPECIFICATIONS */}
              <div className={`spx-accordion${openInfoSections.specs ? " open" : ""}`}>
                <button
                  type="button"
                  className="spx-accordion-head"
                  onClick={() => toggleInfoSection("specs")}
                  aria-expanded={openInfoSections.specs}
                >
                  <span className="spx-accordion-title">
                    <span className="spx-accordion-icon"><FaCog size={13} /></span>
                    <span>Specifications</span>
                  </span>
                  <span className="spx-accordion-meta">
                    {[...specsA, ...specsB].length} specifications
                  </span>
                  <ChevronDown className="spx-accordion-chevron" size={17} />
                </button>

                {openInfoSections.specs && (
                  <div className="spx-accordion-body">
                    <div className="spx-spec-grid">
                      {specsA.length > 0 && (
                        <div className="spx-spec-group">
                          <div className="spx-spec-head">Product Identity</div>
                          {specsA.map(r => (
                            <div key={r.l} className="spx-spec-row">
                              <span className="spx-spec-key">{r.l}</span>
                              <span className="spx-spec-val">{r.v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {specsB.length > 0 && (
                        <div className="spx-spec-group">
                          <div className="spx-spec-head">Shipping &amp; Ordering</div>
                          {specsB.map(r => (
                            <div key={r.l} className="spx-spec-row">
                              <span className="spx-spec-key">{r.l}</span>
                              <span className="spx-spec-val">{r.v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* =========================================================
                  MODERN RATINGS & REVIEWS
                  ========================================================= */}
              <div className={`spx-accordion${openInfoSections.reviews ? " open" : ""}`}>
                <button type="button" className="spx-accordion-head" onClick={() => toggleInfoSection("reviews")} aria-expanded={openInfoSections.reviews}>
                  <span className="spx-accordion-title">
                    <span className="spx-accordion-icon"><FaComments size={13} /></span>
                    <span>Ratings &amp; Reviews</span>
                  </span>
                  <span className="spx-accordion-meta">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
                  <ChevronDown className="spx-accordion-chevron" size={17} />
                </button>

                {openInfoSections.reviews && (
                  <div className="spx-accordion-body">
                    <div className="spx-reviews-modern">
                      <div className="spx-review-hero">
                        <div className="spx-review-score">
                          <div className="spx-review-score-num">{avgRating}</div>
                          <Stars rating={parseFloat(avgRating)} size={17} />
                          <div className="spx-review-score-label">Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}</div>
                          {reviews.some(r => r?.verifiedPurchase) && (
                            <span className="spx-verified" style={{marginTop:8}}><FaCheckCircle size={8}/> Verified shoppers</span>
                          )}
                        </div>

                        <div className="spx-review-bars">
                          {[5,4,3,2,1].map(star => {
                            const count = reviewRatingCounts[star] || 0;
                            const percentage = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                            const isActive = reviewRatingFilter === String(star);
                            return (
                              <button key={star} type="button" className="spx-review-bar" onClick={() => setReviewRatingFilter(isActive ? "all" : String(star))} aria-pressed={isActive}>
                                <span className="spx-review-bar-label">{star}★</span>
                                <span className="spx-review-bar-track"><span className="spx-review-bar-fill" style={{width:`${percentage}%`}} /></span>
                                <span className="spx-review-bar-count">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="spx-review-toolbar">
                        <div className="spx-review-filter-scroll">
                          {[
                            ["all", "All", reviews.length],
                            ["photos", "📷 Photos", reviews.filter(r => getReviewImages(r).length > 0).length],
                            ["5", "★ 5", reviewRatingCounts[5]],
                            ["4", "★ 4", reviewRatingCounts[4]],
                            ["3", "★ 3", reviewRatingCounts[3]],
                            ["2", "★ 2", reviewRatingCounts[2]],
                            ["1", "★ 1", reviewRatingCounts[1]],
                          ].map(([value,label,count]) => (
                            <button key={value} type="button" className={`spx-review-chip${reviewRatingFilter === value ? " on" : ""}`} onClick={() => setReviewRatingFilter(value)} aria-pressed={reviewRatingFilter === value}>
                              {label} <span style={{opacity:.65}}>{count}</span>
                            </button>
                          ))}
                        </div>
                        <select className="spx-review-sort" value={reviewSort} onChange={(e) => setReviewSort(e.target.value)} aria-label="Sort reviews">
                          <option value="relevant">Most helpful</option>
                          <option value="recent">Newest</option>
                          <option value="highest">Highest rated</option>
                          <option value="lowest">Lowest rated</option>
                        </select>
                      </div>

                      <div className="spx-review-countline">
                        <span>{filteredReviews.length} {filteredReviews.length === 1 ? "review" : "reviews"} shown</span>
                        {reviewRatingFilter !== "all" && (
                          <button type="button" onClick={() => setReviewRatingFilter("all")} style={{border:0,background:"transparent",color:"#4f46e5",fontSize:10,fontWeight:850,cursor:"pointer"}}>Clear filter</button>
                        )}
                      </div>

                      {filteredReviews.length > 0 ? (
                        <div style={{display:"flex",flexDirection:"column",gap:10}}>
                          {filteredReviews.map((review,index) => {
                            const rating = Number(review?.rating || 0);
                            const reviewImages = getReviewImages(review);
                            const reviewerName = review?.reviewerName || review?.userName || review?.user?.name || "Anonymous";
                            const avatar = review?.reviewerAvatar || review?.user?.avatar;
                            const date = review?.createdAt ? new Date(review.createdAt).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"}) : "";
                            return (
                              <article key={review?._id || index} className="spx-modern-review">
                                <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start"}}>
                                  <div className="spx-review-user">
                                    {avatar ? <img className="spx-review-avatar" src={avatar} alt="" /> : <div className="spx-review-avatar spx-review-avatar-fallback">{reviewerName.charAt(0).toUpperCase()}</div>}
                                    <div style={{minWidth:0}}>
                                      <div className="spx-review-name">{reviewerName}</div>
                                      <div className="spx-review-meta">
                                        {review?.verifiedPurchase && <span className="spx-verified"><FaCheckCircle size={8}/> Verified Purchase</span>}
                                        {date && <span className="spx-review-date">{date}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="spx-review-rating-pill"><FaStar size={9}/> {rating.toFixed(1)}</span>
                                </div>

                                <div style={{marginTop:9}}><Stars rating={rating} size={12}/></div>

                                {review?.comment && <p className="spx-review-comment">{review.comment}</p>}

                                {reviewImages.length > 0 && (
                                  <div className="spx-review-photos">
                                    {reviewImages.map((image,imageIndex) => (
                                      <button key={`${review?._id || index}-image-${imageIndex}`} type="button" className="spx-review-photo" onClick={() => { setSelectedReview(review); setGalleryImages(reviewImages); setCurrentIndex(imageIndex); setSelectedImage(image); onOpen(); }} aria-label={`Open review photo ${imageIndex+1}`}>
                                        <img src={image} alt={`Review ${imageIndex+1}`} />
                                        {imageIndex === reviewImages.length - 1 && reviewImages.length > 1 && <span className="spx-review-photo-more">{reviewImages.length} photos</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                <div className="spx-review-actions">
                                  <span className="spx-review-actions-label">Helpful?</span>
                                  <button type="button" onClick={() => toggleLike(review._id,"like")} className="spx-lb"><FaThumbsUp size={9}/> Helpful <span>{review?.likesCount || 0}</span></button>
                                  <button type="button" onClick={() => toggleLike(review._id,"dislike")} className="spx-lb"><FaThumbsDown size={9}/> <span>{review?.dislikesCount || 0}</span></button>
                                  {review?.isOwner && <button type="button" onClick={() => deleteReview(review._id)} className="spx-lb" style={{marginLeft:"auto",color:"#dc2626"}}><FaTrash size={9}/> Delete</button>}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="spx-review-empty">
                          <FaRegStar size={28} color="#a5b4fc" />
                          <div style={{marginTop:9,fontSize:13,fontWeight:850,color:"#334155"}}>{reviews.length === 0 ? "No reviews yet" : "No reviews match this filter"}</div>
                          <p style={{margin:"6px auto 0",maxWidth:320,fontSize:11,color:"#94a3b8",lineHeight:1.55}}>Be the first to share your experience and help other shoppers make a confident choice.</p>
                          {reviews.length > 0 && <button type="button" onClick={() => setReviewRatingFilter("all")} style={{marginTop:10,border:0,background:"#eef2ff",color:"#4338ca",padding:"8px 12px",borderRadius:9,fontSize:10,fontWeight:850,cursor:"pointer"}}>Show all reviews</button>}
                        </div>
                      )}

                      {reviews.length > 0 && (
                        <button type="button" className="spx-view-all-reviews" onClick={() => navigate(`/product/${product._id}/reviews`)}>View all {reviews.length} reviews <span aria-hidden="true">→</span></button>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>{/* end right */}
        </div>{/* end main */}

        {/* ── Related products dropdown ── */}
        {related.length > 0 && (
          <div className="sp-fu spx-related-accordion">
            <div >
              <button
                type="button"
                className="spx-accordion-head"
                aria-expanded={relatedOpen}
              >
                <span className="spx-accordion-title">
                  <span className="spx-accordion-icon"><FaLayerGroup size={13} /></span>
                  <span>Similar Products</span>
                </span>
                <span className="spx-accordion-meta">{related.length} products</span>
            
              </button>

              {relatedOpen && (
                <div className="spx-accordion-body spx-related-body">
                  <div className="spx-related-grid">
                    {related.map(p => <ProductCard key={p._id} product={p} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Mobile sticky purchase bar ── */}
        <div className="sp-mobile-buybar">
          <button
            type="button"
            className="sp-mobile-wish"
            onClick={handleWish}
            aria-label="Wishlist"
          >
            {isWishlisted ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
          </button>
          <button
            type="button"
            className="sp-mobile-cart"
            onClick={handleCart}
          >
            <FaShoppingCart size={15} />
            {isInCart ? "Go to Cart" : `Add to Cart · ₹${finalPrice.toLocaleString("en-IN")}`}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            style={{
              flex: "0 0 92px", border: 0, borderRadius: 12,
              background: "#111827", color: "#fff", fontWeight: 900,
              fontSize: 11.5, cursor: "pointer",
            }}
          >
            Buy Now
          </button>
        </div>

      </div>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="5xl"
        backdrop="blur"
        placement="center"
        scrollBehavior="inside"
      >
        <ModalContent
          className="overflow-hidden"
          style={{
            borderRadius: "24px",
            maxHeight: "95vh",
          }}
        >
          {(onClose) => (

            <ModalBody
              className="p-0"
              style={{
                background: "#0f172a",
              }}
            >

              {/* Close Button */}

              <button
                onClick={onClose}
                className="absolute top-3 right-3 z-50
          w-10 h-10 lg:w-11 lg:h-11
          rounded-full bg-black/50 hover:bg-black/70
          text-white backdrop-blur"
              >
                ✕
              </button>

              <div
                className="
          flex flex-col
          lg:grid lg:grid-cols-[1fr_380px]
          "
              >

                {/* LEFT IMAGE */}

                <div
                  className="
            relative
            flex items-center justify-center
            bg-black/60
            h-[45vh]
            sm:h-[55vh]
            lg:h-[80vh]
            "
                >

                  <img
                    src={selectedImage}
                    alt=""
                    className="
              w-full
              h-full
              object-contain
              "
                  />
                  {/* Previous */}

                  {galleryImages.length > 1 && (
                    <button
                      onClick={showPrevImage}
                      className="
    absolute left-3
    sm:left-5
    top-1/2
    -translate-y-1/2
    z-30
    w-10 h-10
    sm:w-12 sm:h-12
    rounded-full
    bg-black/50
    hover:bg-indigo-600
    text-white
    backdrop-blur-md
    transition-all
    duration-300
    flex items-center justify-center
    shadow-lg
    "
                    >
                      ❮
                    </button>
                  )}

                  {/* Next */}

                  {galleryImages.length > 1 && (
                    <button
                      onClick={showNextImage}
                      className="
    absolute right-3
    sm:right-5
    top-1/2
    -translate-y-1/2
    z-30
    w-10 h-10
    sm:w-12 sm:h-12
    rounded-full
    bg-black/50
    hover:bg-indigo-600
    text-white
    backdrop-blur-md
    transition-all
    duration-300
    flex items-center justify-center
    shadow-lg
    "
                    >
                      ❯
                    </button>
                  )}
                  {/* Counter */}

                  <div
                    className="
              absolute bottom-3 left-3
              px-3 py-1 rounded-full
              text-white text-xs sm:text-sm
              "
                    style={{
                      background: "rgba(0,0,0,.6)",
                    }}
                  >
                    {currentIndex + 1} / {galleryImages.length}
                  </div>

                </div>

                {/* RIGHT PANEL */}

                <div
                  className="
            bg-white
            overflow-y-auto
            h-auto
            lg:h-[80vh]
            "
                >

                  <div className="p-4 sm:p-6">

                    {/* User */}

                    <div className="flex items-center gap-3 mb-4">

                      <div
                        className="
                  w-10 h-10
                  sm:w-12 sm:h-12
                  rounded-xl
                  flex items-center justify-center
                  "
                        style={{
                          background:
                            "linear-gradient(135deg,#4f46e5,#3b82f6)",
                        }}
                      >
                        <FaUser color="white" />
                      </div>

                      <div>

                        <h3 className="font-bold text-base sm:text-lg">
                          {selectedReview?.reviewerName}
                        </h3>

                        <div className="text-xs sm:text-sm text-slate-500">
                          {new Date(
                            selectedReview?.createdAt
                          ).toLocaleDateString()}
                        </div>

                      </div>

                    </div>
                    {/* Gallery */}

                    <div className="mt-3">
                      <div className="flex gap-3 overflow-x-auto pb-2">

                        <div
                          ref={galleryRef}
                          className="
  flex gap-3
  overflow-x-auto
  pb-2
  cursor-grab
  active:cursor-grabbing
  select-none
  "
                          onMouseDown={handleMouseDown}
                          onMouseLeave={handleMouseLeave}
                          onMouseUp={handleMouseUp}
                          onMouseMove={handleMouseMove}
                        >

                          {galleryImages.map((img, index) => (

                            <img
                              key={index}
                              src={img}
                              alt=""
                              draggable={false}
                              onClick={() => {

                                setCurrentIndex(index);
                                setSelectedImage(img);

                              }}
                              className={`
      cursor-pointer
      rounded-xl
      border-2
      flex-shrink-0
      transition-all
      duration-300
      ${selectedImage === img
                                  ? "border-indigo-500 scale-105"
                                  : "border-transparent"
                                }
      `}
                              style={{
                                width: 90,
                                height: 90,
                                objectFit: "cover",
                              }}
                            />

                          ))}

                        </div>

                      </div>

                    </div>
                    {/* Verified */}

                    <div
                      className="
                inline-flex items-center gap-2
                px-3 py-1 rounded-full
                text-xs sm:text-sm
                mb-4
                "
                      style={{
                        background:
                          "rgba(16,185,129,.1)",
                        color: "#059669",
                      }}
                    >
                      <FaCheckCircle />
                      {selectedReview?.verifiedPurchase ? "Verified Purchase" : "Customer Review"}
                    </div>

                    {/* Rating */}

                    <div className="mb-4">
                      <Stars
                        rating={selectedReview?.rating}
                        size={18}
                      />
                    </div>

                    {/* Comment */}

                    <div
                      className="text-sm sm:text-base"
                      style={{
                        lineHeight: 1.8,
                        color: "#475569",
                      }}
                    >
                      {selectedReview?.comment}
                    </div>

                    {/* Like Dislike */}

                    {/* <div className="flex gap-3 mt-6">

                <button
  onClick={() =>
    toggleLike(
      selectedReview._id,
      "like"
    )
  }
  className="
  px-4 py-2 rounded-xl
  bg-slate-100
  hover:bg-indigo-50
  hover:text-indigo-600
  flex items-center gap-2
  transition-all
  "
>
  <FaThumbsUp />
</button>

               <button
  onClick={() =>
    toggleLike(
      selectedReview._id,
      "dislike"
    )
  }
  className="
  px-4 py-2 rounded-xl
  bg-slate-100
  hover:bg-red-50
  hover:text-red-600
  flex items-center gap-2
  transition-all
  "
>
  <FaThumbsDown />
  {selectedReview?.dislikesCount || 0}
</button>

              </div> */}
                  </div>

                </div>

             </div>

            </ModalBody>

          )}
        </ModalContent>
      </Modal>


    </>
  );
}