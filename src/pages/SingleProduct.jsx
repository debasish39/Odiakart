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
import { BsLightningCharge } from "react-icons/bs";
import {
} from "react-icons/fa";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import {
  FaShoppingCart, FaHeart, FaRegHeart, FaArrowLeft, 
  FaStar, FaStarHalfAlt, FaRegStar,
  FaTag, FaTruck, FaUndoAlt, FaLock,
  FaIndustry, FaListAlt, FaRupeeSign,
  FaCheckCircle, FaShieldAlt,
  FaUser, FaThumbsUp, FaThumbsDown, FaTrash,
  FaBoxOpen, FaLayerGroup, FaInfoCircle, FaCog, FaComments,
} from "react-icons/fa";
import { IoShareOutline } from "react-icons/io5";
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@600;700;800&family=Roboto:wght@400;500;600;700&display=swap');

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
.sp-product-navbar{
  position:fixed;
  top:0;
  left:0;
  right:0;
  z-index:2000;
  width:100%;
  height:63px;
  display:flex;
  align-items:center;
  background:rgba(255,255,255,.97);
  border-bottom:1px solid #e9edf2;
  box-shadow:0 2px 16px rgba(15,23,42,.07);
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
}

.sp-product-navbar-inner{
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:0 14px;
}

.sp-product-navbar-left{
  display:flex;
  align-items:center;
  min-width:0;
  flex:1;
}

.sp-product-navbar-back,
.sp-product-navbar-action{
  width:40px;
  height:40px;
  flex:0 0 40px;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0;
  border:0;
  border-radius:50%;
  background:#f4f6f9;
  color:#18202b;
  cursor:pointer;
  -webkit-tap-highlight-color:transparent;
  transition:background .18s ease,transform .18s ease,box-shadow .18s ease,color .18s ease;
}

.sp-product-navbar-back:hover,
.sp-product-navbar-action:hover{
  background:#e9edf3;
  box-shadow:0 4px 12px rgba(15,23,42,.08);
}

.sp-product-navbar-back:active,
.sp-product-navbar-action:active{
  transform:scale(.94);
}

.sp-product-navbar-back:focus-visible,
.sp-product-navbar-action:focus-visible{
  outline:2px solid #94a3b8;
  outline-offset:2px;
}

/* Initial state */
.sp-product-navbar-title{
  margin-left:11px;
  color:#171a1f;
  font-size:17px;
  font-weight:600;
  letter-spacing:-.02em;
  white-space:nowrap;
}

/* Scrolled state: thumbnail + price only */
.sp-product-navbar-product{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  min-width:0;
  flex-wrap:no-wrap;
  margin-left:10px;
  animation:spNavbarIn .22s ease both;
}

@keyframes spNavbarIn{
  from{opacity:0;transform:translateX(-7px)}
  to{opacity:1;transform:translateX(0)}
}

.sp-product-navbar-thumb{
  width:38px;
  height:38px;
  flex:0 0 38px;
  object-fit:contain;
  border-radius:9px;
  background:#f8fafc;
  border:1px solid #e7ebf0;
}

.sp-product-navbar-price{
  color:#1769e0;
  font-size:17px;
  font-weight:800;
  line-height:1;
  letter-spacing:-.025em;
  white-space:nowrap;
}

.sp-product-navbar-actions{
  display:flex;
  align-items:center;
  gap:8px;
  margin-left:10px;
}

.sp-product-navbar-wishlist.active{
  color:#e11d48;
  background:#fff1f2;
}

.sp-product-navbar-icon{
  display:block;
  flex-shrink:0;
}

.sp-bg{
  padding-top:55px;
}

@media(max-width:600px){
  .sp-product-navbar{height:58px}

  .sp-product-navbar-inner{
    padding:0 12px;
  }

  .sp-product-navbar-back,
  .sp-product-navbar-action{
    width:40px;
    height:40px;
    flex-basis:40px;
  }

  .sp-product-navbar-title{
    margin-left:10px;
    font-size:17px;
  }

  .sp-product-navbar-product{
    gap:9px;
    margin-left:9px;
  }

  .sp-product-navbar-thumb{
    width:38px;
    height:38px;
    flex-basis:38px;
  }

  .sp-product-navbar-price{
    font-size:16px;
  }

  .sp-product-navbar-actions{
    gap:7px;
    margin-left:8px;
  }
}

