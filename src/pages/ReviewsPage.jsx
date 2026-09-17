import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  FaArrowLeft,
  FaShoppingCart,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaThumbsUp,
  FaThumbsDown,
  FaCheckCircle,
  FaUserCircle,
  FaChevronDown,
  FaImage,
  FaTimes,
  FaExpand,
} from "react-icons/fa";

import { toast } from "react-hot-toast";

/* =========================================================
   PREMIUM SHINE / GLOW UI
   Scoped to ReviewsPage so it won't affect other screens.
========================================================= */
const REVIEWS_SHINE_CSS = `
.reviews-page .shine-card,
.reviews-page .glass-card {
  position: relative;
  isolation: isolate;
}
.reviews-page .shine-card::before,
.reviews-page .glass-card::before {
  content: "";
  position: absolute;
  inset: -120% -45%;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(
    115deg,
    transparent 42%,
    rgba(255,255,255,.10) 47%,
    rgba(255,255,255,.72) 50%,
    rgba(255,255,255,.10) 53%,
    transparent 58%
  );
  transform: translateX(-45%);
  transition: transform .8s ease;
}
.reviews-page .shine-card:hover::before {
  transform: translateX(45%);
}
.reviews-page .shine-button {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.reviews-page .shine-button::after {
  content: "";
  position: absolute;
  top: -60%;
  bottom: -60%;
  left: -80%;
  width: 45%;
  pointer-events: none;
  transform: rotate(22deg);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent);
  transition: left .7s ease;
}
.reviews-page .shine-button:hover::after {
  left: 140%;
}
.reviews-page .shine-bar {
  position: relative;
  overflow: hidden;
  background-size: 200% 100%;
  animation: reviewsBarShine 2.8s linear infinite;
}
.reviews-page .shine-image {
  transition: transform .35s ease, box-shadow .35s ease;
}
.reviews-page .shine-image:hover {
  transform: translateY(-2px) scale(1.015);
  box-shadow: 0 12px 28px rgba(15,23,42,.12);
}
.reviews-page .shimmer-text {
  background: linear-gradient(110deg, #0f172a 20%, #6366f1 45%, #0f172a 70%);
  background-size: 220% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: reviewsTextShine 3.5s linear infinite;
}
@keyframes reviewsBarShine {
  to { background-position: -200% 0; }
}
@keyframes reviewsTextShine {
  to { background-position: -220% center; }
}
@media (prefers-reduced-motion: reduce) {
  .reviews-page .shine-bar,
  .reviews-page .shimmer-text {
    animation: none;
  }
}
`;


/* =========================================================
   BACKEND
========================================================= */

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;

/* =========================================================
   STAR COMPONENT
========================================================= */

function Stars({
  rating = 0,
  size = 15,
}) {
  return (
    <div className="flex items-center gap-[3px]">
      {[1, 2, 3, 4, 5].map(
        (star) => {
          const value = Number(
            rating || 0
          );

          const full = value >= star;

          const half =
            !full &&
            value >= star - 0.5;

          if (full) {
            return (
              <FaStar
                key={star}
                size={size}
                className="text-amber-400"
              />
            );
          }

          if (half) {
            return (
              <FaStarHalfAlt
                key={star}
                size={size}
                className="text-amber-400"
              />
            );
          }

          return (
            <FaRegStar
              key={star}
              size={size}
              className="text-slate-300"
            />
          );
        }
      )}
    </div>
  );
}

/* =========================================================
   REVIEW NAME
========================================================= */

function getReviewerName(review) {
  return (
    review?.reviewerName ||
    review?.userName ||
    review?.user?.name ||
    review?.customerName ||
    "Anonymous"
  );
}

/* =========================================================
   REVIEW AVATAR
========================================================= */

function getReviewerAvatar(review) {
  return (
    review?.reviewerAvatar ||
    review?.user?.avatar ||
    review?.avatar ||
    ""
  );
}

/* =========================================================
   REVIEW IMAGES
========================================================= */

