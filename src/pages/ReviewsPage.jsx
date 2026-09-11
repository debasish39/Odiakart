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
      <div className="min-h-screen bg-[#f6f8fc]">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
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

        <main className="mx-auto max-w-6xl space-y-4 px-4 py-5">
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
    <div className="min-h-screen bg-[#f6f8fc] text-slate-900">

      {/* ===================================================
          NAVBAR
      =================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-xl">

        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-5">

          <button
            type="button"
            onClick={() =>
              navigate(-1)
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 active:scale-90"
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
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100 active:scale-90"
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

      <main className="mx-auto max-w-6xl px-3 py-4 pb-24 sm:px-5 sm:py-6 sm:pb-10">

        {/* =================================================
            PRODUCT HEADER
        ================================================= */}

        <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

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
                className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-contain sm:h-20 sm:w-20"
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
              className="hidden shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-extrabold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 sm:block"
            >
              View Product
            </button>

          </div>

        </section>

        {/* =================================================
            RATING SUMMARY
        ================================================= */}

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

          <div className="mb-5">

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-indigo-500">
                Customer feedback
              </p>
              {verifiedCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-600">
                  <FaCheckCircle size={8} />
                  {verifiedCount} verified
                </span>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  Ratings & Reviews
                </h2>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  Real experiences from shoppers who bought this product.
                </p>
              </div>
              {reviews.length > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-extrabold text-slate-500">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </span>
              )}
            </div>

          </div>

          <div className="grid gap-6 md:grid-cols-[190px_minmax(0,1fr)]">

            {/* =============================================
                BIG RATING
            ============================================= */}

            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-white p-5 text-center">

              <div className="text-5xl font-black tracking-tight text-slate-900">
                {ratingSummary.average
                  ? ratingSummary.average.toFixed(
                      1
                    )
                  : "0.0"}
              </div>

              <div className="my-2">
                <Stars
                  rating={
                    ratingSummary.average
                  }
                  size={18}
                />
              </div>

              <p className="text-[11px] font-semibold text-slate-500">
                {ratingSummary.total}{" "}
                {ratingSummary.total ===
                1
                  ? "review"
                  : "reviews"}
              </p>

            </div>

            {/* =============================================
                PROGRESS BARS
            ============================================= */}

            <div className="flex flex-col justify-center gap-3">

              {[5, 4, 3, 2, 1].map(
                (star) => {

                  const count =
                    ratingSummary
                      .distribution[
                      star
                    ] || 0;

                  const percentage =
                    ratingSummary
                      .percentages[
                      star
                    ] || 0;

                  const active =
                    ratingFilter ===
                    String(star);

                  return (
                    <button
                      type="button"
                      key={star}
                      onClick={() =>
                        setRatingFilter(
                          active
                            ? "all"
                            : String(
                                star
                              )
                        )
                      }
                      className={`group grid w-full grid-cols-[32px_12px_minmax(0,1fr)_35px] items-center gap-2 rounded-xl px-1 py-1 text-left transition ${
                        active
                          ? "bg-indigo-50"
                          : "hover:bg-slate-50"
                      }`}
                    >

                      <span className="text-right text-[10px] font-extrabold text-slate-500">
                        {star}
                      </span>

                      <FaStar
                        size={9}
                        className="text-amber-400"
                      />

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />

                      </div>

                      <span className="text-right text-[10px] font-bold text-slate-400">
                        {count}
                      </span>

                    </button>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* =================================================
            CUSTOMER PHOTO WALL
        ================================================= */}

        {customerPhotos.length > 0 && (
          <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
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
                className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-extrabold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
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
                  className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
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
        )}

        {/* =================================================
            FILTER / SORT
        ================================================= */}

        <section className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">

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
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${
                    ratingFilter === value && !photoFilter
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => setPhotoFilter((value) => !value)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${
                photoFilter
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
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
              className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 sm:w-40"
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
              className="text-[10px] font-extrabold text-indigo-600"
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

          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">

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
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-[10px] font-extrabold text-white"
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
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-indigo-100 hover:shadow-md sm:p-5"
                  >

                    {/* =====================================
                        USER
                    ===================================== */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-indigo-50">

                          {avatar ? (
                            <img
                              src={avatar}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-indigo-500">
                              <FaUserCircle
                                size={23}
                              />
                            </div>
                          )}

                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-1.5">

                            <h3 className="truncate text-xs font-black text-slate-900">
                              {getReviewerName(
                                review
                              )}
                            </h3>

                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-600">
                              <FaCheckCircle
                                size={8}
                              />

                              {review?.verifiedPurchase
                                ? "Verified Purchase"
                                : "Customer Review"}
                            </span>

                          </div>

                          <p className="mt-0.5 text-[9px] font-semibold text-slate-400">
                            {formatReviewDate(
                              review
                            )}
                          </p>

                        </div>

                      </div>

                      {/* RATING */}

                      <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1.5">

                        <span className="text-[10px] font-black text-amber-700">
                          {rating.toFixed(
                            1
                          )}
                        </span>

                        <FaStar
                          size={8}
                          className="text-amber-400"
                        />

                      </div>

                    </div>

                    {/* =====================================
                        STARS
                    ===================================== */}

                    <div className="mt-3">
                      <Stars
                        rating={
                          rating
                        }
                        size={13}
                      />
                    </div>

                    {/* =====================================
                        COMMENT
                    ===================================== */}

                    {review?.comment && (
                      <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-slate-600 sm:text-[13px]">
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
                                className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
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

                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">

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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-extrabold text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95"
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
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-extrabold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95"
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-2.5 shadow-[0_-8px_30px_rgba(15,23,42,.08)] backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-6xl gap-2">
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
            className="flex-1 rounded-xl bg-slate-100 py-2.5 text-[10px] font-black text-slate-700 active:scale-[.98]"
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
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-[10px] font-black text-white active:scale-[.98]"
          >
            📷 Photo Reviews
          </button>
        </div>
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