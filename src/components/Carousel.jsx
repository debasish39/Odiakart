import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineArrowRight, AiOutlineLeft, AiOutlineRight } from "react-icons/ai";

/*
  Place the banner image files inside:
  public/banner/

  Expected filenames:
  - odisha-banner.webp
  - odisha-crafts.webp
  - odisha-deals.webp
  - odisha-fresh.webp
  - odisha-festive.webp

  Public-folder image paths are used so Vite can serve them directly.
*/

const BANNERS = [
  {
    id: "odisha",
    image: "/banner/odisha-banner.webp",
    eyebrow: "MADE IN ODISHA",
    title: "Made in Odisha.",
    highlight: "Made with Pride.",
    description: "Discover the pride of Odisha. Shop local products and support local businesses.",
    cta: "Shop Now",
    destination: "/products",
    position: "center",
    overlay: "linear-gradient(90deg, rgba(8, 31, 83, .88) 0%, rgba(8, 31, 83, .58) 48%, rgba(8, 31, 83, .05) 100%)",
  },
  {
    id: "crafts",
    image: "/banner/odisha-crafts.webp",
    eyebrow: "HANDMADE WITH LOVE",
    title: "Handcrafted",
    highlight: "Treasures.",
    description: "Explore beautiful Odisha handicrafts made by talented local artisans.",
    cta: "Explore Crafts",
    destination: "/products?category=handicrafts",
    position: "center",
    overlay: "linear-gradient(90deg, rgba(59, 30, 14, .86) 0%, rgba(59, 30, 14, .48) 50%, rgba(59, 30, 14, .04) 100%)",
  },
  {
    id: "deals",
    image: "/banner/odisha-deals.webp",
    eyebrow: "SPECIAL OFFERS",
    title: "Amazing Deals.",
    highlight: "Everyday Value.",
    description: "Find great picks and special offers on products for your everyday needs.",
    cta: "View Offers",
    destination: "/products",
    position: "center",
    overlay: "linear-gradient(90deg, rgba(15, 42, 105, .88) 0%, rgba(15, 42, 105, .52) 50%, rgba(15, 42, 105, .04) 100%)",
  },
  {
    id: "essentials",
    image: "/banner/odisha-fresh.webp",
    eyebrow: "YOUR DAILY FAVOURITES",
    title: "Everyday",
    highlight: "Essentials.",
    description: "Shop useful everyday products, selected with care for your home and family.",
    cta: "Shop Essentials",
    destination: "/products",
    position: "center",
    overlay: "linear-gradient(90deg, rgba(6, 66, 54, .88) 0%, rgba(6, 66, 54, .48) 50%, rgba(6, 66, 54, .04) 100%)",
  },
  {
    id: "festive",
    image: "/banner/odisha-festive.webp",
    eyebrow: "CELEBRATE TOGETHER",
    title: "Festive",
    highlight: "Specials.",
    description: "Bring home something special for celebrations, gifting, and family moments.",
    cta: "Shop Festive Picks",
    destination: "/products",
    position: "center",
    overlay: "linear-gradient(90deg, rgba(93, 25, 31, .88) 0%, rgba(93, 25, 31, .48) 50%, rgba(93, 25, 31, .04) 100%)",
  },
];

