import React from "react";

function Skeleton({ className = "" }) {
  return (
    <div className={`home-skeleton-shimmer ${className}`} />
  );
}

/* =========================================
   CATEGORY SKELETON
========================================= */

function CategorySkeleton() {
  return (
    <section className="home-category-skeleton">
      <div className="home-category-scroll">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="home-category-item" key={index}>
            <Skeleton className="home-category-image" />
            <Skeleton className="home-category-name" />
          </div>
        ))}
      </div>
    </section>
  );
}

/* =========================================
   PRODUCT CARD
========================================= */

function ProductSkeletonCard() {
  return (
    <div className="home-product-card">
      {/* Product image */}
      <Skeleton className="home-product-image" />

      <div className="home-product-content">
        {/* Product title */}
        <Skeleton className="home-product-title" />
        <Skeleton className="home-product-title-small" />

        {/* Rating */}
        <div className="home-product-rating">
          <Skeleton className="home-rating-box" />
          <Skeleton className="home-rating-text" />
        </div>

        {/* Price */}
        <div className="home-product-price-row">
          <Skeleton className="home-price" />
          <Skeleton className="home-old-price" />
        </div>

        {/* Button */}
        <Skeleton className="home-product-button" />
      </div>
    </div>
  );
}

/* =========================================
   PRODUCT SECTION
========================================= */

function ProductSectionSkeleton({
  horizontal = false,
  cards = 6,
}) {
  return (
    <section className="home-products-section">

      {/* Heading */}
      <div className="home-section-header">
        <div>
          <Skeleton className="home-section-title" />
          <Skeleton className="home-section-subtitle" />
        </div>

        <Skeleton className="home-view-all" />
      </div>

      {/* Products */}
      <div
        className={
          horizontal
            ? "home-products-horizontal"
            : "home-products-grid"
        }
      >
        {Array.from({ length: cards }).map((_, index) => (
          <ProductSkeletonCard key={index} />
        ))}
      </div>
    </section>
  );
}

/* =========================================
   MAIN HOME SKELETON
========================================= */

