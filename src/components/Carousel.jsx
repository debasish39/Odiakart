import React from "react";
import { useNavigate } from "react-router-dom";
import { AiOutlineArrowRight } from "react-icons/ai";

export default function Carousel() {
  const navigate = useNavigate();

  return (
    <>
      {/* =====================================================
          OFFER BANNER
      ===================================================== */}

      <section className="offer-section max-w-7xl mx-auto">
        <div className="offer-banner">
          {/* Decorative background */}
          <div className="offer-glow offer-glow-one" />
          <div className="offer-glow offer-glow-two" />

          <div className="offer-shape offer-shape-one" />
          <div className="offer-shape offer-shape-two" />

          {/* =================================================
              LEFT CONTENT
          ================================================= */}

          <div className="offer-content">
            {/* Badge */}
            <div className="offer-label">
              <span className="offer-label-icon">⚡</span>
              LIMITED TIME OFFER
            </div>

            {/* Heading */}
            <h1 className="offer-title">
              Big Savings.
              <br />

              <span>Better Shopping.</span>
            </h1>

            {/* Description */}
            <p className="offer-description">
              Discover amazing products at unbeatable prices. Shop your
              favourites before the offer ends.
            </p>

            {/* CTA */}
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="offer-button"
            >
              <span>Shop Offers</span>

              <span className="offer-button-icon">
                <AiOutlineArrowRight size={16} />
              </span>
            </button>
          </div>

          {/* =================================================
              RIGHT OFFER VISUAL
          ================================================= */}

          <div className="offer-visual">
            {/* Main discount circle */}
            <div className="offer-circle">
              <span className="offer-up-to">UP TO</span>

              <strong>20%</strong>

              <span className="offer-off">OFF</span>
            </div>

            {/* Floating badges */}
            <div className="offer-tag offer-tag-one">
              🔥 HOT DEAL
            </div>

            <div className="offer-tag offer-tag-two">
              ✨ BEST PRICE
            </div>

            <div className="offer-tag offer-tag-three">
              🛍️ SHOP NOW
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STYLES
      ===================================================== */}

      <style>{`
        /* ===================================================
           SECTION
        =================================================== */

        .offer-section {
          width: 100%;
          padding: 12px 12px 18px;
          background: #ffffff;
        }

        /* ===================================================
           MAIN BANNER
        =================================================== */

        .offer-banner {
          position: relative;

          width: 100%;
          min-height: 280px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          overflow: hidden;

          padding: 42px 55px;

          border-radius: 30px;

          background:
            radial-gradient(
              circle at 85% 20%,
              rgba(255, 255, 255, 0.20),
              transparent 28%
            ),
            linear-gradient(
              120deg,
              #312e81 0%,
              #4338ca 42%,
              #6366f1 72%,
              #7c3aed 100%
            );

          box-shadow:
            0 18px 50px
            rgba(79, 70, 229, 0.18);
        }

        /* ===================================================
           DECORATIVE GLOW
        =================================================== */

        .offer-glow {
          position: absolute;

          border-radius: 999px;

          pointer-events: none;

          filter: blur(2px);
        }

        .offer-glow-one {
          width: 230px;
          height: 230px;

          right: 25%;
          top: -145px;

          background: rgba(255, 255, 255, 0.08);
        }

        .offer-glow-two {
          width: 180px;
          height: 180px;

          left: 35%;
          bottom: -125px;

          background: rgba(255, 255, 255, 0.07);
        }

        /* ===================================================
           DECORATIVE SHAPES
        =================================================== */

        .offer-shape {
          position: absolute;

          border:
            1px solid
            rgba(255, 255, 255, 0.08);

          border-radius: 50%;

          pointer-events: none;
        }

        .offer-shape-one {
          width: 300px;
          height: 300px;

          right: 4%;
          top: -30px;
        }

        .offer-shape-two {
          width: 220px;
          height: 220px;

          right: 13%;
          top: 40px;
        }

        /* ===================================================
           CONTENT
        =================================================== */

        .offer-content {
          position: relative;

          z-index: 5;

          max-width: 620px;
        }

        /* ===================================================
           LABEL
        =================================================== */

        .offer-label {
          display: inline-flex;

          align-items: center;

          gap: 8px;

          margin-bottom: 14px;

          padding: 7px 12px;

          border:
            1px solid
            rgba(255, 255, 255, 0.18);

          border-radius: 999px;

          background:
            rgba(255, 255, 255, 0.10);

          color:
            rgba(255, 255, 255, 0.95);

          font-size: 10px;

          font-weight: 800;

          letter-spacing: 0.09em;

          backdrop-filter:
            blur(10px);
        }

        .offer-label-icon {
          width: 22px;
          height: 22px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            rgba(255, 255, 255, 0.15);

          font-size: 12px;
        }

        /* ===================================================
           TITLE
        =================================================== */

        .offer-title {
          margin: 0;

          color: #ffffff;

          font-size:
            clamp(32px, 4.5vw, 54px);

          line-height: 1.02;

          letter-spacing: -0.045em;

          font-weight: 900;
        }

        .offer-title span {
          color: #c4b5fd;
        }

        /* ===================================================
           DESCRIPTION
        =================================================== */

        .offer-description {
          max-width: 500px;

          margin:
            14px 0 23px;

          color:
            rgba(255, 255, 255, 0.72);

          font-size: 13px;

          line-height: 1.65;
        }

        /* ===================================================
           BUTTON
        =================================================== */

        .offer-button {
          display: inline-flex;

          align-items: center;

          gap: 10px;

          padding:
            11px 12px 11px 19px;

          border: 0;

          border-radius: 999px;

          background: #ffffff;

          color: #4338ca;

          font-size: 12px;

          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 8px 22px
            rgba(0, 0, 0, 0.14);

          transition:
            transform 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .offer-button:hover {
          background: #f5f3ff;

          transform:
            translateY(-2px);

          box-shadow:
            0 12px 28px
            rgba(0, 0, 0, 0.18);
        }

        .offer-button:active {
          transform:
            scale(0.96);
        }

        .offer-button-icon {
          width: 27px;
          height: 27px;

          display: flex;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            #4f46e5;

          color: white;
        }

        /* ===================================================
           RIGHT VISUAL
        =================================================== */

        .offer-visual {
          position: relative;

          width: 310px;
          height: 245px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          z-index: 4;
        }

        /* ===================================================
           DISCOUNT CIRCLE
        =================================================== */

        .offer-circle {
          width: 190px;
          height: 190px;

          display: flex;

          flex-direction: column;

          align-items: center;
          justify-content: center;

          border-radius: 50%;

          background:
            radial-gradient(
              circle at 35% 30%,
              #ffffff,
              #f5f3ff 65%,
              #ddd6fe
            );

          color: #4338ca;

          box-shadow:
            0 18px 45px
            rgba(0, 0, 0, 0.18);

          transform:
            rotate(-6deg);

          animation:
            offer-float 4s
            ease-in-out
            infinite;
        }

        .offer-up-to {
          font-size: 11px;

          font-weight: 800;

          letter-spacing: 0.16em;
        }

        .offer-circle strong {
          margin-top: -4px;

          font-size: 58px;

          line-height: 1;

          font-weight: 950;

          letter-spacing: -0.07em;
        }

        .offer-off {
          margin-top: 3px;

          font-size: 13px;

          font-weight: 900;

          letter-spacing: 0.25em;
        }

        /* ===================================================
           FLOATING TAGS
        =================================================== */

        .offer-tag {
          position: absolute;

          padding: 8px 12px;

          border:
            1px solid
            rgba(255, 255, 255, 0.20);

          border-radius: 999px;

          background:
            rgba(255, 255, 255, 0.12);

          backdrop-filter:
            blur(12px);

          color: #ffffff;

          font-size: 9px;

          font-weight: 800;

          white-space: nowrap;

          box-shadow:
            0 7px 22px
            rgba(0, 0, 0, 0.12);
        }

        .offer-tag-one {
          top: 15px;

          right: 0;

          transform:
            rotate(6deg);
        }

        .offer-tag-two {
          bottom: 15px;

          left: 0;

          transform:
            rotate(-6deg);
        }

        .offer-tag-three {
          top: 50%;

          right: -18px;

          transform:
            translateY(-50%)
            rotate(4deg);
        }

        /* ===================================================
           FLOAT ANIMATION
        =================================================== */

        @keyframes offer-float {
          0%,
          100% {
            transform:
              translateY(0)
              rotate(-6deg);
          }

          50% {
            transform:
              translateY(-7px)
              rotate(-4deg);
          }
        }

        /* ===================================================
           TABLET
        =================================================== */

        @media (max-width: 900px) {
          .offer-banner {
            min-height: 250px;

            padding:
              35px 30px;
          }

          .offer-title {
            font-size:
              clamp(30px, 5vw, 45px);
          }

          .offer-visual {
            width: 240px;
          }

          .offer-circle {
            width: 165px;
            height: 165px;
          }

          .offer-circle strong {
            font-size: 49px;
          }

          .offer-tag-three {
            right: -5px;
          }
        }

        /* ===================================================
           MOBILE
        =================================================== */

        @media (max-width: 640px) {
          .offer-section {
            padding:
              8px 10px 14px;
          }

          .offer-banner {
            min-height: 210px;

            padding:
              25px 19px;

            border-radius: 23px;
          }

          .offer-content {
            max-width: 69%;
          }

          .offer-label {
            margin-bottom: 9px;

            padding:
              5px 8px;

            gap: 5px;

            font-size: 7px;

            letter-spacing: 0.07em;
          }

          .offer-label-icon {
            width: 18px;
            height: 18px;

            font-size: 9px;
          }

          .offer-title {
            font-size: 25px;

            letter-spacing:
              -0.035em;
          }

          .offer-description {
            margin:
              9px 0 15px;

            font-size: 9px;

            line-height: 1.5;
          }

          .offer-button {
            gap: 7px;

            padding:
              8px 9px 8px 13px;

            font-size: 9px;
          }

          .offer-button-icon {
            width: 22px;
            height: 22px;
          }

          .offer-visual {
            position: absolute;

            right: -26px;

            width: 175px;
            height: 175px;
          }

          .offer-circle {
            width: 130px;
            height: 130px;
          }

          .offer-circle strong {
            font-size: 37px;
          }

          .offer-up-to {
            font-size: 7px;
          }

          .offer-off {
            font-size: 8px;
          }

          .offer-tag {
            padding:
              5px 7px;

            font-size: 6px;
          }

          .offer-tag-one {
            top: 2px;
            right: 0;
          }

          .offer-tag-two {
            bottom: 2px;
            left: 0;
          }

          .offer-tag-three {
            display: none;
          }

          .offer-shape-one {
            width: 210px;
            height: 210px;

            right: -35px;

            top: 0;
          }

          .offer-shape-two {
            width: 150px;
            height: 150px;

            right: 0;

            top: 30px;
          }
        }

        /* ===================================================
           SMALL PHONES
        =================================================== */

        @media (max-width: 390px) {
          .offer-banner {
            min-height: 195px;

            padding:
              21px 15px;
          }

          .offer-content {
            max-width: 70%;
          }

          .offer-title {
            font-size: 22px;
          }

          .offer-description {
            font-size: 8px;

            margin:
              8px 0 12px;
          }

          .offer-visual {
            right: -34px;

            transform:
              scale(0.88);
          }
        }

        /* ===================================================
           REDUCED MOTION
        =================================================== */

        @media (prefers-reduced-motion: reduce) {
          .offer-circle {
            animation: none;
          }

          .offer-button {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}