@media(max-width:360px){
  .sp-product-navbar-inner{padding:0 9px}

  .sp-product-navbar-back,
  .sp-product-navbar-action{
    width:38px;
    height:38px;
    flex-basis:38px;
  }

  .sp-product-navbar-title{
    margin-left:9px;
    font-size:16px;
  }

  .sp-product-navbar-product{
    gap:8px;
    margin-left:8px;
  }

  .sp-product-navbar-thumb{
    width:36px;
    height:36px;
    flex-basis:36px;
  }

  .sp-product-navbar-price{
    font-size:15px;
  }

  .sp-product-navbar-actions{
    gap:5px;
    margin-left:5px;
  }
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
// .spx-thumb:hover:after{background:#c7d2fe}

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

/* =========================================================
   MODERN PRODUCT UI/UX — FINAL OVERRIDES
   ========================================================= */
.sp-mobile-product-summary,.sp-mobile-about{display:none}

@media (min-width:769px){
  .sp-bg{
    background:
      radial-gradient(circle at 10% 5%,rgba(79,70,229,.055),transparent 26%),
      radial-gradient(circle at 90% 12%,rgba(37,99,235,.045),transparent 24%),
      #f7f9fc;
  }
  .spx-wrap{
    width:min(1380px,100%);
    grid-template-columns:minmax(0,600px) minmax(420px,1fr);
    gap:42px;
    padding:32px 28px 110px;
  }
  .spx-gallery{border-radius:28px;box-shadow:0 18px 55px rgba(15,23,42,.08)}
  .spx-slide{min-height:560px;padding:50px}
  .spx-right{gap:14px}
  .spx-card{border-radius:22px;box-shadow:0 8px 30px rgba(15,23,42,.045)}
  .spx-title{font-size:clamp(1.8rem,2.7vw,2.55rem);line-height:1.1}
  .spx-price{font-size:clamp(2.2rem,3vw,3rem)}
  .spx-btn{min-height:56px;border-radius:16px}
}

@media (max-width:768px){
  html,body{background:#fff}
  .sp-bg{
    min-height:100dvh;
    padding-top:58px !important;
    background:#fff !important;
  }
  .spx-wrap{
    width:100%;
    display:flex !important;
    flex-direction:column;
    gap:0 !important;
    padding:0 0 calc(92px + env(safe-area-inset-bottom)) !important;
  }
  .spx-left,.spx-right{width:100%;display:contents !important}

  /* NAVBAR */
  .sp-product-navbar{
    height:58px !important;
    background:rgba(255,255,255,.94) !important;
    border-bottom:1px solid #eceff3 !important;
    box-shadow:0 4px 18px rgba(15,23,42,.06) !important;
    backdrop-filter:blur(20px) !important;
  }
  .sp-product-navbar-inner{padding:0 14px !important}
  .sp-product-navbar-back,.sp-product-navbar-action{
    width:40px !important;height:40px !important;flex-basis:40px !important;
    background:#f4f6f8 !important;color:#17202b !important;box-shadow:none !important;
  }
  .sp-product-navbar-title{margin-left:11px !important;font-size:16px !important;font-weight:750 !important}
  .sp-product-navbar-product{margin-left:10px !important;gap:9px !important}
  .sp-product-navbar-thumb{width:39px !important;height:39px !important;flex-basis:39px !important;border-radius:11px !important}
  .sp-product-navbar-product > div:nth-child(2){
    max-width:125px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
    font-size:12px !important;font-weight:750 !important;color:#20242a !important;
  }
  .sp-product-navbar-price{font-size:12px !important;font-weight:900 !important;color:#2563eb !important}
  .sp-product-navbar-actions{gap:7px !important;margin-left:8px !important}

  /* GALLERY */
  .spx-gallery{width:100%;border:0 !important;border-radius:0 !important;box-shadow:none !important;background:#fff !important}
  .spx-slide{
    height:365px !important;min-height:365px !important;
    padding:16px 34px !important;background:#fff !important;
  }
  .spx-img{width:100% !important;max-height:340px !important;filter:none !important}
  .spx-disc{
    top:14px !important;left:14px !important;padding:6px 9px !important;
    border:0 !important;border-radius:999px !important;background:#eff6ff !important;
    color:#2563eb !important;font-size:9px !important;
  }
  .spx-cnt{
    right:14px !important;bottom:13px !important;padding:5px 8px !important;
    border:0 !important;border-radius:999px !important;background:#f3f4f6 !important;color:#6b7280 !important;
  }
  .spx-thumbs{
    width:100%;padding:9px 14px !important;
    border-top:1px solid #eef0f3 !important;border-bottom:1px solid #eef0f3 !important;
    background:#fff !important;gap:8px !important;
  }
  .spx-thumb{
    width:58px !important;height:58px !important;flex-basis:58px !important;
    border-radius:11px !important;border:1px solid #e8ebef !important;background:#fff !important;
  }
  .spx-thumb.on{border:2px solid #2563eb !important;transform:none !important}

  /* MOBILE PRODUCT SUMMARY */
  .sp-mobile-product-summary{
    display:block;width:100%;padding:17px 28px 16px;background:#fff;border-bottom:1px solid #e7eaee;
  }
  .sp-mobile-product-summary-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
  .sp-mobile-product-summary-title-wrap{min-width:0;flex:1}
  .sp-mobile-product-summary h1{
    margin:0;color:#171a1f;font-family:Manrope,Inter,system-ui,sans-serif;
    font-size:20px;line-height:1.25;font-weight:800;letter-spacing:-.025em;overflow-wrap:anywhere;
  }
  .sp-mobile-product-summary p{
    margin:7px 0 0 !important;color:#7b818b !important;font-family:Inter,system-ui,sans-serif !important;
    font-size:12px !important;line-height:1.55 !important;display:-webkit-box;
    -webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  }
  .sp-mobile-summary-wish{
    width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;
    border:1px solid #e4e7eb;border-radius:50%;background:#fff;color:#27303a;transition:.18s ease;
  }
  .sp-mobile-summary-wish.is-active{color:#e11d48;background:#fff1f2;border-color:#fecdd3}
  .sp-mobile-summary-wish:active{transform:scale(.91)}
  .sp-mobile-summary-rating{
    display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:14px;
    font-size:11px;font-weight:650;color:#7b818a;
  }
  .sp-mobile-rating-badge{
    display:inline-flex;align-items:center;gap:4px;padding:6px 9px;border-radius:9px;
    background:#22c55e;color:#fff;font-size:11px;font-weight:850;
  }
  .sp-mobile-rating-separator{color:#d1d5db}
  .sp-mobile-summary-price-row{display:flex;align-items:baseline;flex-wrap:wrap;gap:9px;margin-top:17px}
  .sp-mobile-summary-price{
    display:flex;align-items:baseline;gap:2px;color:#111827;font-size:30px;line-height:1;
    font-weight:900;letter-spacing:-.045em;
  }
  .sp-mobile-summary-old-price{color:#9ca3af;font-size:13px;font-weight:600;text-decoration:line-through}
  .sp-mobile-summary-discount{padding:4px 7px;border-radius:6px;background:#ecfdf3;color:#07883b;font-size:10px;font-weight:850}
  .sp-mobile-stock-row{
    display:flex;align-items:center;gap:8px;margin-top:13px;color:#169447;font-size:13px;font-weight:750;
  }
  .sp-mobile-stock-row.out{color:#dc2626}
  .sp-mobile-stock-dot{
    width:9px;height:9px;flex:0 0 9px;border-radius:50%;background:#22c55e;
    box-shadow:0 0 0 4px #dcfce7;
  }
  .sp-mobile-stock-row.out .sp-mobile-stock-dot{background:#ef4444;box-shadow:0 0 0 4px #fee2e2}

  /* HIDE DUPLICATES */
  .spx-right > .spx-card[style*="22px 24px"],
  .spx-right > .spx-card[style*="20px 24px"]{display:none !important}
  .spx-seller,.spx-inline-cta{display:none !important}

  /* VARIANTS */
  .spx-right > .spx-card[style*="display: flex"]{
    display:flex !important;flex-direction:column !important;gap:0 !important;
    width:100%;padding:0 28px !important;border:0 !important;border-radius:0 !important;
    box-shadow:none !important;background:#fff !important;
  }
  .spx-right > .spx-card[style*="display: flex"] > div{
    padding:22px 0;border-bottom:1px solid #e8ebef;
  }
  .spx-right > .spx-card[style*="display: flex"] > div:last-child{border-bottom:0}
  .spx-label{
    margin-bottom:13px !important;color:#1d232a !important;font-family:Manrope,Inter,sans-serif !important;
    font-size:17px !important;font-weight:800 !important;letter-spacing:-.02em !important;text-transform:none !important;
  }
  .spx-label span{color:#2563eb !important;font-size:12px !important;font-family:Inter,sans-serif !important}
  .spx-size{
    min-width:104px !important;min-height:70px !important;padding:0 20px !important;
    border:2px solid #3b82f6 !important;border-radius:16px !important;background:#eff6ff !important;
    color:#2563eb !important;font-size:16px !important;font-weight:800 !important;box-shadow:none !important;
  }
  .spx-size.on{background:#eff6ff !important;color:#2563eb !important;border-color:#2563eb !important;box-shadow:none !important}
  .spx-size.on::after{
    content:"✓";display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;
    margin-left:8px;border-radius:50%;background:#2563eb;color:#fff;font-size:12px;font-weight:900;
  }
  .spx-cd{
    width:auto !important;min-width:112px;height:70px !important;padding:0 18px !important;
    border:2px solid #3b82f6 !important;border-radius:16px !important;box-shadow:none !important;
  }
  .spx-cd.on{box-shadow:none !important}
  .spx-cd.on::after{
    content:"✓";display:flex;align-items:center;justify-content:center;position:absolute;
    width:22px;height:22px;border-radius:50%;background:#2563eb;color:#fff;font-size:12px;font-weight:900;
  }
  .spx-right > .spx-card[style*="display: flex"] > div:last-child{
    display:flex !important;align-items:center !important;justify-content:space-between !important;gap:12px;
  }
  .spx-right > .spx-card[style*="display: flex"] > div:last-child .spx-label{margin:0 !important}
  .spx-qty{height:54px !important;border:1px solid #e1e5ea !important;border-radius:15px !important;background:#f7f8fa !important}
  .spx-qb{width:52px !important;height:54px !important;color:#111827 !important;font-size:23px !important}
  .spx-qn{width:58px !important;height:54px !important;display:flex;align-items:center;justify-content:center;background:#fff;font-size:16px !important}

  /* DELIVERY */
  .spx-right > .spx-card[style*="serviceability"]{
    margin-top:0 !important;border-top:1px solid #e8ebef !important;border-bottom:1px solid #e8ebef !important;
    border-radius:0 !important;box-shadow:none !important;padding:18px 28px !important;
  }

  /* ABOUT */
  .sp-mobile-about{
    display:block;padding:23px 28px 22px;background:#fff;border-top:1px solid #e8ebef;border-bottom:1px solid #e8ebef;
  }
  .sp-mobile-section-heading h2{
    margin:0;color:#1d232a;font-family:Manrope,Inter,sans-serif;font-size:23px;line-height:1.2;
    font-weight:850;letter-spacing:-.03em;
  }
  .sp-mobile-about p{
    margin:12px 0 0 !important;color:#737983 !important;font-size:13.5px !important;line-height:1.7 !important;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  }
  .sp-mobile-read-more{
    margin-top:10px;padding:0;border:0;background:transparent;color:#2563eb;font-size:12px;font-weight:850;cursor:pointer;
  }

  /* ACCORDIONS */
  .spx-right > .spx-card[style*="padding: 0"]{border-radius:0 !important;box-shadow:none !important;background:#fff !important}
  .spx-accordion{border-left:0 !important;border-right:0 !important;border-radius:0 !important;border-color:#e7eaee !important}
  .spx-accordion-head{min-height:58px !important;padding:12px 28px !important}
  .spx-accordion-body{padding:0 28px 18px !important}

  /* RELATED */
  .spx-related-accordion{width:100%;padding:0 0 calc(82px + env(safe-area-inset-bottom)) !important;margin:0 !important}
  .spx-related-accordion .spx-accordion-head{padding-left:28px !important;padding-right:28px !important}
  .spx-related-body{padding:5px 14px 14px !important}
  .spx-related-grid{gap:10px !important}

  /* BOTTOM ACTIONS */
  .sp-mobile-buybar{
    position:fixed !important;left:0 !important;right:0 !important;bottom:0 !important;z-index:2500 !important;
    display:flex !important;align-items:center;gap:10px !important;
    padding:9px 18px calc(9px + env(safe-area-inset-bottom)) !important;
    background:rgba(255,255,255,.96) !important;border-top:1px solid #e5e7eb !important;
    box-shadow:0 -8px 30px rgba(15,23,42,.10) !important;backdrop-filter:blur(20px) !important;
  }
  .sp-mobile-cart,.sp-mobile-buy{
    min-height:56px !important;border-radius:17px !important;font-size:13px !important;font-weight:900 !important;
    transition:transform .18s ease,box-shadow .18s ease !important;
  }
  .sp-mobile-cart{
    flex:1 !important;display:flex !important;align-items:center;justify-content:center;gap:8px;
    border:2px solid #2563eb !important;background:#fff !important;color:#2563eb !important;
  }
  .sp-mobile-buy{
    flex:1 !important;display:flex !important;align-items:center;justify-content:center;gap:7px;
    border:0 !important;background:linear-gradient(135deg,#2563eb,#1d4ed8) !important;color:#fff !important;
    box-shadow:0 8px 20px rgba(37,99,235,.24);
  }
  .sp-mobile-buy-price{opacity:.9;font-size:11px;font-weight:750}
  .sp-mobile-cart:active,.sp-mobile-buy:active{transform:scale(.97)}
}

@media(max-width:420px){
  .spx-slide{height:340px !important;min-height:340px !important;padding-left:25px !important;padding-right:25px !important}
  .spx-img{max-height:320px !important}
  .sp-mobile-product-summary{padding-left:24px;padding-right:24px}
  .sp-mobile-product-summary h1{font-size:19px}
  .sp-mobile-summary-price{font-size:28px}
  .spx-right > .spx-card[style*="display: flex"]{padding-left:24px !important;padding-right:24px !important}
  .sp-mobile-about{padding-left:24px;padding-right:24px}
  .sp-mobile-buybar{padding-left:14px !important;padding-right:14px !important}
}


/* =========================================================
   PLAY-STORE STYLE POLISH
   Compact typography, calm surfaces, consistent touch targets
   ========================================================= */

.sp{
  font-family:Roboto,Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
  text-rendering:optimizeLegibility;
}

/* Desktop typography */
.spx-title{
  font-family:Roboto,Inter,sans-serif !important;
  font-size:25px !important;
  line-height:1.30 !important;
  font-weight:500 !important;
  letter-spacing:-.012em !important;
}

.spx-price{
  font-family:Roboto,Inter,sans-serif !important;
  font-size:31px !important;
  line-height:38px !important;
  font-weight:500 !important;
  letter-spacing:-.025em !important;
}

.spx-label{
  font-family:Roboto,Inter,sans-serif !important;
  font-size:13px !important;
  line-height:18px !important;
  font-weight:600 !important;
  letter-spacing:0 !important;
  text-transform:none !important;
}

.spx-card{
  border-color:#e5e7eb;
  border-radius:16px;
  box-shadow:0 1px 2px rgba(60,64,67,.05),0 5px 16px rgba(60,64,67,.045);
}

.spx-card:hover{
  transform:none !important;
  box-shadow:0 2px 10px rgba(60,64,67,.07);
}

.spx-btn{
  min-height:48px;
  border-radius:12px;
  font-size:14px;
  line-height:20px;
  font-weight:600;
}

/* Keep all icon buttons comfortably tappable */
.sp-product-navbar-back,
.sp-product-navbar-action{
  width:42px;
  height:42px;
  min-width:42px;
}

@media(max-width:768px){

  /* ---- overall app rhythm ---- */
  .sp-bg{
    padding-top:58px !important;
    background:#fff !important;
  }

  .spx-wrap{
    padding-bottom:88px !important;
  }

  /* ---- navbar ---- */
  .sp-product-navbar{
    height:58px !important;
    background:rgba(255,255,255,.97) !important;
    border-bottom:1px solid #e8eaed !important;
    box-shadow:0 1px 8px rgba(60,64,67,.10) !important;
  }

  .sp-product-navbar-inner{
    padding:0 10px !important;
  }

  .sp-product-navbar-back,
  .sp-product-navbar-action{
    width:40px !important;
    height:40px !important;
    min-width:40px !important;
    flex-basis:40px !important;
    background:transparent !important;
    color:#3c4043 !important;
  }

  .sp-product-navbar-back:hover,
  .sp-product-navbar-action:hover{
    background:#f1f3f4 !important;
  }

  .sp-product-navbar-title{
    margin-left:5px !important;
    color:#202124 !important;
    font-size:15px !important;
    line-height:20px !important;
    font-weight:500 !important;
    letter-spacing:0 !important;
  }

  .sp-product-navbar-product{
    gap:8px !important;
    margin-left:5px !important;
  }

  .sp-product-navbar-thumb{
    width:36px !important;
    height:36px !important;
    flex-basis:36px !important;
    border-radius:9px !important;
  }

  .sp-product-navbar-product > div:nth-child(2){
    display:none !important;
  }

  .sp-product-navbar-price{
    color:#1a73e8 !important;
    font-size:13px !important;
    line-height:18px !important;
    font-weight:700 !important;
  }

  .sp-product-navbar-actions{
    gap:0 !important;
    margin-left:3px !important;
  }

  /* ---- product image ---- */
  .spx-gallery{
    border:0 !important;
    border-radius:0 !important;
    box-shadow:none !important;
  }

  .spx-slide{
    height:365px !important;
    min-height:365px !important;
    padding:18px 28px !important;
    background:#fff !important;
  }

  .spx-img{
    max-height:335px !important;
    filter:none !important;
  }

  .spx-disc{
    top:12px !important;
    left:12px !important;
    padding:5px 8px !important;
    border:0 !important;
    border-radius:999px !important;
    background:#fce8e6 !important;
    color:#c5221f !important;
    font-size:9px !important;
    line-height:12px !important;
    font-weight:600 !important;
  }

  .spx-cnt{
    right:12px !important;
    bottom:12px !important;
    padding:4px 7px !important;
    border:0 !important;
    border-radius:999px !important;
    background:rgba(32,33,36,.70) !important;
    color:#fff !important;
    font-size:9px !important;
    line-height:13px !important;
  }

  /* ---- thumbnails ---- */
  .spx-thumbs{
    padding:8px 12px !important;
    gap:7px !important;
    border-top:1px solid #f1f3f4 !important;
    border-bottom:1px solid #f1f3f4 !important;
    background:#fff !important;
  }

  .spx-thumb{
    width:54px !important;
    height:54px !important;
    flex-basis:54px !important;
    border:1px solid #dadce0 !important;
    border-radius:9px !important;
    box-shadow:none !important;
  }

  .spx-thumb.on{
    border:2px solid #1a73e8 !important;
  }

  /* ---- title / rating / price hierarchy ---- */
  .sp-mobile-product-summary{
    display:block !important;
    padding:16px !important;
    background:#fff !important;
    border-bottom:7px solid #f1f3f4 !important;
  }

  .sp-mobile-product-summary h1{
    font-family:Roboto,Inter,sans-serif !important;
    font-size:18px !important;
    line-height:24px !important;
    font-weight:500 !important;
    letter-spacing:-.008em !important;
    color:#202124 !important;
  }

  .sp-mobile-product-summary p{
    margin-top:6px !important;
    color:#5f6368 !important;
    font-size:12px !important;
    line-height:18px !important;
    font-weight:400 !important;
  }

  .sp-mobile-summary-wish{
    width:40px !important;
    height:40px !important;
    flex-basis:40px !important;
    border:1px solid #dadce0 !important;
    background:#fff !important;
  }

  .sp-mobile-summary-rating{
    margin-top:11px !important;
    gap:7px !important;
    color:#5f6368 !important;
    font-size:11px !important;
    line-height:16px !important;
    font-weight:400 !important;
  }

  .sp-mobile-rating-badge{
    padding:4px 7px !important;
    border-radius:6px !important;
    background:#188038 !important;
    font-size:10px !important;
    line-height:14px !important;
    font-weight:600 !important;
  }

  .sp-mobile-summary-price-row{
    margin-top:12px !important;
    gap:8px !important;
  }

  .sp-mobile-summary-price{
    font-family:Roboto,Inter,sans-serif !important;
    font-size:26px !important;
    line-height:32px !important;
    font-weight:500 !important;
    letter-spacing:-.025em !important;
    color:#202124 !important;
  }

  .sp-mobile-summary-price svg{
    width:13px !important;
    height:13px !important;
  }

  .sp-mobile-summary-old-price{
    font-size:12px !important;
    line-height:16px !important;
    color:#80868b !important;
    font-weight:400 !important;
  }

  .sp-mobile-summary-discount{
    padding:3px 6px !important;
    border-radius:5px !important;
    background:#e6f4ea !important;
    color:#188038 !important;
    font-size:9px !important;
    line-height:13px !important;
    font-weight:600 !important;
  }

  .sp-mobile-stock-row{
    margin-top:9px !important;
    gap:7px !important;
    color:#188038 !important;
    font-size:11px !important;
    line-height:16px !important;
    font-weight:500 !important;
  }

  .sp-mobile-stock-dot{
    width:7px !important;
    height:7px !important;
    flex-basis:7px !important;
    box-shadow:none !important;
  }

  /* ---- variant controls ---- */
  .spx-right > .spx-card[style*="display: flex"]{
    padding:0 16px !important;
    border:0 !important;
    border-radius:0 !important;
    box-shadow:none !important;
  }

  .spx-right > .spx-card[style*="display: flex"] > div{
    padding:17px 0 !important;
    border-bottom:1px solid #f1f3f4 !important;
  }

  .spx-label{
    margin-bottom:9px !important;
    font-size:14px !important;
    line-height:19px !important;
    font-weight:600 !important;
    color:#3c4043 !important;
  }

  .spx-label span{
    color:#1a73e8 !important;
    font-size:12px !important;
    font-weight:500 !important;
  }

  .spx-size{
    min-width:58px !important;
    min-height:42px !important;
    padding:0 13px !important;
    border:1px solid #dadce0 !important;
    border-radius:9px !important;
    background:#fff !important;
    color:#3c4043 !important;
    font-size:13px !important;
    line-height:18px !important;
    font-weight:500 !important;
    box-shadow:none !important;
  }

  .spx-size.on{
    border-color:#1a73e8 !important;
    background:#e8f0fe !important;
    color:#174ea6 !important;
    box-shadow:inset 0 0 0 1px #1a73e8 !important;
  }

  .spx-size.on::after{
    width:15px !important;
    height:15px !important;
    margin-left:6px !important;
    background:#1a73e8 !important;
    font-size:9px !important;
  }

  .spx-cd{
    width:30px !important;
    min-width:30px !important;
    height:30px !important;
  }

  .spx-qty{
    height:42px !important;
    border-radius:9px !important;
  }

  .spx-qb{
    width:39px !important;
    height:42px !important;
    font-size:18px !important;
  }

  .spx-qn{
    width:40px !important;
    height:42px !important;
    font-size:13px !important;
  }

  /* ---- delivery ---- */
  .spx-right > .spx-card[style*="serviceability"]{
    margin-top:7px !important;
    padding:16px !important;
    border:0 !important;
    border-top:7px solid #f1f3f4 !important;
    border-bottom:1px solid #f1f3f4 !important;
    border-radius:0 !important;
    box-shadow:none !important;
  }

  .spx-right > .spx-card[style*="serviceability"] input{
    min-height:44px !important;
    font-size:13px !important;
  }

  /* ---- trust row ---- */
  .spx-right > div[style*="gridTemplateColumns"]{
    display:grid !important;
    grid-template-columns:1fr 1fr !important;
    gap:0 !important;
    border-top:7px solid #f1f3f4;
    border-bottom:7px solid #f1f3f4;
  }

  .spx-tr{
    min-height:50px !important;
    padding:9px 12px !important;
    border:0 !important;
    border-radius:0 !important;
    box-shadow:none !important;
    background:#fff !important;
    color:#3c4043 !important;
    font-size:11px !important;
    line-height:15px !important;
    font-weight:500 !important;
  }

  .spx-right > div[style*="gridTemplateColumns"] .spx-tr:nth-child(odd){
    border-right:1px solid #f1f3f4 !important;
  }

  .spx-right > div[style*="gridTemplateColumns"] .spx-tr:nth-child(-n+2){
    border-bottom:1px solid #f1f3f4 !important;
  }

  /* ---- about section ---- */
  .sp-mobile-about{
    display:block !important;
    padding:18px 16px !important;
    border-bottom:7px solid #f1f3f4 !important;
    background:#fff !important;
  }

  .sp-mobile-section-heading h2{
    font-family:Roboto,Inter,sans-serif !important;
    margin:0 !important;
    color:#202124 !important;
    font-size:16px !important;
    line-height:22px !important;
    font-weight:600 !important;
  }

  .sp-mobile-about p{
    margin:8px 0 0 !important;
    color:#5f6368 !important;
    font-size:12.5px !important;
    line-height:19px !important;
  }

  .sp-mobile-read-more{
    margin-top:8px !important;
    color:#1a73e8 !important;
    font-size:12px !important;
    line-height:18px !important;
    font-weight:600 !important;
  }

  /* ---- information ---- */
  .spx-right > .spx-card[style*="padding: 0"]{
    border:0 !important;
    border-radius:0 !important;
    box-shadow:none !important;
  }

  .spx-accordion{
    border-left:0 !important;
    border-right:0 !important;
    border-radius:0 !important;
    border-color:#e8eaed !important;
  }

  .spx-accordion-head{
    min-height:54px !important;
    padding:10px 16px !important;
    color:#202124 !important;
    font-size:14px !important;
    line-height:20px !important;
    font-weight:600 !important;
  }

  .spx-accordion-icon{
    width:30px !important;
    height:30px !important;
    flex-basis:30px !important;
    border-radius:8px !important;
    background:#e8f0fe !important;
    color:#1967d2 !important;
  }

  .spx-accordion-meta{
    font-size:10px !important;
    line-height:14px !important;
  }

  .spx-accordion-body{
    padding:0 16px 16px !important;
  }

  /* ---- reviews ---- */
  .spx-review-hero{
    grid-template-columns:1fr !important;
    gap:12px !important;
    padding:13px !important;
    border-radius:12px !important;
  }

  .spx-review-score{
    border-right:0 !important;
    border-bottom:1px solid #e8eaed !important;
    padding-bottom:12px !important;
  }

  .spx-review-score-num{
    font-size:34px !important;
    line-height:38px !important;
    font-weight:500 !important;
  }

  .spx-review-toolbar{
    display:block !important;
  }

  .spx-review-filter-scroll{
    margin-bottom:7px !important;
  }

  .spx-review-chip{
    padding:6px 9px !important;
    font-size:10px !important;
    line-height:14px !important;
  }

  .spx-review-sort{
    width:100% !important;
    min-height:38px !important;
    font-size:11px !important;
  }

  .spx-modern-review{
    padding:12px !important;
    border-radius:11px !important;
    box-shadow:none !important;
  }

  .spx-review-name{
    font-size:12px !important;
    line-height:16px !important;
  }

  .spx-review-comment{
    font-size:11.5px !important;
    line-height:18px !important;
  }

  .spx-review-photo{
    width:68px !important;
    height:68px !important;
    min-width:68px !important;
    border-radius:8px !important;
  }

  /* ---- related products ---- */
  .spx-related-accordion{
    padding:0 0 calc(82px + env(safe-area-inset-bottom)) !important;
  }

  .spx-related-accordion .spx-accordion-head{
    padding-left:16px !important;
    padding-right:16px !important;
  }

  .spx-related-body{
    padding:4px 12px 12px !important;
  }

  .spx-related-grid{
    display:flex !important;
    overflow-x:auto;
    gap:9px !important;
    padding:2px 0 7px;
  }

  .spx-related-grid > *{
    flex:0 0 168px;
    min-width:168px;
  }

  /* ---- sticky checkout bar ---- */
  .sp-mobile-buybar{
    position:fixed !important;
    left:0 !important;
    right:0 !important;
    bottom:0 !important;
    z-index:3500 !important;
    display:flex !important;
    gap:8px !important;
    padding:8px 12px calc(8px + env(safe-area-inset-bottom)) !important;
    background:rgba(255,255,255,.97) !important;
    border-top:1px solid #dadce0 !important;
    box-shadow:0 -3px 14px rgba(60,64,67,.12) !important;
    backdrop-filter:blur(18px) !important;
  }

  .sp-mobile-cart,
  .sp-mobile-buy{
    min-height:50px !important;
    border-radius:12px !important;
    font-size:13px !important;
    line-height:18px !important;
    font-weight:600 !important;
  }

  .sp-mobile-cart{
    flex:1 !important;
    background:#fff !important;
    border:1px solid #1a73e8 !important;
    color:#1a73e8 !important;
  }

  .sp-mobile-buy{
    flex:1 !important;
    background:#1a73e8 !important;
    color:#fff !important;
    box-shadow:0 2px 7px rgba(26,115,232,.24) !important;
  }

  .sp-mobile-buy-price{
    font-size:11px !important;
    line-height:15px !important;
    font-weight:500 !important;
  }
}

@media(max-width:380px){
  .spx-slide{
    height:340px !important;
    min-height:340px !important;
    padding-left:22px !important;
    padding-right:22px !important;
  }

  .spx-img{
    max-height:315px !important;
  }

  .sp-mobile-product-summary{
    padding-left:14px !important;
    padding-right:14px !important;
  }

  .sp-mobile-product-summary h1{
    font-size:17px !important;
    line-height:23px !important;
  }

  .sp-mobile-summary-price{
    font-size:24px !important;
    line-height:30px !important;
  }

  .spx-right > .spx-card[style*="display: flex"]{
    padding-left:14px !important;
    padding-right:14px !important;
  }

  .sp-mobile-about{
    padding-left:14px !important;
    padding-right:14px !important;
  }

  .sp-mobile-buybar{
    padding-left:10px !important;
    padding-right:10px !important;
  }
}

@media(prefers-reduced-motion:reduce){
  .sp *,
  .sp *::before,
  .sp *::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
    scroll-behavior:auto !important;
  }
}


/* =========================================================
   ODikart — Ratings & Reviews premium UI
   Scoped ONLY to this product page
   ========================================================= */
.rp-modern-page .rp-content{
  position:relative;
}

.rp-modern-page .rp-content::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 8% 8%,rgba(99,102,241,.045),transparent 24%),
    radial-gradient(circle at 92% 20%,rgba(59,130,246,.035),transparent 22%);
}

.rp-modern-page .rp-card{
  position:relative;
  overflow:hidden;
  border:1px solid rgba(226,232,240,.9);
  box-shadow:0 8px 28px rgba(15,23,42,.045);
  transition:transform .22s ease,border-color .22s ease,box-shadow .22s ease;
}

.rp-modern-page .rp-card::after{
  content:"";
  position:absolute;
  top:-120%;
  left:-55%;
  width:42%;
  height:340%;
  pointer-events:none;
  transform:rotate(24deg);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent);
  opacity:0;
  transition:left .65s ease,opacity .2s ease;
}

.rp-modern-page .rp-card:hover{
  transform:translateY(-2px);
  border-color:#d7defa;
  box-shadow:0 15px 38px rgba(15,23,42,.075);
}

.rp-modern-page .rp-card:hover::after{
  left:120%;
  opacity:1;
}

.rp-modern-page .rp-divider{
  background:linear-gradient(180deg,transparent,#dbe3f0 18%,#dbe3f0 82%,transparent);
}

.rp-modern-page .rp-content > .space-y-3{
  position:relative;
  z-index:1;
}

/* Rating summary */
.rp-modern-page .rp-content > .space-y-3 > .rp-content{
  position:relative;
  overflow:hidden;
  border:1px solid #e2e8f0;
  background:
    radial-gradient(circle at 14% 50%,rgba(245,158,11,.07),transparent 25%),
    linear-gradient(135deg,#fff 0%,#f8faff 52%,#fff 100%);
  box-shadow:0 10px 32px rgba(79,70,229,.055);
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content::after{
  content:"";
  position:absolute;
  inset:-40%;
  pointer-events:none;
  background:linear-gradient(110deg,transparent 42%,rgba(255,255,255,.62) 50%,transparent 58%);
  transform:translateX(-45%);
  animation:rpSummaryShine 5s ease-in-out infinite;
}

@keyframes rpSummaryShine{
  0%,58%{transform:translateX(-45%);opacity:0}
  66%{opacity:1}
  84%,100%{transform:translateX(45%);opacity:0}
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content > div{
  position:relative;
  z-index:1;
}

/* Big rating */
.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:first-child > div:first-child{
  position:relative;
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:first-child > div:first-child::before{
  content:"";
  position:absolute;
  width:112px;
  height:112px;
  border-radius:50%;
  background:radial-gradient(circle,rgba(245,158,11,.14),transparent 68%);
  filter:blur(2px);
  z-index:-1;
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:first-child svg{
  filter:drop-shadow(0 3px 6px rgba(245,158,11,.22));
  transition:transform .18s ease;
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:first-child:hover svg{
  transform:translateY(-2px) scale(1.04);
}

/* Distribution rows: 5 ★ | bar | count */
.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:last-child .group{
  position:relative;
  min-height:31px;
  padding:5px 7px;
  border-radius:10px;
  transition:background .18s ease,transform .18s ease;
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:last-child .group:hover{
  background:rgba(238,242,255,.72);
  transform:translateX(2px);
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:last-child .group > span:first-child{
  width:40px;
  color:#475569;
  font-weight:800;
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:last-child .group > span:nth-child(2){
  height:9px;
  border-radius:999px;
  background:#e8edf5;
  box-shadow:inset 0 1px 2px rgba(15,23,42,.05);
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:last-child .group > span:nth-child(2) > span{
  display:block;
  height:100%;
  border-radius:inherit;
  background:linear-gradient(90deg,#f59e0b,#fbbf24,#fde68a);
  box-shadow:0 2px 7px rgba(245,158,11,.22);
  position:relative;
  overflow:hidden;
}

.rp-modern-page .rp-content > .space-y-3 > .rp-content
  > div:last-child .group > span:nth-child(2) > span::after{
  content:"";
  position:absolute;
  inset:0;
  width:45%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.6),transparent);
  transform:translateX(-140%);
  animation:rpBarShine 3.8s ease-in-out infinite;
}

@keyframes rpBarShine{
  0%,62%{transform:translateX(-140%)}
  82%,100%{transform:translateX(250%)}
}

/* Filter pills */
.rp-modern-page .rp-content button.rounded-full{
  box-shadow:0 2px 8px rgba(15,23,42,.035);
}

.rp-modern-page .rp-content button.rounded-full:hover{
  transform:translateY(-1px);
}

/* Sort control */
.rp-modern-page .rp-content select{
  border-color:#dfe5ef;
  box-shadow:0 3px 10px rgba(15,23,42,.035);
  transition:border-color .18s ease,box-shadow .18s ease;
}

.rp-modern-page .rp-content select:hover{
  border-color:#c7d2fe;
}

/* Review cards */
.rp-modern-page article.rp-card{
  background:linear-gradient(145deg,#fff,#fcfdff);
}

.rp-modern-page article.rp-card > div:first-child{
  align-items:center;
}

.rp-modern-page article.rp-card img{
  transition:transform .22s ease,box-shadow .22s ease;
}

.rp-modern-page article.rp-card:hover img{
  box-shadow:0 6px 16px rgba(15,23,42,.1);
}

.rp-modern-page article.rp-card .bg-gradient-to-br.from-indigo-500{
  box-shadow:0 5px 14px rgba(79,70,229,.2);
}

.rp-modern-page article.rp-card .bg-amber-50{
  border:1px solid #fde7a8;
  box-shadow:0 3px 9px rgba(245,158,11,.08);
}

.rp-modern-page article.rp-card p{
  color:#334155;
  letter-spacing:-.005em;
}

/* Review media */
.rp-modern-page article.rp-card button img{
  transition:transform .28s ease,filter .28s ease;
}

.rp-modern-page article.rp-card button:hover img{
  transform:scale(1.055);
  filter:saturate(1.04);
}

/* View-all CTA */
.rp-modern-page .spx-view-all-reviews{
  position:relative;
  overflow:hidden;
  border:1px solid #c7d2fe;
  background:linear-gradient(135deg,#eef2ff,#f8faff);
  box-shadow:0 7px 20px rgba(79,70,229,.07);
}

.rp-modern-page .spx-view-all-reviews::after{
  content:"";
  position:absolute;
  top:-80%;
  left:-45%;
  width:35%;
  height:260%;
  transform:rotate(24deg);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);
  transition:left .6s ease;
}

.rp-modern-page .spx-view-all-reviews:hover::after{
  left:120%;
}

@media(max-width:768px){
  .rp-modern-page .rp-content{
    padding-left:12px!important;
    padding-right:12px!important;
  }

  .rp-modern-page .rp-content > .space-y-3 > .rp-content{
    border-radius:14px;
    padding:14px 10px!important;
  }

  .rp-modern-page .rp-content > .space-y-3 > .rp-content
    > div:last-child .group{
    min-height:28px;
  }

  .rp-modern-page article.rp-card{
    border-radius:15px!important;
    padding:13px!important;
  }

  .rp-modern-page .rp-content button.rounded-full{
    box-shadow:none;
  }
}

@media(prefers-reduced-motion:reduce){
  .rp-modern-page .rp-content > .space-y-3 > .rp-content::after,
  .rp-modern-page .rp-content > .space-y-3 > .rp-content
    > div:last-child .group > span:nth-child(2) > span::after{
    animation:none;
  }

  .rp-modern-page .rp-card,
  .rp-modern-page article.rp-card img{
    transition:none;
  }
}

`;


export default function SingleProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeIdx, setActiveIdx] = useState(0);
  const [showScrollNavbar, setShowScrollNavbar] = useState(false);
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

  // One navbar only: its content changes after the product gallery scrolls away.
  useEffect(() => {
    const gallery = document.querySelector(".spx-gallery");
    if (!gallery) return;

    const updateNavbar = () => {
      const rect = gallery.getBoundingClientRect();
      setShowScrollNavbar(rect.bottom <= 60);
    };

    updateNavbar();
    window.addEventListener("scroll", updateNavbar, { passive: true });
    window.addEventListener("resize", updateNavbar);

    return () => {
      window.removeEventListener("scroll", updateNavbar);
      window.removeEventListener("resize", updateNavbar);
    };
  }, [product]);
  /* sp-one-navbar-observer */
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
  <div
  className="
    fixed inset-x-0 top-0 z-[2000]
    h-[60px] w-full
    border-b border-gray-200
    bg-white/95
    shadow-[0_3px_18px_rgba(15,23,42,0.07)]
    backdrop-blur-xl
  "
>
  <div
    className="
      mx-auto flex h-full w-full
      items-center justify-between
      px-3 sm:px-4
    "
  >
    {/* LEFT SIDE */}
    <div className="flex min-w-0 flex-1 items-center">
      
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Go back"
        title="Go back"
        className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          rounded-full
          bg-gray-100
          text-gray-900
          transition-all duration-200
          hover:bg-gray-200
          hover:shadow-md
          active:scale-90
          focus:outline-none
          focus:ring-2 focus:ring-blue-300
        "
      >
        <FaArrowLeft size={15} />
      </button>

      {/* PRODUCT / TITLE */}
      {!showScrollNavbar ? (
        <div
          className="
            ml-3
            truncate
            text-[16px]
            font-semibold
            tracking-[-0.02em]
            text-gray-900
          "
        >
          Product Details
        </div>
      ) : (
        <div
          className="
            ml-2.5
            flex min-w-0
            items-center
            gap-2.5
            animate-[fadeIn_.2s_ease]
          "
        >
          {/* Product Thumbnail */}
          {product?.media?.images[0] && (
            <img
              src={product.media.images[0]}
              alt=""
              className="
                h-11 w-11
                shrink-0
                rounded-xl
                border border-gray-200
                bg-gray-50
                object-contain
                shadow-sm
              "
            />
          )}

          {/* Title + Price */}
          <div className="flex min-w-0 flex-col justify-center gap-0.5">
            <div
              className="
                max-w-[150px]
                truncate
                text-[12px]
                font-semibold
                leading-tight
                tracking-[-0.02em]
                text-gray-900
                sm:max-w-[220px]
              "
            >
              {product?.title || "Product"}
            </div>

            <div
              className="
                text-[11px]
                font-extrabold
                leading-none
                tracking-[-0.02em]
                text-indigo-900 flex
              "
            >
              <FaRupeeSign size={9} />{Number(productPrice || 0).toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}
    </div>

    {/* RIGHT SIDE */}
    <div className="ml-2 flex shrink-0 items-center gap-2">
      
      {/* Share */}
      <button
        type="button"
        onClick={handleShare}
        aria-label="Share product"
        title="Share"
        className="
          flex h-11 w-11
          items-center justify-center
          rounded-full
          bg-gray-100
          text-gray-900
          transition-all duration-200
          hover:bg-gray-200
          hover:shadow-md
          active:scale-90
          focus:outline-none
          focus:ring-2 focus:ring-blue-300
        "
      >
        <IoShareOutline size={24} />
      </button>

      {/* Wishlist */}
      <button
        type="button"
        onClick={handleWish}
        aria-label={
          isWishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        title={
          isWishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        className={`
          flex h-11 w-11
          items-center justify-center
          rounded-full
          transition-all duration-200
          active:scale-90
          focus:outline-none
          focus:ring-2 focus:ring-blue-300
          ${
            isWishlisted
              ? "bg-rose-50 text-rose-600"
              : "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-md"
          }
        `}
      >
        {isWishlisted ? (
          <FaHeart size={19} />
        ) : (
          <FaRegHeart size={21} />
        )}
      </button>
    </div>
  </div>
</div>

      <div className="sp sp-bg rp-modern-page">


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
          <div className="spx-left sp-fr ">

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
                {/* <button className="spx-act" onClick={handleShare} title="Share">
                  <SlActionRedo size={13} />
                </button>
                <button className="spx-act" type="button" onClick={() => setZoomedImageIndex(activeIdx)} title="Zoom image">
                  <AiOutlineZoomIn size={15} />
                </button> */}
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

            {/* =========================================================
                MOBILE PRODUCT SUMMARY
            ========================================================= */}
            <section className="sp-mobile-product-summary">
              <div className="sp-mobile-product-summary-top">
                <div className="sp-mobile-product-summary-title-wrap">
                  <h1>{product.title}</h1>
                  {product.shortDescription && <p>{product.shortDescription}</p>}
                </div>
                {/* <button
                  type="button"
                  onClick={handleWish}
                  aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  className={`sp-mobile-summary-wish${isWishlisted ? " is-active" : ""}`}
                >
                  {isWishlisted ? <FaHeart size={17} /> : <FaRegHeart size={18} />}
                </button> */}
              </div>

              <div className="sp-mobile-summary-rating">
                <span className="sp-mobile-rating-badge">
                  {avgRating} <FaStar size={11} />
                </span>
                <span>{reviews.length} ratings</span>
                <span className="sp-mobile-rating-separator">•</span>
                <span>SKU {selectedVariant?.sku || "—"}</span>
              </div>

              <div className="sp-mobile-summary-price-row">
                <div className="sp-mobile-summary-price">
                  <FaRupeeSign size={16} />
                  <span>{finalPrice.toLocaleString("en-IN")}</span>
                </div>
                {origPrice > finalPrice && (
                  <>
                    <span className="sp-mobile-summary-old-price">
                      ₹{origPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="sp-mobile-summary-discount">{disc}% OFF</span>
                  </>
                )}
              </div>

              <div className={`sp-mobile-stock-row${productStock > 0 ? "" : " out"}`}>
                <span className="sp-mobile-stock-dot" />
                <span>
                  {productStock > 0
                    ? `In stock${productStock ? ` · ${productStock} available` : ""}`
                    : "Out of stock"}
                </span>
              </div>
            </section>

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
      <div className="w-full  bg-white p-5 shadow-sm sm:p-6">

  {/* SIZE */}
  {sizeOptions.length > 0 && (
    <div className="w-full space-y-2">
      <div className="flex w-full items-center justify-between">
        <div className="text-[15px] font-bold tracking-tight text-slate-900">
          Size
        </div>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
          {selSize || "Select"}
        </span>
      </div>

      <div className="flex w-full flex-wrap gap-2.5">
        {sizeOptions.map((size) => {
          const sizeVariant = variants.find(
            (v) =>
              variantSize(v) === size &&
              v.isActive !== false
          );

          const isSelected = selSize === size;
          const isDisabled =
            !sizeVariant || sizeVariant.stock === 0;

          return (
            <button
              key={size}
              type="button"
              disabled={isDisabled}
              onClick={() => setSelSize(size)}
              className={`
                relative
                min-h-[33px]
                min-w-[63px]
                rounded-xl
                border
                px-3
                py-2
                text-[10px]
                font-bold
                transition-all
                duration-200
                ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : isDisabled
                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                    : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                }
              `}
            >
              {size}

              {sizeVariant?.price != null &&
                sizeVariant.price !== productPrice && (
                  <span
                    className={`ml-1 text-[10px] ${
                      isSelected
                        ? "text-indigo-100"
                        : "text-slate-400"
                    }`}
                  >
                    ₹{sizeVariant.price}
                  </span>
                )}

              {isSelected && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white ring-2 ring-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  )}

  {/* COLOR */}
  {colorOptions.length > 0 && (
    <div className="mt-2 w-full space-y-2 border-t border-slate-100 pt-2">

      <div className="flex w-full items-center justify-between">
        <div className="text-[15px] font-bold tracking-tight text-slate-900">
          Color
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
          {selColor || "Select"}
        </span>
      </div>

      <div className="flex w-full flex-wrap items-center gap-5">
        {colorOptions.map((c) => {
          const isSelected = selColor === c;

          return (
            <button
              key={c}
              type="button"
              title={c}
              aria-label={`Select ${c}`}
              onClick={() => setSelColor(c)}
              style={{
                backgroundColor:
                  COLOR_MAP[c] || "#9ca3af",
              }}
              className={`
                relative
                flex
                h-6
                w-6
                shrink-0
                items-center
                justify-center
                rounded-full
                transition-all
                duration-200
                ${
                  isSelected
                    ? "scale-110 ring-2 ring-indigo-600 ring-offset-2"
                    : "ring-1 ring-slate-200 hover:scale-110 hover:ring-slate-300"
                }
              `}
            >
              {isSelected && (
                <span
                  className={`text-sm font-black ${
                    c === "White" || c === "Yellow"
                      ? "text-slate-800"
                      : "text-white"
                  }`}
                >
                  ✓
                </span>
              )}

              {c === "White" && (
                <span className="absolute inset-0 rounded-full border border-slate-200" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  )}

  {/* QUANTITY */}
  <div className="mt-1 flex w-full flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

    <div>
      <div className="text-[15px] font-bold tracking-tight text-slate-900">
        Quantity
      </div>

      <div className="mt-1 text-xs text-slate-400">
        Maximum {productMaxQty} item
        {productMaxQty > 1 ? "s" : ""}
      </div>
    </div>

    <div className="flex w-full items-center justify-between sm:w-auto sm:justify-end">

      <div className="flex h-9 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 justify-center items-center">

        <button
          type="button"
          disabled={qty <= 1}
          onClick={() =>
            setQty((q) => Math.max(1, q - 1))
          }
          className="
            flex h-11 w-12
            items-center justify-center
            text-lg font-bold text-slate-600
            transition-colors
            hover:bg-slate-200
            disabled:cursor-not-allowed
            disabled:text-slate-300
          "
        >
          −
        </button>

        <span
          className="
            flex h-11 min-w-[52px]
            items-center justify-center
            border-x border-slate-200
            bg-white
            text-sm font-extrabold
            text-slate-900
          "
        >
          {qty}
        </span>

        <button
          type="button"
          disabled={qty >= productMaxQty}
          onClick={() =>
            setQty((q) =>
              Math.min(productMaxQty, q + 1)
            )
          }
          className="
            flex h-11 w-12
            items-center justify-center
            text-lg font-bold text-indigo-600
            transition-colors
            hover:bg-indigo-50
            disabled:cursor-not-allowed
            disabled:text-slate-300
          "
        >
          +
        </button>
      </div>

      <span className="ml-3 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-500">
        Max {productMaxQty}
      </span>
    </div>
  </div>

</div>

            {/* ── Desktop CTA row ──
                 On mobile these actions are shown only in the fixed bottom bar,
                 so there is no duplicate Add to Cart / Wishlist row. ── */}
            {/* ── Delivery PIN checker ── */}
          

           <div className="spx-inline-cta flex w-full items-stretch gap-3">
  {/* Add to Cart */}
  <button
    type="button"
    onClick={handleCart}
    className={`
      group relative flex min-h-[54px] flex-1 items-center justify-center
      gap-2.5 overflow-hidden rounded-2xl px-5
      text-sm font-bold transition-all duration-200
      active:scale-[0.98]
      focus:outline-none focus:ring-2 focus:ring-indigo-500/30
      ${
        isInCart
          ? "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/25"
      }
    `}
  >
    <FaShoppingCart
      size={16}
      className="shrink-0 transition-transform duration-200 group-hover:scale-110"
    />

    <span>
      {isInCart ? "Go to Cart" : "Add to Cart"}
    </span>
  </button>

  {/* Buy Now */}
  <button
    type="button"
    onClick={handleBuyNow}
    className="
      group relative flex min-h-[54px] flex-1 items-center
      justify-center gap-2.5 overflow-hidden rounded-2xl
      bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600
      px-5 text-sm font-extrabold text-white
      shadow-lg shadow-blue-600/25
      transition-all duration-200
      hover:-translate-y-0.5
      hover:shadow-xl hover:shadow-blue-600/30
      active:scale-[0.98]
      focus:outline-none focus:ring-2 focus:ring-blue-500/30
    "
  >
    {/* Shine effect */}
    <span
      className="
        pointer-events-none absolute inset-0
        -translate-x-full bg-gradient-to-r
        from-transparent via-white/20 to-transparent
        transition-transform duration-700
        group-hover:translate-x-full
      "
    />

    <span className="relative flex items-center gap-2.5">
      <span
        className="
          flex h-7 w-7 items-center justify-center
          rounded-lg bg-white/15
          ring-1 ring-white/20
          backdrop-blur-sm
        "
      >
        <BsLightningCharge
          size={16}
          className="text-white transition-transform duration-200 group-hover:scale-110"
        />
      </span>

      <span>Buy Now</span>
    </span>
  </button>

  {/* Wishlist */}
  <button
    type="button"
    className={`
      group flex h-[54px] w-[54px] shrink-0 items-center
      justify-center rounded-2xl border
      transition-all duration-200
      active:scale-[0.94]
      focus:outline-none focus:ring-2 focus:ring-rose-500/20
      ${
        isWishlisted
          ? "border-rose-200 bg-rose-50 text-rose-500 shadow-sm shadow-rose-100"
          : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
      }
    `}
    onClick={handleWish}
    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
  >
    {isWishlisted ? (
      <FaHeart
        size={18}
        className="transition-transform duration-200 group-hover:scale-110"
      />
    ) : (
      <FaRegHeart
        size={18}
        className="transition-transform duration-200 group-hover:scale-110"
      />
    )}
  </button>
</div>

            {/* ── Trust badges ── */}
 {/* =========================================================
    PREMIUM PRODUCT INFORMATION SECTION
========================================================= */}

<div className="w-full space-y-4">

  {/* =======================================================
      DELIVERY / SERVICEABILITY
  ======================================================= */}

  <section
    className="
      overflow-hidden rounded-2xl
      bg-white
      shadow-[0_4px_20px_rgba(15,23,42,0.04)]
    "
  >
    <div className="p-2 sm:p-2">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">

        <div className="flex min-w-0 items-center gap-3">

          <div
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-xl
              bg-indigo-50
              text-indigo-600
            "
          >
            <span className="text-lg">📍</span>
          </div>

          <div className="min-w-0">

            <h3
              className="
                text-[13px]
                font-black
                tracking-[-0.01em]
                text-slate-900
              "
            >
              Check delivery availability
            </h3>

            <p
              className="
                mt-1
                text-[10px]
                font-medium
                leading-4
                text-slate-400
              "
            >
              Enter your PIN code to check delivery details
            </p>

          </div>
        </div>

        <span
          className="
            hidden shrink-0
            rounded-full
            bg-emerald-50
            px-2.5 py-1
            text-[9px]
            font-extrabold
            text-emerald-600
            sm:block
          "
        >
          ● DELIVERY CHECK
        </span>

      </div>


      {/* PIN INPUT */}
      <div className="mt-4 flex gap-2">

        <div className="relative min-w-0 flex-1">

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={servicePincode}
            onChange={(e) =>
              setServicePincode(
                e.target.value.replace(/\D/g, "").slice(0, 6)
              )
            }
            placeholder="Enter 6-digit PIN code"
            className="
              h-11
              w-full
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-3.5
              pr-10
              text-[12px]
              font-bold
              tracking-wide
              text-slate-800
              outline-none
              placeholder:text-slate-400
              transition-all duration-200

              hover:border-slate-300

              focus:border-indigo-400
              focus:bg-white
              focus:ring-4
              focus:ring-indigo-500/10
            "
          />

          {/* Valid PIN indicator */}
          {servicePincode.length === 6 &&
            /^[1-9][0-9]{5}$/.test(servicePincode) && (
              <span
                className="
                  absolute
                  right-3
                  top-1/2
                  flex
                  h-5
                  w-5
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-100
                  text-[10px]
                  font-black
                  text-emerald-600
                "
              >
                ✓
              </span>
            )}

        </div>


        {/* =================================================
            CHECK BUTTON
        ================================================= */}

        <button
          type="button"
          onClick={checkProductServiceability}
          disabled={
            serviceability.checking ||
            !/^[1-9][0-9]{5}$/.test(servicePincode)
          }
          className={`
            group
            relative
            flex
            h-11
            min-w-[108px]
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-xl
            border-0
            px-4
            text-[12px]
            font-extrabold
            tracking-[-0.01em]
            text-white
            outline-none
            transition-all duration-200

            focus:ring-4
            focus:ring-indigo-500/15

            ${
              serviceability.checking ||
              !/^[1-9][0-9]{5}$/.test(servicePincode)

                ? `
                  cursor-not-allowed
                  bg-slate-200
                  text-slate-400
                `

                : `
                  cursor-pointer
                  bg-gradient-to-r
                  from-indigo-600
                  via-indigo-600
                  to-violet-600

                  shadow-[0_6px_18px_rgba(79,70,229,0.22)]

                  hover:-translate-y-[1px]
                  hover:shadow-[0_9px_26px_rgba(79,70,229,0.30)]

                  active:translate-y-0
                  active:scale-[0.97]
                `
            }
          `}
        >

          {/* Shine */}
          {!serviceability.checking &&
            /^[1-9][0-9]{5}$/.test(servicePincode) && (
              <span
                className="
                  pointer-events-none
                  absolute
                  inset-y-0
                  left-[-70%]
                  w-[42%]
                  -skew-x-[20deg]
                  bg-gradient-to-r
                  from-transparent
                  via-white/40
                  to-transparent
                  transition-all
                  duration-700
                  group-hover:left-[125%]
                "
              />
            )}

          <span
            className="
              relative
              z-10
              flex
              items-center
              justify-center
              gap-2
            "
          >

            {serviceability.checking ? (
              <>
                <span
                  className="
                    h-3.5
                    w-3.5
                    animate-spin
                    rounded-full
                    border-2
                    border-slate-300
                    border-t-indigo-600
                  "
                />

                <span>Checking</span>
              </>
            ) : (
              <>
                <span>Check</span>

                <span
                  className="
                    flex
                    h-5
                    w-5
                    items-center
                    justify-center
                    rounded-md
                    bg-white/15
                    text-[11px]
                    transition-transform
                    duration-200
                    group-hover:translate-x-0.5
                  "
                >
                  →
                </span>
              </>
            )}

          </span>

        </button>

      </div>


      {/* =================================================
          SERVICEABILITY RESULT
      ================================================= */}

      {serviceability.checked && (
        <div
          className={`
            mt-3
            rounded-xl
            border
            px-3.5
            py-3

            ${
              serviceability.available
                ? `
                  border-emerald-200
                  bg-emerald-50/70
                `
                : `
                  border-rose-200
                  bg-rose-50/70
                `
            }
          `}
        >

          <div className="flex items-start gap-3">

            <div
              className={`
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-lg

                ${
                  serviceability.available
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600"
                }
              `}
            >
              {serviceability.available ? "✓" : "×"}
            </div>

            <div className="min-w-0">

              <div
                className={`
                  text-[11px]
                  font-black

                  ${
                    serviceability.available
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }
                `}
              >
                {serviceability.available
                  ? "Delivery available"
                  : "Delivery unavailable"}
              </div>

              <p
                className="
                  mt-0.5
                  text-[10px]
                  font-medium
                  leading-4
                  text-slate-500
                "
              >
                {serviceability.message ||
                  (serviceability.available
                    ? `We can deliver this product to ${servicePincode}.`
                    : `Unfortunately, delivery is not available for ${servicePincode}.`)}
              </p>

            </div>

          </div>

        </div>
      )}


      {/* Benefits */}
      <div className="mt-3 flex flex-wrap gap-2">

        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            bg-emerald-50
            px-2.5
            py-1.5
            text-[9px]
            font-bold
            text-emerald-700
          "
        >
          <FaTruck size={9} />
          Delivery available
        </span>

        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            bg-indigo-50
            px-2.5
            py-1.5
            text-[9px]
            font-bold
            text-indigo-700
          "
        >
          <FaShieldAlt size={9} />
          Secure checkout
        </span>

        <span
          className="
            inline-flex
            items-center
            gap-1.5
            rounded-lg
            bg-slate-50
            px-2.5
            py-1.5
            text-[9px]
            font-bold
            text-slate-500
          "
        >
          <FaCheckCircle size={9} />
          Quality assured
        </span>

      </div>

    </div>
  </section>


  {/* =======================================================
      TRUST BADGES
  ======================================================= */}

 


  {/* =======================================================
      MOBILE ABOUT PRODUCT
  ======================================================= */}

  

  {/* =======================================================
      PRODUCT INFORMATION
  ======================================================= */}

  <div
    className="
      reviews-premium
      overflow-hidden
      rounded-2xl
      border
      border-slate-200/80
      bg-white
      shadow-[0_4px_20px_rgba(15,23,42,0.04)]
    "
  >

    {/* =====================================================
        SPECIFICATIONS ACCORDION
    ===================================================== */}

    {/* =========================================================
    MODERN SPECIFICATIONS
========================================================= */}

<div
  className={`
    overflow-hidden
    rounded-2xl
    border
    bg-white
    transition-all
    duration-300

    ${
      openInfoSections.specs
        ? `
          border-indigo-100
          shadow-[0_8px_30px_rgba(79,70,229,0.08)]
        `
        : `
          border-slate-200/80
          shadow-[0_3px_15px_rgba(15,23,42,0.03)]
        `
    }
  `}
>

  {/* =======================================================
      HEADER
  ======================================================= */}

  <button
    type="button"
    onClick={() => toggleInfoSection("specs")}
    aria-expanded={openInfoSections.specs}
    className="
      group
      relative
      flex
      min-h-[68px]
      w-full
      items-center
      gap-3.5
      overflow-hidden
      border-0
      bg-white
      px-4
      text-left
      outline-none
      transition-all
      duration-200

      hover:bg-slate-50/60

      focus:ring-2
      focus:ring-inset
      focus:ring-indigo-500/10

      sm:px-5
    "
  >

    {/* Subtle active glow */}
    <span
      className={`
        pointer-events-none
        absolute
        left-0
        top-0
        h-full
        w-1
        bg-gradient-to-b
        from-indigo-500
        to-violet-500
        transition-all
        duration-300

        ${
          openInfoSections.specs
            ? "opacity-100"
            : "opacity-0"
        }
      `}
    />


    {/* =====================================================
        ICON
    ===================================================== */}

    <span
      className={`
        relative
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-xl
        transition-all
        duration-300

        ${
          openInfoSections.specs
            ? `
              bg-gradient-to-br
              from-indigo-100
              to-violet-100
              text-indigo-600
              shadow-sm
            `
            : `
              bg-slate-100
              text-slate-500
              group-hover:bg-indigo-50
              group-hover:text-indigo-600
            `
        }
      `}
    >

      {/* Icon shine */}
      <span
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-br
          from-white/70
          via-transparent
          to-transparent
        "
      />

      <FaCog
        size={14}
        className={`
          relative
          z-10
          transition-transform
          duration-500

          ${
            openInfoSections.specs
              ? "rotate-90"
              : "group-hover:rotate-12"
          }
        `}
      />

    </span>


    {/* =====================================================
        TITLE
    ===================================================== */}

    <span className="min-w-0 flex-1">

      <span
        className={`
          block
          text-[12px]
          font-black
          tracking-[-0.01em]
          transition-colors
          duration-200

          ${
            openInfoSections.specs
              ? "text-indigo-700"
              : "text-slate-800"
          }
        `}
      >
        Specifications
      </span>

      <span
        className="
          mt-1
          block
          truncate
          text-[9.5px]
          font-medium
          leading-4
          text-slate-400
        "
      >
        Product details, dimensions & ordering information
      </span>

    </span>


    {/* =====================================================
        COUNT
    ===================================================== */}

    <span
      className="
        hidden
        shrink-0
        items-center
        gap-1.5
        rounded-full
        border
        border-slate-200
        bg-slate-50
        px-2.5
        py-1.5
        text-[9px]
        font-extrabold
        text-slate-500
        transition-all
        duration-200

        group-hover:border-indigo-100
        group-hover:bg-indigo-50
        group-hover:text-indigo-600

        sm:inline-flex
      "
    >
      <span
        className="
          h-1.5
          w-1.5
          rounded-full
          bg-indigo-500
        "
      />

      {[...specsA, ...specsB].length}

      <span className="font-semibold text-slate-400">
        details
      </span>
    </span>


    {/* =====================================================
        CHEVRON
    ===================================================== */}

    <span
      className={`
        flex
        h-8
        w-8
        shrink-0
        items-center
        justify-center
        rounded-lg
        transition-all
        duration-300

        ${
          openInfoSections.specs
            ? `
              bg-indigo-50
              text-indigo-600
            `
            : `
              bg-slate-50
              text-slate-400
              group-hover:bg-indigo-50
              group-hover:text-indigo-600
            `
        }
      `}
    >

      <ChevronDown
        size={16}
        className={`
          transition-transform
          duration-300

          ${
            openInfoSections.specs
              ? "rotate-180"
              : "rotate-0"
          }
        `}
      />

    </span>

  </button>


  {/* =======================================================
      CONTENT
  ======================================================= */}

  {openInfoSections.specs && (

    <div
      className="
        border-t
        border-indigo-50
        bg-gradient-to-b
        from-slate-50/70
        to-white
        p-3.5

        sm:p-5
      "
    >

      {/* =====================================================
          SPECIFICATION GRID
      ===================================================== */}

      <div className="grid gap-3.5 md:grid-cols-2">


        {/* ===================================================
            PRODUCT IDENTITY
        =================================================== */}

        {specsA.length > 0 && (

          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-200/70
              bg-white
              shadow-[0_2px_10px_rgba(15,23,42,0.025)]
            "
          >

            {/* Card header */}
            <div
              className="
                flex
                items-center
                gap-2.5
                border-b
                border-slate-100
                px-4
                py-3.5
              "
            >

              <span
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-50
                  text-indigo-600
                "
              >
                <FaInfoCircle size={11} />
              </span>

              <div>

                <div
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-slate-700
                  "
                >
                  Product Identity
                </div>

                <div
                  className="
                    mt-0.5
                    text-[8.5px]
                    font-medium
                    text-slate-400
                  "
                >
                  Product information
                </div>

              </div>

            </div>


            {/* Rows */}
            <div className="divide-y divide-slate-100">

              {specsA.map((r, index) => (

                <div
                  key={r.l}
                  className="
                    group/row
                    flex
                    items-start
                    justify-between
                    gap-4
                    px-4
                    py-3
                    transition-all
                    duration-200

                    hover:bg-indigo-50/40
                  "
                >

                  {/* Label */}
                  <div
                    className="
                      flex
                      min-w-0
                      items-start
                      gap-2
                    "
                  >

                    <span
                      className="
                        mt-[5px]
                        h-1
                        w-1
                        shrink-0
                        rounded-full
                        bg-slate-300
                        transition-colors
                        duration-200

                        group-hover/row:bg-indigo-400
                      "
                    />

                    <span
                      className="
                        min-w-0
                        text-[10px]
                        font-semibold
                        leading-4
                        text-slate-400
                        transition-colors
                        duration-200

                        group-hover/row:text-slate-500
                      "
                    >
                      {r.l}
                    </span>

                  </div>


                  {/* Value */}
                  <span
                    className="
                      max-w-[58%]
                      text-right
                      text-[10.5px]
                      font-bold
                      leading-4
                      text-slate-700
                      break-words
                    "
                  >
                    {r.v}
                  </span>

                </div>

              ))}

            </div>

          </div>

        )}


        {/* ===================================================
            SHIPPING & ORDERING
        =================================================== */}

        {specsB.length > 0 && (

          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-200/70
              bg-white
              shadow-[0_2px_10px_rgba(15,23,42,0.025)]
            "
          >

            {/* Card header */}
            <div
              className="
                flex
                items-center
                gap-2.5
                border-b
                border-slate-100
                px-4
                py-3.5
              "
            >

              <span
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-lg
                  bg-emerald-50
                  text-emerald-600
                "
              >
                <FaTruck size={11} />
              </span>

              <div>

                <div
                  className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.1em]
                    text-slate-700
                  "
                >
                  Shipping & Ordering
                </div>

                <div
                  className="
                    mt-0.5
                    text-[8.5px]
                    font-medium
                    text-slate-400
                  "
                >
                  Delivery & purchase information
                </div>

              </div>

            </div>


            {/* Rows */}
            <div className="divide-y divide-slate-100">

              {specsB.map((r) => (

                <div
                  key={r.l}
                  className="
                    group/row
                    flex
                    items-start
                    justify-between
                    gap-4
                    px-4
                    py-3
                    transition-all
                    duration-200

                    hover:bg-emerald-50/30
                  "
                >

                  {/* Label */}
                  <div
                    className="
                      flex
                      min-w-0
                      items-start
                      gap-2
                    "
                  >

                    <span
                      className="
                        mt-[5px]
                        h-1
                        w-1
                        shrink-0
                        rounded-full
                        bg-slate-300
                        transition-colors
                        duration-200

                        group-hover/row:bg-emerald-400
                      "
                    />

                    <span
                      className="
                        min-w-0
                        text-[10px]
                        font-semibold
                        leading-4
                        text-slate-400
                        transition-colors
                        duration-200

                        group-hover/row:text-slate-500
                      "
                    >
                      {r.l}
                    </span>

                  </div>


                  {/* Value */}
                  <span
                    className="
                      max-w-[58%]
                      text-right
                      text-[10.5px]
                      font-bold
                      leading-4
                      text-slate-700
                      break-words
                    "
                  >
                    {r.v}
                  </span>

                </div>

              ))}

            </div>

          </div>

        )}

      </div>


      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {specsA.length === 0 &&
        specsB.length === 0 && (

          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              rounded-2xl
              border
              border-dashed
              border-slate-200
              bg-white
              px-5
              py-10
              text-center
            "
          >

            <span
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-slate-100
                text-slate-400
              "
            >
              <FaCog size={18} />
            </span>

            <div
              className="
                mt-3
                text-[11px]
                font-black
                text-slate-600
              "
            >
              No specifications available
            </div>

            <p
              className="
                mt-1
                text-[9px]
                font-medium
                text-slate-400
              "
            >
              Product specifications haven't been added yet.
            </p>

          </div>

        )}

    </div>

  )}

</div>


    {/* =====================================================
        RATINGS & REVIEWS
    ===================================================== */}
{/* ============================================================
    PREMIUM RATINGS & REVIEWS ACCORDION
============================================================ */}

{/* ============================================================
    RATINGS & REVIEWS
============================================================ */}

<div
  className="
    rp-card
    rounded-3xl
    bg-white/90
  "
>

  {/* ==========================================================
      HEADER
  ========================================================== */}

  <button
    type="button"
    onClick={() => toggleInfoSection("reviews")}
    aria-expanded={openInfoSections.reviews}
    className="
      group
      flex
      min-h-[68px]
      w-full
      items-center
      gap-3
      border-0
      bg-white
      px-4
      text-left
      outline-none
      transition
      hover:bg-slate-50
      sm:px-5
    "
  >

    {/* Icon */}

    <span
      className={`
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        transition
        ${
          openInfoSections.reviews
            ? "bg-indigo-50 text-indigo-600"
            : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
        }
      `}
    >
      <FaComments size={15} />
    </span>


    {/* Title */}

    <span className="min-w-0 flex-1">

      <span
        className={`
          block
          text-[12px]
          font-black
          ${
            openInfoSections.reviews
              ? "text-indigo-700"
              : "text-slate-800"
          }
        `}
      >
        Ratings & Reviews
      </span>

      <span
        className="
          mt-1
          block
          text-[9px]
          font-medium
          text-slate-400
        "
      >
        Real experiences from our shoppers
      </span>

    </span>


    {/* Header rating */}

    {reviews.length > 0 && (

      <span
        className="
          hidden
          items-center
          gap-1
          rounded-full
          bg-amber-50
          px-2.5
          py-1.5
          text-[9px]
          font-black
          text-amber-600
          sm:flex
        "
      >
        <FaStar size={8} />
        {avgRating}
      </span>

    )}


    {/* Count */}

    <span
      className="
        flex
        h-8
        min-w-8
        items-center
        justify-center
        rounded-lg
        bg-slate-50
        px-2
        text-[9px]
        font-black
        text-slate-500
      "
    >
      {reviews.length}
    </span>


    {/* Arrow */}

    <span
      className="
        flex
        h-8
        w-8
        shrink-0
        items-center
        justify-center
        rounded-lg
        bg-slate-50
        text-slate-400
      "
    >

      <ChevronDown
        size={15}
        className={`
          transition-transform
          duration-300
          ${
            openInfoSections.reviews
              ? "rotate-180"
              : ""
          }
        `}
      />

    </span>

  </button>


  {/* ==========================================================
      CONTENT
  ========================================================== */}

  {openInfoSections.reviews && (

    <div
      className="
        rp-content
        px-4
        py-4
        sm:px-5
        sm:py-5
      "
    >

      <div className="space-y-3">


        {/* ======================================================
            RATING SUMMARY
        ====================================================== */}

{/* ==========================================================
    RATING SUMMARY
========================================================== */}

<div
  className="
    rp-content
    flex
    w-full
    items-center
    rounded-2xl
    bg-gradient-to-r
    from-white
    via-indigo-50/20
    to-white
    px-2
    py-4
    sm:py-5
  "
>
  {/* ========================================================
      LEFT — RATING CALCULATION
  ======================================================== */}

  <div
    className="
      flex
      w-[42%]
      shrink-0
      flex-col
      items-center
      justify-center
      px-2
      text-center
      sm:w-[40%]
    "
  >
    {/* STARS */}
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <FaStar
          key={star}
          size={24}
          className={
            star <= Math.round(Number(avgRating))
              ? "text-amber-400"
              : "text-slate-200"
          }
        />
      ))}
    </div>

    {/* RATING + REVIEWS */}
    <div
      className="
        mt-4
        text-[11px]
        font-medium
        italic
        leading-6
        text-slate-400
      "
    >
      <span className="font-semibold text-slate-500">
        {avgRating}
      </span>{" "}
      rating
      {reviews.length !== 1 ? "s" : ""} and{" "}
      <span className="font-semibold text-slate-500">
        {reviews.length}
      </span>{" "}
      {reviews.length === 1
        ? "review"
        : "reviews"}
    </div>

    {/* VERIFIED */}
    {reviews.some(
      (r) => r?.verifiedPurchase
    ) && (
      <div className="mt-2">
        <span
          className="
            inline-flex
            items-center
            gap-1
            rounded-full
            bg-emerald-50
            px-2
            py-1
            text-[7px]
            font-black
            text-emerald-600
          "
        >
          <FaCheckCircle size={7} />
          Verified shoppers
        </span>
      </div>
    )}
  </div>

  {/* ========================================================
      VERTICAL DIVIDER
  ======================================================== */}

  <div
    className="
      rp-divider
      h-[180px]
      w-px
      shrink-0
    "
  />

  {/* ========================================================
      RIGHT — RATING DISTRIBUTION
  ======================================================== */}

  <div
    className="
      min-w-0
      flex-1
      pl-3
      pr-1
      sm:pl-7
      sm:pr-3
    "
  >
    <div className="space-y-1">
      {[5, 4, 3, 2, 1].map((star) => {
        const count =
          reviewRatingCounts[star] || 0;

        const percentage =
          reviews.length > 0
            ? Math.round(
                (count / reviews.length) * 100
              )
            : 0;

        const active =
          reviewRatingFilter === String(star);

        return (
          <button
            key={star}
            type="button"
            onClick={() =>
              setReviewRatingFilter(
                active
                  ? "all"
                  : String(star)
              )
            }
            aria-pressed={active}
            className="
              group
              flex
              w-full
              items-center
              gap-2
              text-left
              outline-none
            "
          >
            {/* STAR LABEL */}
            <span
              className="
                flex
                w-[42px]
                shrink-0
                items-center
                justify-end
                gap-1
                text-[13px]
                font-medium
                text-slate-600
              "
            >
              {star}
              <FaStar
                size={10}
                className="text-amber-400"
              />
            </span>

            {/* PROGRESS BAR */}
            <span
              className="
                relative
                h-[3px]
                flex-1
                overflow-hidden
                rounded-full
                bg-slate-200
              "
            >
              <span
                className="
                  absolute inset-0 rounded-full bg-transparent transition-all duration-500
                "
                style={{
                  width: `${percentage}%`,
                }}
              />
            </span>

            {/* COUNT */}
            <span
              className="
                w-[42px]
                shrink-0
                text-right
                text-[13px]
                font-medium
                text-slate-400
              "
            >
              {count.toLocaleString()}
            </span>
          </button>
        );
      })}
    </div>
  </div>
</div>


        {/* ======================================================
            FILTERS
        ====================================================== */}

        <div
          className="
            -mx-1
            flex
            gap-1.5
            overflow-x-auto
            px-1
            pb-1
          "
          style={{
            scrollbarWidth: "none",
          }}
        >

          {[
            [
              "all",
              "All",
              reviews.length,
            ],

            [
              "photos",
              "Photos",
              reviews.filter(
                (r) =>
                  getReviewImages(r).length >
                  0
              ).length,
            ],

            [
              "5",
              "5★",
              reviewRatingCounts[5] || 0,
            ],

            [
              "4",
              "4★",
              reviewRatingCounts[4] || 0,
            ],

            [
              "3",
              "3★",
              reviewRatingCounts[3] || 0,
            ],

            [
              "2",
              "2★",
              reviewRatingCounts[2] || 0,
            ],

            [
              "1",
              "1★",
              reviewRatingCounts[1] || 0,
            ],
          ].map(
            ([value, label, count]) => {

              const active =
                reviewRatingFilter === value;

              return (

                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setReviewRatingFilter(value)
                  }
                  aria-pressed={active}
                  className={`
                    inline-flex
                    h-8
                    shrink-0
                    items-center
                    gap-1.5
                    rounded-full
                    border
                    px-3
                    text-[9px]
                    font-black
                    transition-all
                    active:scale-95
                    ${
                      active
                        ? `
                          border-indigo-200
                          bg-indigo-600
                          text-white
                          shadow-sm
                        `
                        : `
                          border-slate-200
                          bg-white
                          text-slate-500
                          hover:border-indigo-200
                          hover:text-indigo-600
                        `
                    }
                  `}
                >

                  {value === "photos" && (
                    <span>📷</span>
                  )}

                  {value !== "photos" &&
                    value !== "all" && (
                      <FaStar
                        size={7}
                        className={
                          active
                            ? "text-amber-300"
                            : "text-amber-400"
                        }
                      />
                    )}

                  {label}

                  <span
                    className={`
                      rounded-full
                      px-1.5
                      py-0.5
                      text-[7px]
                      ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-400"
                      }
                    `}
                  >
                    {count}
                  </span>

                </button>

              );

            }
          )}

        </div>


        {/* ======================================================
            SORT
        ====================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          <span
            className="
              text-[9px]
              font-semibold
              text-slate-400
            "
          >
            Showing{" "}
            <strong className="text-slate-700">
              {filteredReviews.length}
            </strong>{" "}
            reviews
          </span>


          <div className="relative">

            <select
              value={reviewSort}
              onChange={(e) =>
                setReviewSort(e.target.value)
              }
              aria-label="Sort reviews"
              className="
                h-8
                appearance-none
                rounded-lg
                border
                border-slate-200
                bg-white
                px-2.5
                pr-7
                text-[8px]
                font-black
                text-slate-600
                outline-none
                focus:border-indigo-300
                focus:ring-2
                focus:ring-indigo-500/10
              "
            >

              <option value="relevant">
                Most helpful
              </option>

              <option value="recent">
                Newest
              </option>

              <option value="highest">
                Highest rated
              </option>

              <option value="lowest">
                Lowest rated
              </option>

            </select>


            <ChevronDown
              size={11}
              className="
                pointer-events-none
                absolute
                right-2
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

          </div>

        </div>


        {/* ======================================================
            REVIEWS
        ====================================================== */}

        {filteredReviews.length > 0 ? (

          <div className="space-y-3">

            {filteredReviews.map(
              (review, index) => {

                const rating =
                  Number(
                    review?.rating || 0
                  );

                const reviewImages =
                  getReviewImages(review);

                const reviewerName =
                  review?.reviewerName ||
                  review?.userName ||
                  review?.user?.name ||
                  "Anonymous";

                const avatar =
                  review?.reviewerAvatar ||
                  review?.user?.avatar;

                const date =
                  review?.createdAt
                    ? new Date(
                        review.createdAt
                      ).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "";

                return (

                  <article
                    key={
                      review?._id || index
                    }
                    className="
                      rp-card
                      rounded-3xl
                      bg-white/95
                      p-4
                      sm:p-5
                    "
                  >

                    {/* =================================================
                        REVIEW HEADER
                    ================================================= */}

                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      "
                    >

                      <div
                        className="
                          flex
                          min-w-0
                          items-center
                          gap-2.5
                        "
                      >

                        {/* Avatar */}

                        {avatar ? (

                          <img
                            src={avatar}
                            alt=""
                            className="
                              h-10
                              w-10
                              shrink-0
                              rounded-full
                              object-cover
                              ring-2
                              ring-slate-100
                            "
                          />

                        ) : (

                          <div
                            className="
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-gradient-to-br
                              from-indigo-500
                              to-violet-600
                              text-[12px]
                              font-black
                              text-white
                            "
                          >
                            {reviewerName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                        )}


                        {/* User */}

                      <div className="min-w-0 flex-1">
  {/* VERIFIED + DATE */}
  <div className="flex flex-wrap items-center gap-2">
    {review?.verifiedPurchase && (
      <span
        className="
          inline-flex
          items-center
          gap-1.5
          rounded-full
          border
          border-emerald-100
          bg-emerald-50
          px-2.5
          py-1
          text-[8px]
          font-extrabold
          tracking-[-0.01em]
          text-emerald-600
        "
      >
        <span
          className="
            flex
            h-3.5
            w-3.5
            items-center
            justify-center
            rounded-full
            bg-emerald-500
            text-white
          "
        >
          <FaCheckCircle size={8} />
        </span>

        Verified Purchase
      </span>
    )}

    {date && (
      <>
        <span
          className="
            h-1
            w-1
            rounded-full
            bg-slate-300
          "
        />

        <span
          className="
            text-[8px]
            font-medium
            text-slate-400
          "
        >
          {date}
        </span>
      </>
    )}
  </div>

  {/* SMALL SECONDARY INFO */}
  <div
    className="
      mt-1.5
      flex
      items-center
      gap-1
      text-[7.5px]
      font-medium
      text-slate-400
    "
  >
    <span
      className="
        h-1.5
        w-1.5
        rounded-full
        bg-emerald-400
      "
    />

    Genuine customer review
  </div>
</div>

                      </div>


                      {/* Rating */}

                      <span
                        className="
                          inline-flex
                          shrink-0
                          items-center
                          gap-1
                          rounded-lg
                          bg-amber-50
                          px-2
                          py-1.5
                          text-[9px]
                          font-black
                          text-amber-600
                        "
                      >

                        <FaStar
                          size={8}
                          className="text-amber-500"
                        />

                        {rating.toFixed(1)}

                      </span>

                    </div>


                    {/* =================================================
                        REVIEW STARS
                    ================================================= */}

                    <div className="mt-3">

                      <Stars
                        rating={rating}
                        size={12}
                      />

                    </div>


                    {/* =================================================
                        COMMENT
                    ================================================= */}

                    {review?.comment && (

                      <p
                        className="
                          mt-2.5
                          text-[11px]
                          font-medium
                          leading-5
                          text-slate-600
                        "
                      >
                        {review.comment}
                      </p>

                    )}


                    {/* =================================================
                        PHOTOS
                    ================================================= */}

                    {reviewImages.length > 0 && (

                      <div
                        className="
                          mt-3
                          flex
                          gap-2
                          overflow-x-auto
                          pb-1
                        "
                        style={{
                          scrollbarWidth: "none",
                        }}
                      >

                        {reviewImages.map(
                          (
                            image,
                            imageIndex
                          ) => (

                            <button
                              key={`${review?._id || index}-image-${imageIndex}`}
                              type="button"
                              onClick={() => {

                                setSelectedReview(
                                  review
                                );

                                setGalleryImages(
                                  reviewImages
                                );

                                setCurrentIndex(
                                  imageIndex
                                );

                                setSelectedImage(
                                  image
                                );

                                onOpen();

                              }}
                              aria-label={`Open review photo ${
                                imageIndex + 1
                              }`}
                              className="
                                rp-photo
                                group/photo
                                relative
                                h-[82px]
                                w-[82px]
                                shrink-0
                                overflow-hidden
                                rounded-2xl
                                border
                                border-white
                                bg-slate-100
                                shadow-sm
                                outline-none
                                transition
                                hover:scale-[1.03]
                                hover:border-indigo-200
                                hover:shadow-md
                                focus:ring-2
                                focus:ring-indigo-500/30
                              "
                            >

                              <img
                                src={image}
                                alt={`Review ${
                                  imageIndex + 1
                                }`}
                                className="
                                  h-full
                                  w-full
                                  object-cover
                                  transition-transform
                                  duration-500
                                  group-hover/photo:scale-110
                                "
                              />


                              <span
                                className="
                                  pointer-events-none
                                  absolute
                                  inset-0
                                  bg-black/0
                                  transition
                                  group-hover/photo:bg-black/10
                                "
                              />

                            </button>

                          )
                        )}

                      </div>

                    )}


                    {/* =================================================
                        ACTION BAR
                    ================================================= */}

                    <div
                      className="
                        mt-4
                        flex
                        items-center
                        gap-2
                        border-t
                        border-slate-100
                        pt-3
                      "
                    >

                      <span
                        className="
                          mr-1
                          text-[9px]
                          font-semibold
                          text-slate-400
                        "
                      >
                        Helpful?
                      </span>


                      {/* Like */}

                      <button
                        type="button"
                        onClick={() =>
                          toggleLike(
                            review._id,
                            "like"
                          )
                        }
                        className="
                          inline-flex
                          h-8
                          items-center
                          gap-1.5
                          rounded-lg
                          border
                          border-slate-200
                          bg-white
                          px-2.5
                          text-[9px]
                          font-bold
                          text-slate-500
                          transition
                          hover:border-indigo-200
                          hover:bg-indigo-50
                          hover:text-indigo-600
                          active:scale-95
                        "
                      >

                        <FaThumbsUp size={9} />

                        Helpful

                        <span
                          className="
                            rounded-md
                            bg-slate-100
                            px-1
                            text-[8px]
                            text-slate-400
                          "
                        >
                          {review?.likesCount ||
                            0}
                        </span>

                      </button>


                      {/* Dislike */}

                   

                      {/* Delete */}

                      {review?.isOwner && (

                        <button
                          type="button"
                          onClick={() =>
                            deleteReview(
                              review._id
                            )
                          }
                          className="
                            ml-auto
                            inline-flex
                            h-8
                            items-center
                            gap-1.5
                            rounded-lg
                            border
                            border-rose-100
                            bg-rose-50
                            px-2.5
                            text-[9px]
                            font-bold
                            text-rose-500
                            transition
                            hover:bg-rose-100
                            active:scale-95
                          "
                        >

                          <FaTrash size={8} />

                          Delete

                        </button>

                      )}

                    </div>

                  </article>

                );

              }
            )}

          </div>

        ) : (

          /* ======================================================
             EMPTY STATE
          ====================================================== */

          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-slate-200
              bg-slate-50/50
              px-5
              py-10
              text-center
            "
          >

            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-indigo-50
                text-indigo-300
              "
            >
              <FaRegStar size={24} />
            </div>


            <div
              className="
                mt-3
                text-[12px]
                font-black
                text-slate-700
              "
            >
              {reviews.length === 0
                ? "No reviews yet"
                : "No reviews match this filter"}
            </div>


            <p
              className="
                mx-auto
                mt-1.5
                max-w-[320px]
                text-[9px]
                font-medium
                leading-5
                text-slate-400
              "
            >
              {reviews.length === 0
                ? "Be the first to share your experience."
                : "Try another rating filter."}
            </p>


            {reviews.length > 0 && (

              <button
                type="button"
                onClick={() =>
                  setReviewRatingFilter("all")
                }
                className="
                  mt-3
                  rounded-lg
                  bg-indigo-50
                  px-3
                  py-2
                  text-[9px]
                  font-black
                  text-indigo-600
                  transition
                  hover:bg-indigo-100
                "
              >
                Show all reviews
              </button>

            )}

          </div>

        )}


        {/* ======================================================
            VIEW ALL
        ====================================================== */}

        {reviews.length > 0 && (

          <button
            type="button"
            onClick={() =>
              navigate(
                `/product/${product._id}/reviews`
              )
            }
            className="
              rp-btn
              group
              relative
              flex
              h-11
              w-full
              items-center
              justify-center
              gap-2
              overflow-hidden
              rounded-xl
              border
              border-indigo-100
              bg-indigo-50
              text-[9px]
              font-black
              text-indigo-600
              transition
              hover:border-indigo-200
              hover:bg-indigo-100
              active:scale-[0.99]
            "
          >

            {/* Shine */}

            <span
              className="
                pointer-events-none
                absolute
                inset-y-0
                left-[-60%]
                w-[30%]
                -skew-x-[20deg]
                bg-gradient-to-r
                from-transparent
                via-white/80
                to-transparent
                transition-all
                duration-700
                group-hover:left-[130%]
              "
            />

            <span className="relative z-10">
              View all {reviews.length} reviews
            </span>

            <span
              className="
                relative
                z-10
                transition-transform
                group-hover:translate-x-1
              "
            >
              →
            </span>

          </button>

        )}

      </div>

    </div>

  )}

</div>

  </div>

</div>

          </div>
          {/* end right */}
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
        
<div
  className="
    sp-mobile-buybar fixed inset-x-0 bottom-0 z-[120]
    flex items-center gap-2
    border-t border-slate-200/80
    bg-white/95 px-3 pt-2.5
    pb-[calc(10px+env(safe-area-inset-bottom))]
    shadow-[0_-8px_30px_rgba(15,23,42,0.10)]
    backdrop-blur-xl
  "
>
  {/* Add to Cart */}
  <button
    type="button"
    onClick={handleCart}
    className={`
      group flex h-[39px] flex-1 items-center justify-center
      gap-2 rounded-xl border px-3
      text-[12px] font-extrabold
      transition-all duration-200
      active:scale-[0.97]
      focus:outline-none focus:ring-2 focus:ring-indigo-500/20
      ${
        isInCart
          ? `
            border-indigo-200 bg-indigo-50
            text-indigo-700
            hover:bg-indigo-100
          `
          : `
            border-indigo-200 bg-white
            text-indigo-600
            shadow-sm
            hover:border-indigo-300
            hover:bg-indigo-50
          `
      }
    `}
  >
    <span
      className="
        flex h-8 w-8 shrink-0 items-center justify-center
        rounded-lg bg-indigo-50
        transition-transform duration-200
        group-hover:scale-105
      "
    >
      <FaShoppingCart size={15} />
    </span>

    <span className="truncate">
      {isInCart ? "Go to Cart" : "Add to Cart"}
    </span>
  </button>

  {/* Buy Now */}
  <button
    type="button"
    onClick={handleBuyNow}
    className="
      group relative flex h-[39px] flex-[1.25]
      items-center justify-center flex-row gap-2
      overflow-hidden rounded-xl
      bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600
      px-3 text-white
      shadow-lg shadow-indigo-500/25
      transition-all duration-200
      hover:shadow-xl hover:shadow-indigo-500/30
      active:scale-[0.97]
      focus:outline-none
      focus:ring-2 focus:ring-indigo-500/30
    "
  >
    {/* Animated shine */}
    <span
      className="
        pointer-events-none absolute inset-y-0 left-[-80%]
        w-[45%] skew-x-[-20deg]
        bg-gradient-to-r
        from-transparent via-white/25 to-transparent
        transition-all duration-700
        group-hover:left-[130%]
      "
    />

    {/* Lightning icon */}
    <span
      className="
        relative flex  shrink-0
        items-center justify-center
        ring-white/20
        backdrop-blur-sm 
      "
    >
      <BsLightningCharge
        size={16}
        className="
          text-white
          transition-transform duration-200
          group-hover:scale-110
        "
      />
    </span>

    <span className="relative flex flex-row gap-1.5 justify-center items-start leading-none">
      <span className="text-[12px] font-extrabold">
        Buy Now
      </span>

      <span className="pt-0.5 text-[10px] font-semibold text-white/80">
        ₹{finalPrice.toLocaleString("en-IN")}
      </span>
    </span>
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