export default function Carousel() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  const activeBanner = BANNERS[activeIndex];

  const goTo = (index) => {
    setActiveIndex((index + BANNERS.length) % BANNERS.length);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % BANNERS.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Odikart promotional banners"
      className="odikart-banner-wrap mx-auto w-full max-w-7xl px-3 pt-2 sm:px-5 sm:pt-4 lg:px-8"
    >
      <style>{`
        .odikart-banner {
          position: relative;
          isolation: isolate;
          min-height: 172px;
          overflow: hidden;
          border-radius: 22px;
          background: #1749a8;
          box-shadow: 0 8px 24px rgba(15, 42, 90, .12);
        }
        .odikart-banner-image {
          position: absolute;
          inset: 0;
          z-index: -2;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          animation: odikart-banner-zoom 7s ease-out both;
        }
        .odikart-banner-overlay {
          position: absolute;
          inset: 0;
          z-index: -1;
        }
        .odikart-banner-content {
          display: flex;
          min-height: 172px;
          max-width: 62%;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          padding: 20px 18px 28px;
          color: #fff;
        }
        .odikart-banner-eyebrow {
          display: inline-flex;
          align-items: center;
          margin-bottom: 9px;
          border: 1px solid rgba(255,255,255,.28);
          border-radius: 999px;
          background: rgba(255,255,255,.13);
          padding: 5px 8px;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .1em;
          backdrop-filter: blur(8px);
        }
        .odikart-banner-title {
          margin: 0;
          font-size: clamp(21px, 5vw, 42px);
          font-weight: 900;
          letter-spacing: -.045em;
          line-height: 1.02;
          text-wrap: balance;
        }
        .odikart-banner-title span {
          display: block;
          margin-top: 3px;
          color: #dbeafe;
        }
        .odikart-banner-description {
          max-width: 340px;
          margin: 8px 0 12px;
          color: rgba(255,255,255,.91);
          font-size: 9px;
          line-height: 1.45;
        }
        .odikart-banner-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          border-radius: 999px;
          background: #fff;
          padding: 7px 8px 7px 13px;
          color: #1d4ed8;
          font-size: 9px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(0,0,0,.14);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .odikart-banner-cta:hover {
          transform: translateY(-1px);
          box-shadow: 0 7px 18px rgba(0,0,0,.18);
        }
        .odikart-banner-cta-icon {
          display: grid;
          width: 22px;
          height: 22px;
          place-items: center;
          border-radius: 50%;
          background: #2563eb;
          color: #fff;
        }
        .odikart-banner-controls {
          position: absolute;
          right: 12px;
          bottom: 10px;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .odikart-banner-dots {
          display: flex;
          align-items: center;
          gap: 4px;
          border-radius: 999px;
          background: rgba(0,0,0,.18);
          padding: 5px 7px;
          backdrop-filter: blur(8px);
        }
        .odikart-banner-dot {
          width: 5px;
          height: 5px;
          border: 0;
          border-radius: 999px;
          background: rgba(255,255,255,.58);
          padding: 0;
          transition: width .2s ease, background .2s ease;
        }
        .odikart-banner-dot[aria-current="true"] {
          width: 16px;
          background: #fff;
        }
        .odikart-banner-arrow {
          display: grid;
          width: 26px;
          height: 26px;
          place-items: center;
          border: 1px solid rgba(255,255,255,.32);
          border-radius: 50%;
          background: rgba(15,23,42,.24);
          color: #fff;
          backdrop-filter: blur(8px);
        }
        .odikart-banner-fallback {
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            radial-gradient(circle at 80% 20%, rgba(255,255,255,.22), transparent 28%),
            linear-gradient(120deg, #102a6b, #2563eb);
        }
        @keyframes odikart-banner-zoom {
          from { transform: scale(1.035); }
          to { transform: scale(1); }
        }
        @media (min-width: 640px) {
          .odikart-banner, .odikart-banner-content { min-height: 240px; }
          .odikart-banner-content { padding: 28px 34px 36px; max-width: 58%; }
          .odikart-banner-eyebrow { margin-bottom: 12px; padding: 6px 10px; font-size: 9px; }
          .odikart-banner-description { margin: 12px 0 18px; font-size: 12px; }
          .odikart-banner-cta { padding: 9px 10px 9px 16px; font-size: 11px; }
          .odikart-banner-cta-icon { width: 26px; height: 26px; }
          .odikart-banner-controls { right: 18px; bottom: 15px; }
          .odikart-banner-dot { width: 6px; height: 6px; }
          .odikart-banner-dot[aria-current="true"] { width: 20px; }
          .odikart-banner-arrow { width: 30px; height: 30px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .odikart-banner-image { animation: none; }
          .odikart-banner-cta, .odikart-banner-dot { transition: none; }
        }
      `}</style>

      <div className="odikart-banner">
        <div className="odikart-banner-fallback" aria-hidden="true" />

        {!failedImages[activeBanner.id] && (
          <img
            key={activeBanner.id}
            className="odikart-banner-image"
            src={activeBanner.image}
            alt=""
            fetchPriority={activeIndex === 0 ? "high" : "auto"}
            onError={() =>
              setFailedImages((current) => ({
                ...current,
                [activeBanner.id]: true,
              }))
            }
          />
        )}

        <div
          className="odikart-banner-overlay"
          style={{ background: activeBanner.overlay }}
          aria-hidden="true"
        />

        <div key={activeBanner.id} className="odikart-banner-content">
          <div className="odikart-banner-eyebrow">
            {activeBanner.eyebrow}
          </div>

          <h1 className="odikart-banner-title">
            {activeBanner.title}
            <span>{activeBanner.highlight}</span>
          </h1>

          <p className="odikart-banner-description">
            {activeBanner.description}
          </p>

          <button
            type="button"
            onClick={() => navigate(activeBanner.destination)}
            className="odikart-banner-cta"
          >
            <span>{activeBanner.cta}</span>
            <span className="odikart-banner-cta-icon" aria-hidden="true">
              <AiOutlineArrowRight size={14} />
            </span>
          </button>
        </div>

        <div className="odikart-banner-controls">
          <button
            type="button"
            className="odikart-banner-arrow"
            onClick={() => goTo(activeIndex - 1)}
            aria-label="Previous banner"
          >
            <AiOutlineLeft size={13} />
          </button>

          <div className="odikart-banner-dots" aria-label="Choose banner">
            {BANNERS.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className="odikart-banner-dot"
                aria-label={`Show banner ${index + 1}: ${banner.eyebrow}`}
                aria-current={index === activeIndex ? "true" : "false"}
                onClick={() => goTo(index)}
              />
            ))}
          </div>

          <button
            type="button"
            className="odikart-banner-arrow"
            onClick={() => goTo(activeIndex + 1)}
            aria-label="Next banner"
          >
            <AiOutlineRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}