function getReviewImages(review) {
  const images = [
    ...(Array.isArray(review?.images)
      ? review.images
      : []),

    ...(Array.isArray(review?.photos)
      ? review.photos
      : []),

    ...(Array.isArray(
      review?.imageUrls
    )
      ? review.imageUrls
      : []),
  ];

  return [
    ...new Set(
      images.filter(Boolean)
    ),
  ];
}

/* =========================================================
   REVIEW DATE
========================================================= */

function formatReviewDate(review) {
  if (!review?.createdAt) {
    return "";
  }

  const date = new Date(
    review.createdAt
  );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function ReviewsPage() {
  useEffect(() => { const style = document.createElement("style"); style.dataset.reviewsShine = "true"; style.textContent = REVIEWS_SHINE_CSS; document.head.appendChild(style); return () => style.remove(); }, []);
  const navigate = useNavigate();

  const { id } = useParams();

  /* =======================================================
     STATE
  ======================================================= */

  const [product, setProduct] =
    useState(null);

  const [reviews, setReviews] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [sortBy, setSortBy] =
    useState("recent");

  const [ratingFilter, setRatingFilter] =
    useState("all");

  const [photoFilter, setPhotoFilter] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState(null);

  /* =======================================================
     FETCH PRODUCT + REVIEWS
  ======================================================= */

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const response =
          await axios.get(
            `${BACKEND_URL}/api/products/${id}`
          );

        const loadedProduct =
          response?.data?.product;

        if (!mounted) return;

        setProduct(
          loadedProduct || null
        );

        setReviews(
          loadedProduct?.reviews ||
            []
        );
      } catch (error) {
        console.error(
          "Failed to fetch product reviews:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            "Unable to load reviews"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();

    return () => {
      mounted = false;
    };
  }, [id]);

  /* =======================================================
     RATING SUMMARY
  ======================================================= */

  const ratingSummary = useMemo(() => {
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (!reviews.length) {
      return {
        average: 0,
        total: 0,
        distribution,
        percentages: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    let totalRating = 0;

    reviews.forEach(
      (review) => {
        const rating = Number(
          review?.rating || 0
        );

        totalRating += rating;

        const rounded =
          Math.min(
            5,
            Math.max(
              1,
              Math.round(rating)
            )
          );

        distribution[
          rounded
        ] += 1;
      }
    );

    const total =
      reviews.length;

    const percentages = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    [5, 4, 3, 2, 1].forEach(
      (star) => {
        percentages[star] =
          Math.round(
            (distribution[star] /
              total) *
              100
          );
      }
    );

    return {
      average:
        totalRating / total,
      total,
      distribution,
      percentages,
    };
  }, [reviews]);

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const visibleReviews = useMemo(() => {
    let result = [
      ...reviews,
    ];

    if (
      ratingFilter !==
      "all"
    ) {
      result =
        result.filter(
          (review) =>
            Math.round(
              Number(
                review?.rating || 0
              )
            ) ===
            Number(
              ratingFilter
            )
        );
    }

    if (
      sortBy ===
      "rating-high"
    ) {
      result.sort(
        (a, b) =>
          Number(
            b?.rating || 0
          ) -
          Number(
            a?.rating || 0
          )
      );
    }

    if (
      sortBy ===
      "rating-low"
    ) {
      result.sort(
        (a, b) =>
          Number(
            a?.rating || 0
          ) -
          Number(
            b?.rating || 0
          )
      );
    }

    if (
      sortBy ===
      "recent"
    ) {
      result.sort(
        (a, b) =>
          new Date(
            b?.createdAt || 0
          ) -
          new Date(
            a?.createdAt || 0
          )
      );
    }

    if (
      sortBy ===
      "helpful"
    ) {
      result.sort(
        (a, b) =>
          Number(b?.likesCount || 0) -
          Number(a?.likesCount || 0)
      );
    }

    if (photoFilter) {
      result = result.filter(
        (review) =>
          getReviewImages(review).length > 0
      );
    }

    return result;
  }, [
    reviews,
    ratingFilter,
    sortBy,
    photoFilter,
  ]);

  /* =======================================================
     LIKE / DISLIKE
  ======================================================= */

  const toggleReaction = async (
    reviewId,
    type
  ) => {
    const token =
      localStorage.getItem(
        "token"
      );

    if (!token) {
      toast.error(
        "Please login first"
      );

      navigate(
        "/sign-in"
      );

      return;
    }

    try {
      const endpoint =
        type === "like"
          ? "like"
          : "dislike";

      const response =
        await axios.put(
          `${BACKEND_URL}/api/products/${id}/review/${reviewId}/${endpoint}`,
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const likes =
        response?.data
          ?.likes;

      const dislikes =
        response?.data
          ?.dislikes;

      setReviews(
        (previous) =>
          previous.map(
            (review) =>
              review._id ===
              reviewId
                ? {
                    ...review,
                    likesCount:
                      likes ??
                      review.likesCount ??
                      0,
                    dislikesCount:
                      dislikes ??
                      review.dislikesCount ??
                      0,
                  }
                : review
          )
      );
    } catch (error) {
      console.error(
        "Review reaction error:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          "Unable to update reaction"
      );
    }
  };

  /* =======================================================
     CUSTOMER PHOTO WALL
  ======================================================= */

  const customerPhotos = useMemo(() => {
    return reviews
      .flatMap((review) =>
        getReviewImages(review).map((image) => ({
          image,
          review,
        }))
      )
      .slice(0, 12);
  }, [reviews]);

  const verifiedCount = useMemo(
    () =>
      reviews.filter(
        (review) => review?.verifiedPurchase
      ).length,
    [reviews]
  );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f3f6]">
        <header className="fixed top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
            <button
              onClick={() =>
                navigate(-1)
              }
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <FaArrowLeft
                size={13}
              />
            </button>

            <span className="text-sm font-extrabold text-slate-900">
              Ratings & Reviews
            </span>
          </div>
        </header>

        <main className="w-full space-y-4 px-4 py-5">
          <div className="h-24 animate-pulse rounded-2xl bg-white" />

          <div className="h-64 animate-pulse rounded-2xl bg-white" />

          <div className="h-44 animate-pulse rounded-2xl bg-white" />

          <div className="h-44 animate-pulse rounded-2xl bg-white" />
        </main>
      </div>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="reviews-page min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.08),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.07),transparent_25%),#f8fafc] text-slate-900">

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <header className="fixed w-full top-0 z-50 border-b border-white/70 bg-white/80 shadow-[0_8px_30px_rgba(15,23,42,0.07)] backdrop-blur-2xl">

        <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="shine-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 active:scale-90"
            aria-label="Go back"
          >
            <FaArrowLeft
              size={13}
            />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-black text-slate-900 sm:text-base">
              Ratings & Reviews
            </h1>

            <p className="truncate text-[9px] font-semibold text-slate-400 sm:text-[10px]">
              {product?.title ||
                "Product"}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/cart"
              )
            }
            className="shine-button flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600 active:scale-90"
            aria-label="Cart"
          >
            <FaShoppingCart
              size={15}
            />
          </button>

        </div>

      </header>

      {/* ===================================================
          CONTENT
      =================================================== */}

      <main className="w-full px-3 py-4 pb-24 sm:px-6 sm:py-7 sm:pb-10 lg:px-8 mt-15">

        {/* =================================================
            PRODUCT HEADER
        ================================================= */}

        <section className="glass-card shine-card mb-4 w-full overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_12px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl">

          <div className="flex items-center gap-3 p-3 sm:p-4">

            {product?.media
              ?.thumbnail && (
              <img
                src={
                  product.media
                    .thumbnail
                }
                alt={
                  product.title ||
                  "Product"
                }
                className="shine-image h-16 w-16 shrink-0 rounded-2xl border border-slate-100 bg-white object-contain p-1 shadow-sm sm:h-20 sm:w-20"
              />
            )}

            <div className="min-w-0 flex-1">

              <h2 className="line-clamp-2 text-sm font-black tracking-tight text-slate-900 sm:text-base">
                {product?.title ||
                  "Product Reviews"}
              </h2>

              <div className="mt-1.5 flex items-center gap-2">

                <Stars
                  rating={
                    ratingSummary.average
                  }
                  size={11}
                />

                <span className="text-[11px] font-black text-slate-700">
                  {ratingSummary.average
                    ? ratingSummary.average.toFixed(
                        1
                      )
                    : "0.0"}
                </span>

                <span className="text-[10px] text-slate-300">
                  •
                </span>

                <span className="text-[10px] font-semibold text-slate-500">
                  {ratingSummary.total}{" "}
                  reviews
                </span>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/product/${id}`
                )
              }
              className="shine-button hidden shrink-0 rounded-xl bg-slate-950 px-5 py-2.5 text-[10px] font-extrabold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-indigo-600 sm:block"
            >
              View Product
            </button>

          </div>

        </section>

        {/* =================================================
            RATING SUMMARY
        ================================================= */}

        <section className="glass-card shine-card mb-4 w-full overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6 lg:p-8">

          {/* =================================================
              MARKETPLACE RATING SUMMARY
          ================================================= */}

          <div className="grid grid-cols-[190px_minmax(0,1fr)] items-stretch gap-0 sm:grid-cols-[230px_minmax(0,1fr)] lg:grid-cols-[270px_minmax(0,1fr)]">

            {/* OVERALL RATING */}

            <div
              className="
                flex
                min-h-[170px]
                flex-col
                items-center
                justify-center
                border-r
                border-slate-100
                pr-4
                text-center
                sm:pr-6
                lg:pr-8
              "
            >

              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const value = Number(
                    ratingSummary.average || 0
                  );

                  return (
                    <FaStar
                      key={star}
                      size={23}
                      className={
                        value >= star
                          ? "text-[#00a83b]"
                          : value >= star - 0.5
                          ? "text-[#00a83b]"
                          : "text-slate-200"
                      }
                    />
                  );
                })}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span
                  className="
                    text-4xl
                    font-black
                    leading-none
                    tracking-tight
                    text-slate-900
                  "
                >
                  {ratingSummary.average
                    ? ratingSummary.average.toFixed(1)
                    : "0.0"}
                </span>

                <span className="text-[10px] font-bold text-slate-400">
                  / 5
                </span>
              </div>

              <p className="mt-2 text-[10px] font-semibold text-slate-500">
                {ratingSummary.total.toLocaleString()}{" "}
                {ratingSummary.total === 1
                  ? "rating"
                  : "ratings"}{" "}
                and{" "}
                {ratingSummary.total.toLocaleString()}{" "}
                {ratingSummary.total === 1
                  ? "review"
                  : "reviews"}
              </p>

              {verifiedCount > 0 && (
                <span
                  className="
                    mt-3
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-full
                    bg-emerald-50
                    px-2.5
                    py-1.5
                    text-[8px]
                    font-extrabold
                    text-emerald-600
                  "
                >
                  <FaCheckCircle size={8} />
                  {verifiedCount} verified
                </span>
              )}

            </div>

            {/* DISTRIBUTION */}

            <div className="flex min-w-0 flex-col justify-center gap-2.5 py-2 pl-5 sm:gap-3 sm:pl-7 lg:pl-9">

              {[5, 4, 3, 2, 1].map((star) => {

                const count =
                  ratingSummary.distribution[star] || 0;

                const percentage =
                  ratingSummary.percentages[star] || 0;

                const active =
                  ratingFilter === String(star);

                return (
                  <button
                    type="button"
                    key={star}
                    onClick={() =>
                      setRatingFilter(
                        active ? "all" : String(star)
                      )
                    }
                    aria-pressed={active}
                    className={`
                      group
                      grid
                      w-full
                      grid-cols-[36px_minmax(0,1fr)_48px]
                      items-center
                      gap-2.5
                      rounded-sm
                      px-1
                      py-1
                      text-left
                      transition
                      ${
                        active
                          ? "bg-blue-50"
                          : "hover:bg-slate-50"
                      }
                    `}
                  >

                    <span
                      className="
                        flex
                        items-center
                        justify-end
                        gap-1
                        text-[11px]
                        font-semibold
                        text-slate-600
                      "
                    >
                      {star}
                      <FaStar
                        size={8}
                        className="text-[#f5a623]"
                      />
                    </span>

                    <span
                      className="
                        relative
                        h-2
                        overflow-hidden
                        rounded-full
                        bg-[#e4e7eb]
                      "
                    >
                      <span
                        className="
                          absolute
                          inset-y-0
                          left-0
                          rounded-full
                          bg-[#00a83b]
                          transition-all
                          duration-700
                        "
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </span>

                    <span
                      className="
                        text-right
                        text-[10px]
                        font-medium
                        tabular-nums
                        text-slate-500
                      "
                    >
                      {count.toLocaleString()}
                    </span>

                  </button>
                );
              })}

            </div>

          </div>
        </section>

        {/* =================================================
            CUSTOMER PHOTO WALL
        ================================================= */}

        {/* {customerPhotos.length > 0 && (
          <section className="mb-3 w-full overflow-hidden border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
                  Shopper gallery
                </p>
                <h3 className="mt-0.5 text-sm font-black text-slate-900">
                  Customer photos
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPhotoFilter(true);
                  document.getElementById("review-results")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-extrabold text-slate-600 transition hover:bg-blue-50 hover:text-[#2874f0]"
              >
                View photo reviews
              </button>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {customerPhotos.map(({ image, review }, index) => (
                <button
                  key={`${review?._id || index}-wall-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-slate-200 bg-slate-50"
                  aria-label="Open customer photo"
                >
                  <img
                    src={image}
                    alt="Customer review"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <span className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-slate-950/65 px-1.5 py-1 text-[7px] font-bold text-white backdrop-blur">
                    {Number(review?.rating || 0).toFixed(1)} ★
                  </span>
                </button>
              ))}
            </div>
          </section>
        )} */}

        {/* =================================================
            FILTER / SORT
        ================================================= */}

        <section className="glass-card mb-4 w-full flex flex-col gap-3 rounded-2xl border border-white/80 bg-white/90 p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.055)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">

          <div className="flex gap-1.5 overflow-x-auto pb-0.5">

            {[
              ["all", "All"],
              ["5", "5 ★"],
              ["4", "4 ★"],
              ["3", "3 ★"],
              ["2", "2 ★"],
              ["1", "1 ★"],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRatingFilter(value);
                    if (value !== "all") setPhotoFilter(false);
                  }}
                  className={`shine-button whitespace-nowrap rounded-xl border border-slate-200/80 px-3.5 py-2 text-[10px] font-extrabold shadow-sm transition ${
                    ratingFilter === value && !photoFilter
                      ? "border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20"
                      : "border-slate-200 bg-white/80 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/70 hover:text-indigo-600"
                  }`}
                >
                  {label}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setPhotoFilter((value) => !value)}
              className={`shine-button whitespace-nowrap rounded-xl border border-slate-200/80 px-3.5 py-2 text-[10px] font-extrabold shadow-sm transition ${
                photoFilter
                  ? "border-indigo-500 bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20"
                  : "border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
              }`}
            >
              📷 Photos
            </button>

          </div>

          <div className="relative shrink-0">

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value
                )
              }
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white/90 pl-3 pr-9 text-[10px] font-bold text-slate-600 outline-none shadow-sm transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100 sm:w-44"
            >

              <option value="helpful">
                Most Helpful
              </option>

              <option value="recent">
                Most Recent
              </option>

              <option value="rating-high">
                Highest Rated
              </option>

              <option value="rating-low">
                Lowest Rated
              </option>

            </select>

            <FaChevronDown
              size={8}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

          </div>

        </section>

        {/* =================================================
            RESULT COUNT
        ================================================= */}

        <div id="review-results" className="mb-3 flex items-center justify-between px-1 scroll-mt-20">

          <span className="text-[10px] font-bold text-slate-500">
            Showing{" "}
            {visibleReviews.length}{" "}
            of{" "}
            {reviews.length}{" "}
            reviews
            {photoFilter ? " · photos only" : ""}
          </span>

          {ratingFilter !==
            "all" && (
            <button
              type="button"
              onClick={() =>
                setRatingFilter(
                  "all"
                )
              }
              className="text-[10px] font-extrabold text-[#2874f0]"
            >
              Clear filter
            </button>
          )}

        </div>

        {/* =================================================
            ALL REVIEWS
        ================================================= */}

        {visibleReviews.length ===
        0 ? (

          <section className="rounded-3xl border border-dashed border-slate-300 bg-white/90 px-5 py-16 text-center shadow-[0_12px_35px_rgba(15,23,42,0.05)] backdrop-blur-xl">

            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
              <FaRegStar
                size={23}
              />
            </div>

            <h3 className="text-base font-black text-slate-900">
              No reviews found
            </h3>

            <p className="mt-1 text-xs text-slate-500">
              {photoFilter
                ? "There are no customer photo reviews yet."
                : "There are no reviews matching this filter."}
            </p>

            <button
              type="button"
              onClick={() =>
                setRatingFilter(
                  "all"
                )
              }
              className="mt-4 rounded-sm bg-[#2874f0] px-4 py-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#1f66d8]"
            >
              Show All Reviews
            </button>

          </section>

        ) : (

          <div className="space-y-3">

            {visibleReviews.map(
              (review) => {

                const images =
                  getReviewImages(
                    review
                  );

                const rating =
                  Number(
                    review?.rating ||
                      0
                  );

                const avatar =
                  getReviewerAvatar(
                    review
                  );

                return (
                  <article
                    key={
                      review?._id
                    }
                    className="shine-card group w-full overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.055)] transition duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:shadow-[0_18px_45px_rgba(79,70,229,0.12)] sm:p-5 lg:p-6"
                  >

                    {/* =====================================
                        MODERN REVIEW HEADER
                    ===================================== */}

                    <div className="flex items-center justify-between gap-3">

                      {/* AVATAR + REVIEW META */}

                      <div className="flex min-w-0 items-center gap-2.5">

                        <div
                          className="
                            relative
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-full
                            bg-[#f1f5f9]
                            ring-1
                            ring-slate-200/80
                          "
                        >

                          {avatar ? (
                            <img
                              src={avatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FaUserCircle
                              size={24}
                              className="text-slate-400"
                            />
                          )}

                          {review?.verifiedPurchase && (
                            <span
                              className="
                                absolute
                                bottom-0
                                right-0
                                flex
                                h-3.5
                                w-3.5
                                items-center
                                justify-center
                                rounded-full
                                border-2
                                border-white
                                bg-emerald-500
                              "
                            >
                              <FaCheckCircle
                                size={7}
                                className="text-white"
                              />
                            </span>
                          )}

                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            {review?.verifiedPurchase ? (
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
                                  <FaCheckCircle size={7} />
                                </span>

                                Verified Purchase
                              </span>
                            ) : (
                              <span
                                className="
                                  inline-flex
                                  items-center
                                  rounded-full
                                  bg-slate-100
                                  px-2.5
                                  py-1
                                  text-[8px]
                                  font-extrabold
                                  text-slate-500
                                "
                              >
                                Customer Review
                              </span>
                            )}

                            {formatReviewDate(review) && (
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
                                    whitespace-nowrap
                                    text-[8px]
                                    font-medium
                                    text-slate-400
                                  "
                                >
                                  {formatReviewDate(review)}
                                </span>
                              </>
                            )}

                          </div>


                        </div>

                      </div>

                      {/* RATING */}

                      <div
                        className="
                          flex
                          shrink-0
                          items-center
                          gap-1.5
                          rounded-full
                          border
                          border-emerald-100
                          bg-emerald-50
                          px-2.5
                          py-1.5
                        "
                      >

                        <FaStar
                          size={9}
                          className="text-amber-400"
                        />

                        <span
                          className="
                            text-[10px]
                            font-black
                            text-amber-700
                          "
                        >
                          {rating.toFixed(1)}
                        </span>

                      </div>

                    </div>

                    {/* =====================================
                        COMMENT
                    ===================================== */}

                    {review?.comment && (
                      <p className="mt-4 whitespace-pre-wrap text-[13px] leading-6 text-slate-600 sm:text-sm">
                        {
                          review.comment
                        }
                      </p>
                    )}

                    {/* =====================================
                        REVIEW IMAGES
                    ===================================== */}

                    {images.length >
                      0 && (

                      <div className="mt-4">

                        <div className="mb-2 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                          <FaImage
                            size={9}
                          />
                          Photos from
                          this review
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1">

                          {images.map(
                            (
                              image,
                              index
                            ) => (

                              <button
                                key={`${review._id}-${index}`}
                                type="button"
                                onClick={() =>
                                  setSelectedImage(
                                    image
                                  )
                                }
                                className="shine-image group relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm sm:h-32 sm:w-32"
                              >

                                <img
                                  src={
                                    image
                                  }
                                  alt={`Review photo ${index + 1}`}
                                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                />

                                <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-white opacity-0 transition group-hover:bg-slate-900/20 group-hover:opacity-100">
                                  <FaExpand
                                    size={12}
                                  />
                                </span>

                              </button>

                            )
                          )}

                        </div>

                      </div>
                    )}

                    {/* =====================================
                        HELPFUL
                    ===================================== */}

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">

                      <span className="mr-1 text-[9px] font-bold text-slate-400">
                        Helpful?
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          toggleReaction(
                            review._id,
                            "like"
                          )
                        }
                        className="shine-button inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-extrabold text-slate-500 transition hover:border-indigo-200 hover:bg-blue-50 hover:text-[#2874f0] active:scale-95"
                      >

                        <FaThumbsUp
                          size={9}
                        />

                        Helpful

                        <span>
                          {Number(
                            review?.likesCount ||
                              0
                          )}
                        </span>

                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleReaction(
                            review._id,
                            "dislike"
                          )
                        }
                        className="shine-button inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-extrabold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
                      >

                        <FaThumbsDown
                          size={9}
                        />

                        <span>
                          {Number(
                            review?.dislikesCount ||
                              0
                          )}
                        </span>

                      </button>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </main>

      {/* ===================================================
          MOBILE REVIEW FILTER BAR
      =================================================== */}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/80 bg-white/85 p-2.5 shadow-[0_-14px_40px_rgba(15,23,42,.12)] backdrop-blur-2xl sm:hidden">
        {/* <div className="flex w-full gap-2">
          <button
            type="button"
            onClick={() => {
              setRatingFilter("all");
              setPhotoFilter(false);
              document.getElementById("review-results")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className="shine-button flex-1 rounded-xl border border-slate-200 bg-white py-3 text-[10px] font-black text-slate-700 shadow-sm active:scale-[.98]"
          >
            All Reviews
          </button>
          <button
            type="button"
            onClick={() => {
              setPhotoFilter(true);
              setRatingFilter("all");
              document.getElementById("review-results")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className="shine-button flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 py-3 text-[10px] font-black text-white shadow-md shadow-indigo-500/20 active:scale-[.98]"
          >
            📷 Photo Reviews
          </button>
        </div> */}
      </div>

      {/* ===================================================
          IMAGE LIGHTBOX
      =================================================== */}

      {selectedImage && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-xl"
          onClick={() =>
            setSelectedImage(
              null
            )
          }
        >

          <button
            type="button"
            onClick={() =>
              setSelectedImage(
                null
              )
            }
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 active:scale-90"
            aria-label="Close image"
          >
            <FaTimes
              size={15}
            />
          </button>

          <img
            src={selectedImage}
            alt="Review"
            className="max-h-[90vh] max-w-[95vw] rounded-2xl object-contain shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          />

        </div>

      )}

    </div>
  );
}