export default function HomeSkeleton() {
  return (
    <main className="home-skeleton">

      {/* Ambient background */}
      <div className="home-skeleton-glow home-glow-one" />
      <div className="home-skeleton-glow home-glow-two" />

      {/* =====================================
          CATEGORY
      ===================================== */}

      <CategorySkeleton />

      {/* =====================================
          HERO
      ===================================== */}

      <section className="home-hero-skeleton">
        <div className="home-hero-content">

          <Skeleton className="home-hero-badge" />

          <Skeleton className="home-hero-title" />
          <Skeleton className="home-hero-title second" />

          <div className="home-hero-description">
            <Skeleton />
            <Skeleton />
            <Skeleton />
          </div>

          <Skeleton className="home-hero-button" />

        </div>

        {/* Hero visual */}
        <div className="home-hero-visual">

          <div className="home-hero-circle">
            <Skeleton className="home-circle-small" />
            <Skeleton className="home-circle-large" />
            <Skeleton className="home-circle-small bottom" />
          </div>

          <div className="home-floating-tag tag-one">
            <Skeleton />
          </div>

          <div className="home-floating-tag tag-two">
            <Skeleton />
          </div>

          <div className="home-floating-tag tag-three">
            <Skeleton />
          </div>

          <div className="home-ring ring-one" />
          <div className="home-ring ring-two" />

        </div>
      </section>

      {/* =====================================
          RECENTLY VIEWED
      ===================================== */}

      <ProductSectionSkeleton
        horizontal={true}
        cards={5}
      />

      {/* =====================================
          BEST SELLERS
      ===================================== */}

      <ProductSectionSkeleton cards={6} />

      {/* =====================================
          POPULAR
      ===================================== */}

      <ProductSectionSkeleton cards={6} />

      {/* =====================================
          TOP RATED
      ===================================== */}

      <ProductSectionSkeleton cards={6} />

      {/* =====================================
          FEATURED
      ===================================== */}

      <ProductSectionSkeleton cards={6} />

      {/* =====================================
          NEW ARRIVALS
      ===================================== */}

      <ProductSectionSkeleton cards={6} />

      {/* =====================================
          STYLES
      ===================================== */}

      <style>{`

        /* =========================================
           MAIN
        ========================================= */

        .home-skeleton {
          position: relative;
          width: 100%;
          min-height: 100vh;
          overflow: hidden;

          background: #ffffff;
        }

        /* =========================================
           SHIMMER
        ========================================= */

        .home-skeleton-shimmer {
          position: relative;
          overflow: hidden;

          background:
            linear-gradient(
              110deg,
              #eef2ff 8%,
              #e0e7ff 18%,
              #f5f3ff 30%,
              #e0e7ff 42%,
              #eef2ff 58%
            );

          background-size: 250% 100%;

          animation:
            homeSkeletonShimmer
            1.8s
            ease-in-out
            infinite;

          box-shadow:
            inset 0 0 15px
            rgba(255,255,255,.45);
        }

        .home-skeleton-shimmer::after {
          content: "";

          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(255,255,255,.10) 25%,
              rgba(255,255,255,.65) 50%,
              rgba(255,255,255,.10) 65%,
              transparent 100%
            );

          transform: translateX(-120%);

          animation:
            homeSkeletonGlow
            2.2s
            ease-in-out
            infinite;
        }

        @keyframes homeSkeletonShimmer {

          0% {
            background-position: 100% 0;
          }

          50% {
            background-position: 0% 0;
          }

          100% {
            background-position: -100% 0;
          }

        }

        @keyframes homeSkeletonGlow {

          0% {
            transform: translateX(-120%);
          }

          55%,
          100% {
            transform: translateX(120%);
          }

        }

        /* =========================================
           CATEGORY
        ========================================= */

        .home-category-skeleton {
          width: 100%;
          padding: 12px 12px 18px;

          background: #ffffff;
        }

        .home-category-scroll {
          display: flex;
          gap: 22px;

          width: 100%;

          overflow: hidden;
        }

        .home-category-item {
          flex: 0 0 auto;

          width: 82px;

          display: flex;
          flex-direction: column;
          align-items: center;

          gap: 9px;
        }

        .home-category-image {
          width: 68px;
          height: 68px;

          border-radius: 50%;
        }

        .home-category-name {
          width: 58px;
          height: 9px;

          border-radius: 999px;
        }

        /* =========================================
           HERO
        ========================================= */

        .home-hero-skeleton {
          position: relative;

          width: calc(100% - 24px);
          max-width: 1400px;

          min-height: 280px;

          margin: 0 auto 25px;

          padding: 42px 55px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          overflow: hidden;

          border-radius: 30px;

          background:
            radial-gradient(
              circle at 82% 30%,
              rgba(255,255,255,.18),
              transparent 30%
            ),
            linear-gradient(
              120deg,
              #312e81 0%,
              #4338ca 45%,
              #6366f1 72%,
              #7c3aed 100%
            );

          box-shadow:
            0 18px 50px
            rgba(79,70,229,.18);
        }

        .home-hero-content {
          position: relative;
          z-index: 5;

          width: 62%;
        }

        .home-hero-badge {
          width: 145px;
          height: 28px;

          margin-bottom: 16px;

          border-radius: 999px;
        }

        .home-hero-title {
          width: 270px;
          height: 40px;

          margin-bottom: 9px;

          border-radius: 10px;
        }

        .home-hero-title.second {
          width: 310px;
        }

        .home-hero-description {
          width: 100%;
          max-width: 450px;

          margin-top: 17px;

          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .home-hero-description > div {
          height: 12px;
          border-radius: 5px;
        }

        .home-hero-description > div:nth-child(1) {
          width: 100%;
        }

        .home-hero-description > div:nth-child(2) {
          width: 82%;
        }

        .home-hero-description > div:nth-child(3) {
          width: 62%;
        }

        .home-hero-button {
          width: 125px;
          height: 42px;

          margin-top: 22px;

          border-radius: 999px;
        }

        /* =========================================
           HERO VISUAL
        ========================================= */

        .home-hero-visual {
          position: relative;

          width: 310px;
          height: 245px;

          flex-shrink: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          z-index: 4;
        }

        .home-hero-circle {
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
              rgba(255,255,255,.98),
              rgba(245,243,255,.94) 65%,
              rgba(221,214,254,.85)
            );

          box-shadow:
            0 18px 45px
            rgba(0,0,0,.18);

          transform: rotate(-6deg);

          animation:
            homeSkeletonFloat
            4s
            ease-in-out
            infinite;
        }

        .home-circle-small {
          width: 50px;
          height: 10px;

          border-radius: 999px;
        }

        .home-circle-large {
          width: 100px;
          height: 50px;

          margin-top: 8px;

          border-radius: 12px;
        }

        .home-circle-small.bottom {
          width: 42px;

          margin-top: 8px;
        }

        @keyframes homeSkeletonFloat {

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

        /* =========================================
           FLOATING TAGS
        ========================================= */

        .home-floating-tag {
          position: absolute;

          padding: 8px 12px;

          border:
            1px solid
            rgba(255,255,255,.14);

          border-radius: 999px;

          background:
            rgba(255,255,255,.10);

          backdrop-filter: blur(12px);
        }

        .home-floating-tag > div {
          height: 10px;
          border-radius: 999px;
        }

        .tag-one {
          top: 15px;
          right: 0;

          transform: rotate(6deg);
        }

        .tag-one > div {
          width: 75px;
        }

        .tag-two {
          bottom: 15px;
          left: 0;

          transform: rotate(-6deg);
        }

        .tag-two > div {
          width: 90px;
        }

        .tag-three {
          top: 50%;
          right: -18px;

          transform:
            translateY(-50%)
            rotate(4deg);
        }

        .tag-three > div {
          width: 70px;
        }

        /* =========================================
           RINGS
        ========================================= */

        .home-ring {
          position: absolute;

          border:
            1px solid
            rgba(255,255,255,.08);

          border-radius: 50%;

          pointer-events: none;
        }

        .ring-one {
          width: 300px;
          height: 300px;

          right: 4%;
          top: -30px;
        }

        .ring-two {
          width: 220px;
          height: 220px;

          right: 13%;
          top: 40px;
        }

        /* =========================================
           PRODUCT SECTION
        ========================================= */

        .home-products-section {
          position: relative;

          width: 100%;
          max-width: 1400px;

          margin: 0 auto;

          padding:
            20px 12px 25px;
        }

        .home-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          margin-bottom: 18px;
        }

        .home-section-title {
          width: 190px;
          height: 24px;

          border-radius: 7px;
        }

        .home-section-subtitle {
          width: 120px;
          height: 10px;

          margin-top: 8px;

          border-radius: 999px;
        }

        .home-view-all {
          width: 80px;
          height: 32px;

          border-radius: 999px;
        }

        /* =========================================
           PRODUCT GRID
        ========================================= */

        .home-products-grid {
          display: grid;

          grid-template-columns:
            repeat(6, minmax(0, 1fr));

          gap: 15px;
        }

        .home-products-horizontal {
          display: flex;

          gap: 15px;

          overflow: hidden;
        }

        .home-products-horizontal .home-product-card {
          flex: 0 0 210px;
        }

        /* =========================================
           PRODUCT CARD
        ========================================= */

        .home-product-card {
          min-width: 0;

          overflow: hidden;

          border:
            1px solid
            #f1f1f5;

          border-radius: 15px;

          background: #ffffff;

          box-shadow:
            0 5px 20px
            rgba(0,0,0,.035);
        }

        .home-product-image {
          width: 100%;

          aspect-ratio: 1 / 1;

          border-radius: 0;
        }

        .home-product-content {
          padding: 12px;
        }

        .home-product-title {
          width: 88%;
          height: 13px;

          border-radius: 5px;
        }

        .home-product-title-small {
          width: 65%;
          height: 11px;

          margin-top: 8px;

          border-radius: 5px;
        }

        .home-product-rating {
          display: flex;
          align-items: center;

          gap: 7px;

          margin-top: 12px;
        }

        .home-rating-box {
          width: 35px;
          height: 17px;

          border-radius: 5px;
        }

        .home-rating-text {
          width: 42px;
          height: 9px;

          border-radius: 999px;
        }

        .home-product-price-row {
          display: flex;
          align-items: center;

          gap: 8px;

          margin-top: 12px;
        }

        .home-price {
          width: 58px;
          height: 18px;

          border-radius: 5px;
        }

        .home-old-price {
          width: 45px;
          height: 11px;

          border-radius: 5px;
        }

        .home-product-button {
          width: 100%;
          height: 34px;

          margin-top: 12px;

          border-radius: 8px;
        }

        /* =========================================
           AMBIENT GLOW
        ========================================= */

        .home-skeleton-glow {
          position: fixed;

          width: 250px;
          height: 250px;

          border-radius: 50%;

          pointer-events: none;

          filter: blur(70px);

          opacity: .15;
        }

        .home-glow-one {
          top: 20%;
          left: -100px;

          background: #818cf8;
        }

        .home-glow-two {
          right: -100px;
          top: 55%;

          background: #a78bfa;
        }

        /* =========================================
           TABLET
        ========================================= */

        @media (max-width: 1100px) {

          .home-products-grid {
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
          }

          .home-hero-skeleton {
            padding: 35px 30px;
          }

          .home-hero-visual {
            width: 250px;
          }

          .home-hero-circle {
            width: 165px;
            height: 165px;
          }

        }

        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 640px) {

          .home-category-skeleton {
            padding:
              8px 10px 14px;
          }

          .home-category-scroll {
            gap: 13px;
          }

          .home-category-item {
            width: 67px;
          }

          .home-category-image {
            width: 54px;
            height: 54px;
          }

          .home-category-name {
            width: 48px;
            height: 8px;
          }

          /* HERO */

          .home-hero-skeleton {
            width: calc(100% - 20px);

            min-height: 210px;

            padding:
              25px 19px;

            border-radius: 23px;
          }

          .home-hero-content {
            width: 69%;
          }

          .home-hero-badge {
            width: 105px;
            height: 20px;

            margin-bottom: 9px;
          }

          .home-hero-title {
            width: 145px;
            height: 25px;

            margin-bottom: 6px;
          }

          .home-hero-title.second {
            width: 165px;
          }

          .home-hero-description {
            max-width: 180px;

            margin-top: 10px;

            gap: 5px;
          }

          .home-hero-description > div {
            height: 7px;
          }

          .home-hero-button {
            width: 85px;
            height: 29px;

            margin-top: 13px;
          }

          /* HERO VISUAL */

          .home-hero-visual {
            position: absolute;

            right: -26px;

            width: 175px;
            height: 175px;
          }

          .home-hero-circle {
            width: 130px;
            height: 130px;
          }

          .home-circle-small {
            width: 32px;
            height: 7px;
          }

          .home-circle-large {
            width: 65px;
            height: 32px;
          }

          .home-floating-tag {
            padding:
              5px 7px;
          }

          .home-floating-tag > div {
            height: 6px;
          }

          .tag-one > div {
            width: 45px;
          }

          .tag-two > div {
            width: 55px;
          }

          .tag-three {
            display: none;
          }

          .ring-one {
            width: 210px;
            height: 210px;

            right: -35px;
            top: 0;
          }

          .ring-two {
            width: 150px;
            height: 150px;

            right: 0;
            top: 30px;
          }

          /* PRODUCTS */

          .home-products-section {
            padding:
              15px 10px 20px;
          }

          .home-section-title {
            width: 135px;
            height: 19px;
          }

          .home-section-subtitle {
            width: 90px;
            height: 8px;
          }

          .home-view-all {
            width: 62px;
            height: 26px;
          }

          .home-products-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));

            gap: 10px;
          }

          .home-products-horizontal {
            gap: 10px;
          }

          .home-products-horizontal .home-product-card {
            flex: 0 0 155px;
          }

          .home-product-content {
            padding: 9px;
          }

          .home-product-title {
            height: 10px;
          }

          .home-product-title-small {
            height: 8px;

            margin-top: 6px;
          }

          .home-rating-box {
            width: 29px;
            height: 14px;
          }

          .home-rating-text {
            width: 34px;
            height: 7px;
          }

          .home-price {
            width: 48px;
            height: 15px;
          }

          .home-old-price {
            width: 38px;
            height: 9px;
          }

          .home-product-button {
            height: 29px;

            margin-top: 9px;
          }

        }

        /* =========================================
           SMALL PHONES
        ========================================= */

        @media (max-width: 390px) {

          .home-hero-skeleton {
            min-height: 195px;

            padding:
              21px 15px;
          }

          .home-hero-title {
            width: 125px;
            height: 22px;
          }

          .home-hero-title.second {
            width: 140px;
          }

          .home-hero-description {
            max-width: 155px;
          }

          .home-hero-visual {
            right: -34px;

            transform: scale(.88);
          }

          .home-products-grid {
            gap: 8px;
          }

        }

        /* =========================================
           REDUCED MOTION
        ========================================= */

        @media (prefers-reduced-motion: reduce) {

          .home-skeleton-shimmer,
          .home-skeleton-shimmer::after,
          .home-hero-circle {
            animation: none !important;
          }

        }

      `}</style>
    </main>
  );
}