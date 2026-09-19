import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";

import {
  IoCartOutline,
} from "react-icons/io5";

import {
  FaHeart,
  FaRupeeSign,
  FaRegHeart,
  FaChevronLeft,
  FaChevronRight,
  FaShare
} from "react-icons/fa";

// import { FaShare } from "react-icons/ri";

import {
  AiOutlineEye,
} from "react-icons/ai";

import {
  useNavigate,
} from "react-router-dom";

import {
  useCart,
} from "../context/CartContext";

import {
  useWishlist,
} from "../context/wishlistContext";

import {
  toast,
} from "sonner";


export default function ProductCard({
  product,
}) {

  const navigate = useNavigate();

  const [showProductModal, setShowProductModal] = useState(false);

  // Normal click opens the product page.
  // Holding the card for a moment opens the quick-view modal instead.
  const longPressTimer = useRef(null);
  const longPressTriggered = useRef(false);
  const suppressNextClick = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });

  const modalPointerStart = useRef({ x: 0, y: 0 });
  const modalSwipeActive = useRef(false);

  const LONG_PRESS_MS = 650;
  const SWIPE_THRESHOLD = 35;


  /* ============================================================
     AUTH
     ============================================================ */

  const token =
    localStorage.getItem("token");

  const isSignedIn =
    Boolean(token);


  /* ============================================================
     CART / WISHLIST
     ============================================================ */

  const {
    addToCart,
    cartItem = [],
  } = useCart();

  const {
    wishlist = [],
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();


  /* ============================================================
     IMAGES
     ============================================================ */

  const allImages = useMemo(() => {

    const images = [];

    // Thumbnail
    if (
      product?.media?.thumbnail
    ) {
      images.push(
        product.media.thumbnail
      );
    }

    // Product images
    if (
      Array.isArray(
        product?.media?.images
      )
    ) {
      images.push(
        ...product.media.images
      );
    }

    // Variant images
    if (
      Array.isArray(
        product?.variants
      )
    ) {

      product.variants.forEach(
        (variant) => {

          if (
            Array.isArray(
              variant?.images
            )
          ) {
            images.push(
              ...variant.images
            );
          }

        }
      );

    }

    return [
      ...new Set(
        images.filter(Boolean)
      ),
    ];

  }, [product]);


  /* ============================================================
     PRICE
     ============================================================ */

  const displayPrice = useMemo(() => {

    const variants =
      Array.isArray(
        product?.variants
      )
        ? product.variants
        : [];

    const activeVariants =
      variants.filter(
        (variant) =>
          variant?.isActive !== false
      );

    const prices =
      activeVariants
        .map((variant) =>
          Number(
            variant?.price
          )
        )
        .filter(
          (price) =>
            !Number.isNaN(price) &&
            price >= 0
        );

    if (prices.length > 0) {
      return Math.min(...prices);
    }

    if (
      typeof product?.price ===
      "number"
    ) {
      return product.price;
    }

    return 0;

  }, [product]);


  /* ============================================================
     BRAND
     ============================================================ */

  const brandName =
    typeof product?.brand === "object"
      ? product.brand?.name
      : product?.brand;


  /* ============================================================
     RATING
     ============================================================ */

  const ratingValue = useMemo(() => {

    if (
      typeof product?.rating ===
      "number"
    ) {
      return product.rating;
    }

    if (
      typeof product?.rating?.average ===
      "number"
    ) {
      return product.rating.average;
    }

    if (
      typeof product?.ratings?.average ===
      "number"
    ) {
      return product.ratings.average;
    }

    return 0;

  }, [product]);


  /* ============================================================
     STATE
     ============================================================ */

  const [
    activeIdx,
    setActiveIdx,
  ] = useState(0);

  const [
    imgLoaded,
    setImgLoaded,
  ] = useState({});

  const [
    heartAnim,
    setHeartAnim,
  ] = useState(false);

  const [
    modalImgLoaded,
    setModalImgLoaded,
  ] = useState({});


  /* ============================================================
     AUTO IMAGE SCROLL
     ============================================================ */

  const scrollTimer =
    useRef(null);


  const startAutoScroll =
    useCallback(() => {

      if (
        allImages.length <= 1
      ) {
        return;
      }

      clearInterval(
        scrollTimer.current
      );

      scrollTimer.current =
        setInterval(() => {

          setActiveIdx(
            (prev) =>
              (prev + 1) %
              allImages.length
          );

        }, 1400);

    }, [allImages.length]);


  const stopAutoScroll =
    useCallback(() => {

      clearInterval(
        scrollTimer.current
      );

    }, []);


  /* ============================================================
     IMAGE NAVIGATION
     ============================================================ */

  const prev = (e) => {

    e.stopPropagation();

    if (
      allImages.length === 0
    ) {
      return;
    }

    setActiveIdx(
      (prev) =>
        (prev - 1 +
          allImages.length) %
        allImages.length
    );

  };


  const next = (e) => {

    e.stopPropagation();

    if (
      allImages.length === 0
    ) {
      return;
    }

    setActiveIdx(
      (prev) =>
        (prev + 1) %
        allImages.length
    );

  };


  /* ============================================================
     CART STATUS
     ============================================================ */

  const isInCart =
    cartItem.some(
      (item) =>
        String(
          item.productId
        ) ===
        String(
          product._id
        )
    );


  /* ============================================================
     WISHLIST STATUS
     ============================================================ */

  const isLiked =
    wishlist.some(
      (item) =>
        String(
          item.productId
        ) ===
        String(
          product._id
        )
    );


  /* ============================================================
     ADD TO CART
     ============================================================ */

  const handleAddToCart = async (e) => {
    e?.stopPropagation();

      if (!isSignedIn) {

        toast.error(
          "Please login first"
        );

        navigate(
          "/sign-in"
        );

        return;
      }


      if (isInCart) {

        navigate(
          "/cart"
        );

        return;
      }


      try {

        await addToCart(
          product
        );

      } catch (error) {

        console.error(
          "Add cart error:",
          error
        );

      }

    };


  /* ============================================================
     WISHLIST
     ============================================================ */

  const handleToggleWishlist =
    async (e) => {

      e.stopPropagation();


      if (!isSignedIn) {

        toast.error(
          "Please login first"
        );

        navigate(
          "/sign-in"
        );

        return;
      }


      setHeartAnim(true);

      setTimeout(() => {
        setHeartAnim(false);
      }, 500);


      try {

        if (isLiked) {

          await removeFromWishlist(
            String(
              product._id
            )
          );

        } else {

          await addToWishlist(
            product
          );

        }

      } catch (error) {

        console.error(
          "Wishlist error:",
          error
        );

      }

    };


  /* ============================================================
     PRODUCT DETAILS
     ============================================================ */

  const openProduct = () => {
    navigate(`/products/${product._id}`);
  };

  const handleShare = async (e) => {
    e?.stopPropagation();

    const shareUrl = `${window.location.origin}/products/${product?._id}`;
    const shareTitle = product?.title || "Product";
    const shareText = `Check out ${shareTitle} on Odikart`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Product link copied");
        return;
      }

      toast.info("Copy the product URL to share");
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast.error("Unable to share product");
      }
    }
  };

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    clearLongPress();

    longPressTriggered.current = false;
    suppressNextClick.current = false;

    pointerStart.current = {
      x: e.clientX,
      y: e.clientY,
    };

    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      suppressNextClick.current = true;
      setShowProductModal(true);
    }, LONG_PRESS_MS);
  }, [clearLongPress]);

  const handlePointerMove = useCallback((e) => {
    const dx = Math.abs(e.clientX - pointerStart.current.x);
    const dy = Math.abs(e.clientY - pointerStart.current.y);

    if (dx > 10 || dy > 10) {
      clearLongPress();
    }
  }, [clearLongPress]);

  const handlePointerUp = useCallback((e) => {
    clearLongPress();

    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;

    if (
      allImages.length > 1 &&
      Math.abs(dx) >= SWIPE_THRESHOLD &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      suppressNextClick.current = true;

      setActiveIdx((current) =>
        dx < 0
          ? (current + 1) % allImages.length
          : (current - 1 + allImages.length) % allImages.length
      );
    }
  }, [allImages.length, clearLongPress]);

  const handlePointerCancel = useCallback(() => {
    clearLongPress();
    suppressNextClick.current = true;
  }, [clearLongPress]);

  const handleCardClick = useCallback(() => {
    if (
      longPressTriggered.current ||
      suppressNextClick.current
    ) {
      longPressTriggered.current = false;
      suppressNextClick.current = false;
      return;
    }

    openProduct();
  }, [product?._id]);

  const closeProductModal = () => {
    setShowProductModal(false);
  };


  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!showProductModal) return;

    setModalImgLoaded((prev) => ({
      ...prev,
      [activeIdx]: false,
    }));

    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeProductModal();
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showProductModal, activeIdx]);


  useEffect(() => {
    if (activeIdx >= allImages.length && allImages.length > 0) {
      setActiveIdx(0);
    }
  }, [activeIdx, allImages.length]);


  /* ============================================================
     MODAL IMAGE SWIPE
     ============================================================ */

  const handleModalPointerDown = useCallback((e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;

    modalSwipeActive.current = true;
    modalPointerStart.current = {
      x: e.clientX,
      y: e.clientY,
    };
  }, []);

  const handleModalPointerUp = useCallback((e) => {
    if (!modalSwipeActive.current) return;

    modalSwipeActive.current = false;

    const dx = e.clientX - modalPointerStart.current.x;
    const dy = e.clientY - modalPointerStart.current.y;

    if (
      allImages.length > 1 &&
      Math.abs(dx) >= SWIPE_THRESHOLD &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      setActiveIdx((current) =>
        dx < 0
          ? (current + 1) % allImages.length
          : (current - 1 + allImages.length) % allImages.length
      );
    }
  }, [allImages.length]);

  const handleModalPointerCancel = useCallback(() => {
    modalSwipeActive.current = false;
  }, []);


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <>

      <style>{`

        @import url(
          'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
        );


        /* =====================================================
           ROOT
           ===================================================== */

        @keyframes pcAnimeShine {
          0% {
            transform: translateX(-160%) skewX(-18deg);
            opacity: 0;
          }
          18% { opacity: 0; }
          32% { opacity: .9; }
          48% { opacity: .12; }
          62%, 100% {
            transform: translateX(320%) skewX(-18deg);
            opacity: 0;
          }
        }

        @keyframes pcModalGlow {
          0%, 100% { opacity: .35; transform: scale(.96); }
          50% { opacity: .75; transform: scale(1); }
        }

        .pc-anime-shine {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .pc-anime-shine::after {
          content: "";
          position: absolute;
          top: -35%;
          bottom: -35%;
          left: -45%;
          width: 26%;
          z-index: 30;
          pointer-events: none;
          transform: skewX(-18deg);
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0) 18%,
            rgba(255,255,255,.9) 48%,
            rgba(255,255,255,.2) 64%,
            transparent 100%
          );
          filter: blur(.25px);
          animation: pcAnimeShine 4.6s ease-in-out infinite;
        }

        .pc-modal-image-wrap::before {
          content: "";
          position: absolute;
          width: 72%;
          aspect-ratio: 1;
          left: 14%;
          top: 10%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,.13), transparent 68%);
          animation: pcModalGlow 3.4s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        .pc-modal-image,
        .pc-modal-thumbs,
        .pc-modal-image-skel {
          position: relative;
          z-index: 2;
        }

        .pc-modal-image-wrap {
          overscroll-behavior-x: contain;
        }

        .pc-img-track {
          touch-action: pan-y;
        }

        .pc-root {
          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          width: 100%;
        }


        /* =====================================================
           SMALL MODERN CARD
           ===================================================== */

        .pc-card {
          position: relative;

          width: 100%;

          overflow: hidden;

          cursor: pointer;

          background:
            #ffffff;

          border:
            1px solid
            rgba(99,102,241,.10);

          border-radius:
            16px;

          box-shadow:
            0 4px 16px
            rgba(15,23,42,.055);

          transition:
            transform .22s ease,
            box-shadow .22s ease,
            border-color .22s ease;
        }


        .pc-card:hover {
          transform:
            translateY(-3px);

          border-color:
            rgba(99,102,241,.18);

          box-shadow:
            0 10px 25px
            rgba(79,70,229,.10);
        }


        /* =====================================================
           IMAGE AREA
           ===================================================== */

        .pc-image-area {
          position: relative;

          height: 145px;

          overflow: hidden;

          touch-action: pan-y;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;

          background:
            radial-gradient(
              circle at 50% 25%,
              rgba(99,102,241,.08),
              transparent 60%
            ),
            #f8faff;
        }


        /* =====================================================
           IMAGE TRACK
           ===================================================== */

        .pc-img-track {
          display: flex;

          width: 100%;

          height: 100%;

          will-change:
            transform;

          transition:
            transform .42s
            cubic-bezier(
              .22,
              1,
              .36,
              1
            );
        }


        .pc-img-slide {
          flex:
            0 0 100%;

          width: 100%;

          height: 100%;

          display: flex;

          align-items:
            center;

          justify-content:
            center;
        }


        .pc-img {
          width: 100%;

          height: 100%;

          object-fit:
            contain;

          padding:
            8px;

          user-select:
            none;

          -webkit-user-drag:
            none;

          transition:
            transform .35s ease,
            opacity .25s ease;
        }


        .pc-card:hover
        .pc-img {
          transform:
            scale(1.045);
        }


        /* =====================================================
           IMAGE SKELETON
           ===================================================== */

        @keyframes pcSkel {

          0% {
            background-position:
              -200% center;
          }

          100% {
            background-position:
              200% center;
          }

        }


        .pc-skel {
          position: absolute;
          inset: 0;
          z-index: 4;
          background:
            linear-gradient(
              110deg,
              #eef2ff 20%,
              #f8fafc 38%,
              #e0e7ff 50%,
              #f8fafc 62%,
              #eef2ff 80%
            );
          background-size: 250% 100%;
          animation: pcSkel 1.35s ease-in-out infinite;
          pointer-events: none;
        }

        .pc-modal-image-skel {
          position: absolute;
          inset: 24px;
          z-index: 2;
          border-radius: 18px;
          background:
            linear-gradient(
              110deg,
              #eef2ff 20%,
              #ffffff 38%,
              #e0e7ff 50%,
              #ffffff 62%,
              #eef2ff 80%
            );
          background-size: 250% 100%;
          animation: pcSkel 1.35s ease-in-out infinite;
          pointer-events: none;
        }


        /* =====================================================
           FEATURED BADGE
           ===================================================== */

        .pc-badge {
          position:
            absolute;

          top:
            7px;

          left:
            7px;

          z-index:
            10;

          display:
            inline-flex;

          align-items:
            center;

          padding:
            3px 7px;

          border-radius:
            999px;

          background:
            rgba(255,255,255,.90);

          backdrop-filter:
            blur(8px);

          -webkit-backdrop-filter:
            blur(8px);

          border:
            1px solid
            rgba(99,102,241,.10);

          color:
            #4f46e5;

          font-size:
            7px;

          font-weight:
            800;

          letter-spacing:
            .04em;

          text-transform:
            uppercase;
        }


        /* =====================================================
           WISHLIST
           ===================================================== */

        .pc-heart {
          position:
            absolute;

          top:
            7px;

          right:
            7px;

          z-index:
            20;

          width:
            28px;

          height:
            28px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          border-radius:
            50%;

          background:
            rgba(255,255,255,.92);

          backdrop-filter:
            blur(8px);

          -webkit-backdrop-filter:
            blur(8px);

          border:
            1px solid
            rgba(15,23,42,.06);

          box-shadow:
            0 3px 9px
            rgba(15,23,42,.09);

          cursor:
            pointer;

          transition:
            transform .18s ease,
            background .18s ease;
        }


        .pc-heart:hover {
          transform:
            scale(1.08);

          background:
            #ffffff;
        }


        .pc-heart.liked {
          background:
            #fff1f4;

          border-color:
            rgba(244,63,94,.15);
        }


        /* =====================================================
           HEART ANIMATION
           ===================================================== */

        @keyframes heartBeat {

          0% {
            transform:
              scale(1);
          }

          30% {
            transform:
              scale(1.35);
          }

          60% {
            transform:
              scale(.90);
          }

          100% {
            transform:
              scale(1);
          }

        }


        .heart-beat {
          animation:
            heartBeat
            .45s
            ease
            both;
        }


        /* =====================================================
           ARROWS
           ===================================================== */

     


        /* =====================================================
           IMAGE DOTS
           ===================================================== */

        .pc-dots {
          position:
            absolute;

          left:
            50%;

          bottom:
            7px;

          z-index:
            15;

          display:
            flex;

          align-items:
            center;

          gap:
            3px;

          transform:
            translateX(-50%);

          padding:
            3px 6px;

          border-radius:
            999px;

          background:
            rgba(15,23,42,.18);

          backdrop-filter:
            blur(7px);
        }


        .pc-dot {
          width:
            4px;

          height:
            4px;

          padding:
            0;

          border:
            0;

          border-radius:
            999px;

          background:
            rgba(255,255,255,.60);

          cursor:
            pointer;

          transition:
            width .22s ease,
            background .22s ease;
        }


        .pc-dot.active {
          width:
            12px;

          background:
            #ffffff;
        }


        /* =====================================================
           IMAGE COUNT
           ===================================================== */

        .pc-count-badge {
          position:
            absolute;

          right:
            7px;

          bottom:
            7px;

          z-index:
            15;

          padding:
            3px 6px;

          border-radius:
            7px;

          background:
            rgba(15,23,42,.42);

          backdrop-filter:
            blur(7px);

          color:
            #ffffff;

          font-size:
            7px;

          font-weight:
            700;
        }


        /* =====================================================
           QUICK VIEW
           ===================================================== */

        .pc-overlay {
          position:
            absolute;

          inset:
            0;

          z-index:
            8;

          display:
            flex;

          align-items:
            flex-end;

          justify-content:
            center;

          padding-bottom:
            11px;

          background:
            linear-gradient(
              to bottom,
              transparent 45%,
              rgba(15,23,42,.28)
            );

          opacity:
            0;

          transition:
            opacity .22s ease;

          pointer-events:
            none;
        }


        .pc-card:hover
        .pc-overlay {
          opacity:
            1;
        }


        .pc-quick-btn {
          display:
            inline-flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            5px;

          padding:
            5px 11px;

          border:
            0;

          border-radius:
            999px;

          background:
            rgba(255,255,255,.94);

          color:
            #312e81;

          font-size:
            9px;

          font-weight:
            700;

          box-shadow:
            0 5px 15px
            rgba(15,23,42,.14);

          transform:
            translateY(7px);

          opacity:
            0;

          cursor:
            pointer;

          transition:
            transform .22s ease,
            opacity .22s ease;
        }


        .pc-card:hover
        .pc-quick-btn {
          transform:
            translateY(0);

          opacity:
            1;

          pointer-events:
            auto;
        }


        /* =====================================================
           PRODUCT INFO
           ===================================================== */

        .pc-info {
          padding:
            9px 10px 10px;
        }


        /* =====================================================
           TITLE
           ===================================================== */

        .pc-title {
          margin:
            0;

          font-size:
            12px;

          line-height:
            1.35;

          font-weight:
            700;

          color:
            #1e1b4b;

          display:
            -webkit-box;

          -webkit-line-clamp:
            2;

          -webkit-box-orient:
            vertical;

          overflow:
            hidden;

          cursor:
            pointer;

          transition:
            color .18s ease;
        }


        .pc-title:hover {
          color:
            #4f46e5;
        }


        /* =====================================================
           BRAND
           ===================================================== */

        .pc-brand {
          margin-top:
            3px;

          margin-bottom:
            4px;

          font-size:
            8.5px;

          font-weight:
            600;

          color:
            #818cf8;
        }


        /* =====================================================
           RATING
           ===================================================== */

        .pc-rating {
          display:
            inline-flex;

          align-items:
            center;

          gap:
            3px;

          margin-bottom:
            5px;

          padding:
            2px 5px;

          border-radius:
            999px;

          background:
            #f8fafc;

          border:
            1px solid
            #eef2ff;
        }


        .pc-rating-stars {
          display:
            flex;

          align-items:
            center;

          gap:
            0;
        }


        .pc-rating-value {
          font-size:
            8px;

          font-weight:
            700;

          color:
            #64748b;
        }


        /* =====================================================
           PRICE
           ===================================================== */

        .pc-price-row {
          display:
            flex;

          align-items:
            baseline;

          gap:
            3px;

          margin-bottom:
            7px;
        }


        .pc-price-symbol {
          color:
            #4f46e5;

          font-size:
            10px;

          font-weight:
            800;
        }


        .price-text {
          background:
            linear-gradient(
              135deg,
              #4f46e5,
              #2563eb
            );

          -webkit-background-clip:
            text;

          -webkit-text-fill-color:
            transparent;

          background-clip:
            text;

          font-size:
            15px;

          font-weight:
            800;

          line-height:
            1;
        }


        /* =====================================================
           CART BUTTON
           ===================================================== */

        .btn-cart {
          width:
            100%;

          min-height:
            32px;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          gap:
            5px;

          padding:
            6px 8px;

          border:
            0;

          border-radius:
            9px;

          font-family:
            'Plus Jakarta Sans',
            sans-serif;

          font-size:
            9.5px;

          font-weight:
            800;

          cursor:
            pointer;

          transition:
            transform .18s ease,
            box-shadow .18s ease,
            background .18s ease;
        }


        .btn-cart.new {
          color:
            #ffffff;

          background:
            linear-gradient(
              135deg,
              #6366f1,
              #4f46e5
            );

          box-shadow:
            0 4px 12px
            rgba(79,70,229,.18);
        }


        .btn-cart.new:hover {
          transform:
            translateY(-1px);

          box-shadow:
            0 7px 16px
            rgba(79,70,229,.25);
        }


        .btn-cart.in-cart {
          color:
            #4f46e5;

          background:
            #f3f5ff;

          border:
            1px solid
            rgba(99,102,241,.13);
        }


        .btn-cart.in-cart:hover {
          background:
            #eef2ff;

          transform:
            translateY(-1px);
        }


        /* =====================================================
           MOBILE
           ===================================================== */

        @media (max-width: 640px) {

          .pc-card {
            border-radius:
              14px;
          }


          .pc-image-area {
            height:
              135px;
          }


          .pc-img {
            padding:
              7px;
          }


          .pc-heart {
            width:
              27px;

            height:
              27px;
          }


          .pc-arrow {
            opacity:
              1;

            width:
              23px;

            height:
              23px;
          }


          .pc-overlay {
            display:
              none;
          }


          .pc-info {
            padding:
              8px 9px 9px;
          }


          .pc-title {
            font-size:
              11.5px;
          }


          .pc-brand {
            font-size:
              8px;
          }


          .price-text {
            font-size:
              14px;
          }


          .btn-cart {
            min-height:
              31px;

            font-size:
              9px;
          }

        }


        /* =====================================================
           REDUCED MOTION
           ===================================================== */

        @media (
          prefers-reduced-motion: reduce
        ) {

          .pc-card,
          .pc-img,
          .pc-anime-shine::after,
          .pc-modal-image-wrap::before,
          .pc-img-track,
          .pc-arrow,
          .pc-heart,
          .btn-cart {
            transition:
              none !important;
          }

        }


        /* =====================================================
           MODERN PRODUCT DETAILS MODAL
           ===================================================== */

        .pc-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 99999;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 18px;

          background:
            radial-gradient(
              circle at 50% 35%,
              rgba(99,102,241,.12),
              transparent 45%
            ),
            rgba(2,6,23,.74);

          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);

          animation: pcModalBackdropIn .22s ease both;
        }

        .pc-modal-shell {
          width: min(960px, 100%);
          max-height: calc(100vh - 36px);

          display: flex;
          flex-direction: column;
          align-items: center;

          animation:
            pcModalShellIn .32s
            cubic-bezier(.22,1,.36,1)
            both;
        }

        .pc-modal {
          position: relative;

          width: 100%;
          max-height: calc(100vh - 36px);

          display: grid;
          grid-template-columns:
            minmax(0,1.08fr)
            minmax(330px,.92fr);

          overflow: hidden;

          border: 1px solid rgba(255,255,255,.7);
          border-radius: 26px;

          background:
            linear-gradient(
              145deg,
              #ffffff 0%,
              #f8fafc 100%
            );

          box-shadow:
            0 35px 100px rgba(0,0,0,.30),
            0 10px 35px rgba(79,70,229,.12);
        }

        /* Header */
        .pc-modal-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;

          height: 60px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          padding: 10px 14px 10px 18px;

          background:
            linear-gradient(
              to bottom,
              rgba(255,255,255,.97),
              rgba(255,255,255,.78),
              transparent
            );

          pointer-events: none;
        }

        .pc-modal-header-brand {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          padding: 6px 10px;

          border: 1px solid rgba(99,102,241,.10);
          border-radius: 999px;

          background: rgba(255,255,255,.86);

          color: #475569;

          font-size: 10px;
          font-weight: 800;
          letter-spacing: .04em;
          text-transform: uppercase;

          box-shadow:
            0 4px 15px rgba(15,23,42,.06);

          pointer-events: auto;
        }

        .pc-modal-header-dot {
          width: 6px;
          height: 6px;

          border-radius: 50%;
          background: #6366f1;

          box-shadow:
            0 0 0 4px rgba(99,102,241,.10);
        }

        .pc-modal-header-actions {
          display: flex;
          align-items: center;
          gap: 7px;

          pointer-events: auto;
        }

        /* Share */
        .pc-modal-share {
          height: 36px;

          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;

          padding: 0 12px;

          border: 1px solid rgba(99,102,241,.12);
          border-radius: 999px;

          background: rgba(255,255,255,.95);
          color: #4f46e5;

          font-family: inherit;
          font-size: 10px;
          font-weight: 800;

          cursor: pointer;

          box-shadow:
            0 5px 16px rgba(15,23,42,.08);

          transition:
            transform .2s ease,
            background .2s ease,
            box-shadow .2s ease;
        }

        .pc-modal-share:hover {
          transform: translateY(-1px);
          background: #eef2ff;

          box-shadow:
            0 8px 20px rgba(79,70,229,.14);
        }

        .pc-modal-share:active {
          transform: scale(.95);
        }

        /* Close */
        .pc-modal-close {
          width: 36px;
          height: 36px;

          display: grid;
          place-items: center;

          border: 1px solid rgba(15,23,42,.08);
          border-radius: 50%;

          background: rgba(255,255,255,.95);
          color: #334155;

          cursor: pointer;

          box-shadow:
            0 5px 16px rgba(15,23,42,.09);

          transition:
            transform .2s ease,
            background .2s ease,
            color .2s ease;
        }

        .pc-modal-close span {
          margin-top: -2px;
          font-size: 23px;
          font-weight: 400;
          line-height: 1;
        }

        .pc-modal-close:hover {
          transform: rotate(90deg);
          background: #f8fafc;
          color: #ef4444;
        }

        .pc-modal-close:active {
          transform: rotate(90deg) scale(.92);
        }

        /* Image */
        .pc-modal-image-wrap {
          position: relative;
          min-width: 0;
          min-height: 500px;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 60px 30px 78px;

          overflow: hidden;

          border-right: 1px solid rgba(15,23,42,.06);

          background:
            radial-gradient(
              circle at 50% 38%,
              rgba(99,102,241,.13),
              transparent 50%
            ),
            linear-gradient(
              145deg,
              #f8faff,
              #ffffff 52%,
              #f5f7ff
            );

          touch-action: pan-y;
          overscroll-behavior-x: contain;

          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;

          cursor: grab;
        }

        .pc-modal-image-wrap:active {
          cursor: grabbing;
        }

        .pc-modal-image-glow {
          position: absolute;
          z-index: 0;

          width: 270px;
          height: 270px;

          left: 50%;
          top: 50%;

          transform: translate(-50%,-50%);

          border-radius: 50%;

          background: rgba(99,102,241,.13);

          filter: blur(65px);

          animation:
            pcModalGlow 3.5s ease-in-out infinite;

          pointer-events: none;
        }

        .pc-modal-image {
          position: relative;
          z-index: 3;

          display: block;

          width: 100%;
          height: min(55vh,470px);

          object-fit: contain;

          border-radius: 20px;

          filter:
            drop-shadow(
              0 18px 25px rgba(15,23,42,.10)
            );

          user-select: none;
          -webkit-user-drag: none;
          -webkit-touch-callout: none;
        }

        .pc-modal-no-image {
          position: relative;
          z-index: 3;

          width: 100%;
          height: 420px;

          display: grid;
          place-items: center;

          border-radius: 20px;

          background: #f8fafc;
          color: #94a3b8;

          font-size: 14px;
          font-weight: 700;
        }

        /* Modal skeleton */
        .pc-modal-image-skel {
          position: absolute;
          z-index: 2;

          inset: 60px 30px 78px;

          border-radius: 20px;

          background:
            linear-gradient(
              110deg,
              #eef2f7 20%,
              #ffffff 38%,
              #e8ecf7 50%,
              #ffffff 62%,
              #eef2f7 80%
            );

          background-size: 250% 100%;

          animation:
            pcModalSkeleton 1.35s ease-in-out infinite;

          pointer-events: none;
        }

        /* Shine stays above the image but below controls */
        .pc-modal-image-wrap.pc-anime-shine::after {
          z-index: 8;
        }

        /* Navigation */
        .pc-modal-nav {
          position: absolute;
          top: 50%;
          z-index: 20;

          width: 40px;
          height: 40px;

          display: grid;
          place-items: center;

          border: 1px solid rgba(99,102,241,.12);
          border-radius: 50%;

          background: rgba(255,255,255,.95);
          color: #4f46e5;

          box-shadow:
            0 8px 22px rgba(15,23,42,.12);

          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);

          transform: translateY(-50%);

          cursor: pointer;

          transition:
            transform .2s ease,
            background .2s ease,
            box-shadow .2s ease;
        }

        .pc-modal-nav-left {
          left: 14px;
        }

        .pc-modal-nav-right {
          right: 14px;
        }

        .pc-modal-nav:hover {
          transform:
            translateY(-50%)
            scale(1.08);

          background: #eef2ff;

          box-shadow:
            0 10px 25px rgba(79,70,229,.16);
        }

        .pc-modal-nav:active {
          transform:
            translateY(-50%)
            scale(.92);
        }

        /* Counter */
        .pc-modal-image-counter {
          position: absolute;
          top: 68px;
          right: 18px;
          z-index: 20;

          display: inline-flex;
          align-items: center;
          gap: 5px;

          padding: 6px 9px;

          border-radius: 999px;

          background: rgba(15,23,42,.60);
          color: #fff;

          font-size: 9px;
          font-weight: 800;

          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .pc-modal-image-counter i {
          opacity: .45;
          font-style: normal;
        }

        /* Thumbnails */
        .pc-modal-thumbs {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 14px;
          z-index: 25;

          display: flex;
          justify-content: center;
          gap: 7px;

          overflow-x: auto;

          padding: 3px 2px;

          scrollbar-width: none;
        }

        .pc-modal-thumbs::-webkit-scrollbar {
          display: none;
        }

        .pc-modal-thumb {
          flex: 0 0 48px;

          width: 48px;
          height: 48px;

          padding: 3px;

          border: 2px solid rgba(148,163,184,.25);
          border-radius: 11px;

          background: rgba(255,255,255,.92);

          cursor: pointer;
          overflow: hidden;

          transition:
            transform .18s ease,
            border-color .18s ease,
            box-shadow .18s ease;
        }

        .pc-modal-thumb:hover {
          transform: translateY(-2px);
        }

        .pc-modal-thumb.active {
          border-color: #6366f1;

          box-shadow:
            0 0 0 3px rgba(99,102,241,.12),
            0 7px 16px rgba(79,70,229,.15);

          transform: translateY(-2px);
        }

        .pc-modal-thumb img {
          width: 100%;
          height: 100%;

          display: block;

          object-fit: contain;

          border-radius: 7px;
        }

        /* Content */
        .pc-modal-content {
          position: relative;

          min-width: 0;
          min-height: 0;

          overflow-y: auto;

          padding: 76px 30px 30px;

          background: #fff;

          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }

        .pc-modal-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          margin-bottom: 14px;
        }

        .pc-modal-featured {
          display: inline-flex;
          align-items: center;
          gap: 6px;

          padding: 5px 9px;

          border: 1px solid rgba(99,102,241,.10);
          border-radius: 999px;

          background: #eef2ff;
          color: #4f46e5;

          font-size: 9px;
          font-weight: 800;

          letter-spacing: .04em;
          text-transform: uppercase;
        }

        .pc-modal-featured-dot {
          width: 5px;
          height: 5px;

          border-radius: 50%;
          background: #6366f1;

          box-shadow:
            0 0 0 3px rgba(99,102,241,.10);
        }

        .pc-modal-rating {
          display: inline-flex;
          align-items: center;
          gap: 4px;

          padding: 5px 8px;

          border-radius: 999px;

          background: #fffbeb;
          color: #64748b;

          font-size: 10px;
          font-weight: 800;
        }

        .pc-modal-star {
          color: #f59e0b;
        }

        .pc-modal-title {
          margin: 0;

          color: #0f172a;

          font-size: clamp(21px,3vw,30px);
          line-height: 1.22;

          font-weight: 800;
          letter-spacing: -.035em;
        }

        .pc-modal-brand {
          margin: 8px 0 0;

          color: #64748b;

          font-size: 12px;
          line-height: 1.5;
        }

        .pc-modal-brand strong {
          color: #475569;
        }

        .pc-modal-price {
          display: flex;
          align-items: baseline;
          gap: 3px;

          margin-top: 18px;

          color: #111827;

          font-size: 27px;
          font-weight: 800;

          letter-spacing: -.025em;
        }

        .pc-modal-price-symbol {
          color: #4f46e5;
          font-size: 17px;
          font-weight: 800;
        }

        .pc-modal-description-box {
          margin-top: 18px;

          padding: 13px 14px;

          border: 1px solid #eef2f7;
          border-radius: 14px;

          background: #f8fafc;
        }

        .pc-modal-description {
          margin: 0;

          color: #64748b;

          font-size: 12px;
          line-height: 1.65;

          white-space: pre-line;

          display: -webkit-box;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .pc-modal-info-row {
          display: grid;
          grid-template-columns:
            repeat(2,minmax(0,1fr));

          gap: 8px;

          margin-top: 12px;
        }

        .pc-modal-info-item {
          min-width: 0;

          display: flex;
          align-items: center;
          gap: 7px;

          padding: 9px 10px;

          border: 1px solid #eef2f7;
          border-radius: 11px;

          background: #fff;
          color: #64748b;

          font-size: 9px;
          font-weight: 700;
        }

        .pc-modal-info-icon {
          width: 20px;
          height: 20px;

          flex-shrink: 0;

          display: grid;
          place-items: center;

          border-radius: 7px;

          background: #eef2ff;
          color: #4f46e5;

          font-size: 10px;
          font-weight: 900;
        }

        .pc-modal-cart {
          position: relative;

          width: 100%;
          min-height: 48px;

          margin-top: 18px;

          border-radius: 13px !important;

          overflow: hidden;

          font-size: 11px !important;

          box-shadow:
            0 9px 25px rgba(79,70,229,.18) !important;
        }

        .pc-modal-cart::after {
          content: "";

          position: absolute;

          top: -60%;
          left: -35%;

          width: 22%;
          height: 220%;

          transform: skewX(-18deg);

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(255,255,255,.55),
              transparent
            );

          pointer-events: none;

          animation:
            pcCartShine 3.8s
            ease-in-out infinite;
        }

        .pc-modal-cart-arrow {
          margin-left: auto;
          font-size: 17px;
          opacity: .75;
        }

        /* Animations */
        @keyframes pcModalBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes pcModalShellIn {
          from {
            opacity: 0;
            transform:
              translateY(18px)
              scale(.97);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        @keyframes pcModalGlow {
          0%,100% {
            opacity: .35;
            transform:
              translate(-50%,-50%)
              scale(.92);
          }

          50% {
            opacity: .75;
            transform:
              translate(-50%,-50%)
              scale(1.08);
          }
        }

        @keyframes pcModalSkeleton {
          0% {
            background-position: -200% center;
          }

          100% {
            background-position: 200% center;
          }
        }

        @keyframes pcCartShine {
          0% {
            transform:
              skewX(-18deg)
              translateX(-250%);
          }

          55%,100% {
            transform:
              skewX(-18deg)
              translateX(650%);
          }
        }

        /* Mobile */
        @media (max-width: 700px) {

          .pc-modal-backdrop {
            padding: 8px;
            align-items: center;
          }

          .pc-modal-shell {
            width: 100%;
            max-height: calc(100vh - 16px);
          }

          .pc-modal {
            display: flex;
            flex-direction: column;

            width: min(100%,520px);

            max-height: calc(100vh - 16px);

            border-radius: 24px;
          }

          .pc-modal-header {
            height: 54px;
            padding: 9px 10px 9px 14px;
          }

          .pc-modal-header-brand {
            padding: 5px 8px;
            font-size: 8px;
          }

          .pc-modal-share {
            width: 35px;
            height: 35px;
            padding: 0;
          }

          .pc-modal-share span {
            display: none;
          }

          .pc-modal-close {
            width: 35px;
            height: 35px;
          }

          .pc-modal-image-wrap {
            flex: 0 0 auto;

            min-height: 0;
            height: min(53vh,390px);

            padding:
              52px 18px 68px;

            border-right: 0;
            border-radius:
              24px 24px 0 0;
          }

          .pc-modal-image {
            height: 100%;
            max-height: 270px;
            border-radius: 17px;
          }

          .pc-modal-image-skel {
            inset:
              52px 18px 68px;
            border-radius: 17px;
          }

          .pc-modal-image-glow {
            width: 190px;
            height: 190px;
            filter: blur(50px);
          }

          .pc-modal-nav {
            width: 34px;
            height: 34px;
          }

          .pc-modal-nav-left {
            left: 9px;
          }

          .pc-modal-nav-right {
            right: 9px;
          }

          .pc-modal-image-counter {
            top: 61px;
            right: 12px;

            padding: 5px 8px;
            font-size: 8px;
          }

          .pc-modal-thumbs {
            left: 14px;
            right: 14px;
            bottom: 10px;

            justify-content: flex-start;
          }

          .pc-modal-thumb {
            flex-basis: 42px;
            width: 42px;
            height: 42px;
          }

          .pc-modal-content {
            flex: 1 1 auto;

            min-height: 0;

            padding:
              18px 18px
              max(18px,env(safe-area-inset-bottom));

            overflow-y: auto;

            border-radius:
              0 0 24px 24px;
          }

          .pc-modal-topline {
            margin-bottom: 10px;
          }

          .pc-modal-featured {
            font-size: 8px;
          }

          .pc-modal-rating {
            font-size: 9px;
          }

          .pc-modal-title {
            font-size: 20px;
          }

          .pc-modal-brand {
            font-size: 11px;
          }

          .pc-modal-price {
            margin-top: 11px;
            font-size: 22px;
          }

          .pc-modal-description-box {
            margin-top: 12px;
            padding: 10px 11px;
          }

          .pc-modal-description {
            font-size: 11px;
            -webkit-line-clamp: 4;
          }

          .pc-modal-info-row {
            margin-top: 9px;
          }

          .pc-modal-info-item {
            padding: 8px;
            font-size: 8px;
          }

          .pc-modal-info-icon {
            width: 18px;
            height: 18px;
          }

          .pc-modal-cart {
            margin-top: 13px;
            min-height: 44px;
          }
        }

        @media (max-width: 380px) {

          .pc-modal-backdrop {
            padding: 5px;
          }

          .pc-modal {
            border-radius: 20px;
          }

          .pc-modal-image-wrap {
            height: 325px;
            padding:
              50px 13px 62px;
          }

          .pc-modal-image-skel {
            inset:
              50px 13px 62px;
          }

          .pc-modal-content {
            padding:
              15px 14px
              max(15px,env(safe-area-inset-bottom));
          }

          .pc-modal-title {
            font-size: 18px;
          }

          .pc-modal-price {
            font-size: 20px;
          }

          .pc-modal-info-row {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {

          .pc-modal-backdrop,
          .pc-modal-shell,
          .pc-modal-image-glow,
          .pc-modal-image-skel,
          .pc-modal-cart::after {
            animation: none !important;
          }

          .pc-modal-share,
          .pc-modal-close,
          .pc-modal-nav,
          .pc-modal-thumb {
            transition: none !important;
          }
        }

      `}</style>


      {/* =====================================================
          CARD
          ===================================================== */}

      <div
        className="pc-root pc-card pc-anime-shine"

        style={{ touchAction: "pan-y" }}

        onClick={handleCardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}

        onMouseEnter={
          startAutoScroll
        }

        onMouseLeave={
          stopAutoScroll
        }
      >


        {/* =================================================
            IMAGE
            ================================================= */}

        <div
          className="pc-image-area pc-anime-shine"

          onClick={handleCardClick}
        >


          {allImages.length > 0 ? (

            <div
              className="pc-img-track"

              style={{
                transform:
                  `translateX(-${
                    activeIdx * 100
                  }%)`,
              }}
            >


              {allImages.map(
                (src, i) => (

                  <div
                    key={`${src}-${i}`}

                    className="pc-img-slide"
                  >


                    {!imgLoaded[i] && (
                      <div
                        className="pc-skel"
                      />
                    )}


                    <img
                      src={src}

                      alt={
                        `${product?.title || "Product"} ${
                          i + 1
                        }`
                      }

                      loading={i === 0 ? "eager" : "lazy"}
                      fetchPriority={i === 0 ? "high" : "auto"}
                      decoding="async"

                      draggable="false"

                      onContextMenu={(e) => e.preventDefault()}

                      className="pc-img"

                      style={{
                        opacity:
                          imgLoaded[i]
                            ? 1
                            : 0,
                      }}

                      onLoad={() =>
                        setImgLoaded(
                          (prev) => ({
                            ...prev,
                            [i]: true,
                          })
                        )
                      }

                      onError={(e) => {

                        e.currentTarget.src =
                          "https://via.placeholder.com/300x200?text=No+Image";

                        setImgLoaded(
                          (prev) => ({
                            ...prev,
                            [i]: true,
                          })
                        );

                      }}
                    />

                  </div>

                )
              )}

            </div>

          ) : (

            <div
              className="
                w-full
                h-full
                flex
                items-center
                justify-center
                text-slate-400
                text-xs
              "
            >
              No Image
            </div>

          )}


          {/* =================================================
              QUICK VIEW
              ================================================= */}

          {/* <div
            className="pc-overlay"
          >

            <button
              type="button"

              className="pc-quick-btn"

              onClick={(e) => {

                e.stopPropagation();

                openProduct();

              }}
            >

              <AiOutlineEye
                size={12}
              />

              Quick View

            </button>

          </div> */}


          {/* =================================================
              ARROWS
              ================================================= */}

          {allImages.length > 1 && (
            <>

              <button
                type="button"

                className="
                  pc-arrow
                  pc-arrow-left
                "

                onClick={
                  prev
                }

                aria-label="
                  Previous image
                "
              >

                <FaChevronLeft
                  size={8}
                  color="#4f46e5"
                />

              </button>


              <button
                type="button"

                className="
                  pc-arrow
                  pc-arrow-right
                "

                onClick={
                  next
                }

                aria-label="
                  Next image
                "
              >

                <FaChevronRight
                  size={8}
                  color="#4f46e5"
                />

              </button>


              {/* IMAGE DOTS */}

              <div
                className="pc-dots"
              >

                {allImages.map(
                  (_, i) => (

                    <button
                      key={i}

                      type="button"

                      className={
                        `pc-dot ${
                          i === activeIdx
                            ? "active"
                            : ""
                        }`
                      }

                      aria-label={
                        `Show image ${
                          i + 1
                        }`
                      }

                      onClick={(e) => {

                        e.stopPropagation();

                        setActiveIdx(i);

                      }}
                    />

                  )
                )}

              </div>


              {/* IMAGE COUNT */}

              <div
                className="
                  pc-count-badge
                "
              >
                {activeIdx + 1}
                /
                {allImages.length}
              </div>

            </>
          )}


          {/* =================================================
              FEATURED
              ================================================= */}

          <span
            className="pc-badge"
          >
            ✨ Featured
          </span>


          {/* =================================================
              WISHLIST
              ================================================= */}

          <button
            type="button"

            className={
              `pc-heart ${
                isLiked
                  ? "liked"
                  : ""
              }`
            }

            onClick={
              handleToggleWishlist
            }

            aria-label={
              isLiked
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
          >

            {isLiked ? (

              <FaHeart
                size={12}

                className={
                  heartAnim
                    ? "heart-beat"
                    : ""
                }

                style={{
                  color:
                    "#f43f5e",
                }}
              />

            ) : (

              <FaRegHeart
                size={12}

                className={
                  heartAnim
                    ? "heart-beat"
                    : ""
                }

                style={{
                  color:
                    "#94a3b8",
                }}
              />

            )}

          </button>

        </div>


        {/* =================================================
            PRODUCT INFORMATION
            ================================================= */}

        <div
          className="pc-info"
        >


          {/* TITLE */}

          <h2
            className="pc-title"

            onClick={handleCardClick}
          >
            {product?.title}
          </h2>


          {/* BRAND */}

          {brandName && (

            <p
              className="pc-brand"
            >
              by {brandName}
            </p>

          )}


          {/* RATING */}

          {ratingValue > 0 && (

            <div
              className="pc-rating"
            >

              <div
                className="
                  pc-rating-stars
                "
              >

                {[
                  ...Array(5),
                ].map(
                  (_, i) => (

                    <svg
                      key={i}

                      width="8"
                      height="8"

                      viewBox="0 0 24 24"

                      fill={
                        i <
                        Math.round(
                          ratingValue
                        )
                          ? "#fbbf24"
                          : "#e5e7eb"
                      }
                    >

                      <path
                        d="
                          M12 2
                          l3.09 6.26
                          L22 9.27
                          l-5 4.87
                          1.18 6.88
                          L12 17.77
                          l-6.18 3.25
                          L7 14.14
                          2 9.27
                          l6.91-1.01
                          L12 2z
                        "
                      />

                    </svg>

                  )
                )}

              </div>


              <span
                className="
                  pc-rating-value
                "
              >
                {Number(
                  ratingValue
                ).toFixed(1)}
              </span>

            </div>

          )}


          {/* PRICE */}

          <div
            className="
              pc-price-row
            "
          >

            <FaRupeeSign
              className="
                pc-price-symbol
              "

              size={10}
            />

            <span
              className="
                price-text
              "
            >
              {displayPrice.toLocaleString(
                "en-IN"
              )}
            </span>

          </div>


          {/* CART */}

          <button
            type="button"

            className={
              `btn-cart ${
                isInCart
                  ? "in-cart"
                  : "new"
              }`
            }

            onClick={
              handleAddToCart
            }
          >

            <IoCartOutline
              size={13}
            />

            <span>
              {isInCart
                ? "Go to Cart"
                : "Add to Cart"}
            </span>

          </button>

        </div>

      </div>

      {/* =====================================================
          PRODUCT DETAILS MODAL
          ===================================================== */}
     {showProductModal && (
        <div
          className="pc-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`${product?.title || "Product"} details`}
          onClick={closeProductModal}
        >
          <div
            className="pc-modal-shell"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pc-modal">

              {/* =================================================
                  MODAL HEADER
              ================================================== */}
              <div className="pc-modal-header">

                <div className="pc-modal-header-brand">
                  <div className="pc-modal-header-dot" />
                  <span>Quick View</span>
                </div>

                <div className="pc-modal-header-actions">

                  <button
                    type="button"
                    className="pc-modal-share"
                    onClick={handleShare}
                    aria-label="Share product"
                    title="Share product"
                  >
                    <FaShare size={13} />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    className="pc-modal-close"
                    onClick={closeProductModal}
                    aria-label="Close product details"
                  >
                    <span>×</span>
                  </button>

                </div>
              </div>

              {/* =================================================
                  IMAGE SECTION
              ================================================== */}
              <div
                className="pc-modal-image-wrap pc-anime-shine"
                title="Swipe image left or right to view more"
                onPointerDown={handleModalPointerDown}
                onPointerUp={handleModalPointerUp}
                onPointerCancel={handleModalPointerCancel}
                onContextMenu={(e) => e.preventDefault()}
              >

                <div
                  className="pc-modal-image-glow"
                  aria-hidden="true"
                />

                {allImages.length > 0 ? (
                  <>
                    {!modalImgLoaded[activeIdx] && (
                      <div
                        className="pc-modal-image-skel"
                        aria-hidden="true"
                      />
                    )}

                    <img
                      src={allImages[activeIdx] || allImages[0]}
                      alt={product?.title || "Product"}
                      className="pc-modal-image"
                      draggable="false"
                      style={{
                        opacity:
                          modalImgLoaded[activeIdx]
                            ? 1
                            : 0,
                        transition: "opacity .25s ease",
                      }}
                      onLoad={() =>
                        setModalImgLoaded((prev) => ({
                          ...prev,
                          [activeIdx]: true,
                        }))
                      }
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/600x600?text=No+Image";

                        setModalImgLoaded((prev) => ({
                          ...prev,
                          [activeIdx]: true,
                        }));
                      }}
                    />
                  </>
                ) : (
                  <div className="pc-modal-no-image">
                    <span>No Image</span>
                  </div>
                )}

                {/* IMAGE NAVIGATION */}
                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="pc-modal-nav pc-modal-nav-left"
                      onClick={(e) => {
                        e.stopPropagation();

                        setActiveIdx(
                          (current) =>
                            (current -
                              1 +
                              allImages.length) %
                            allImages.length
                        );
                      }}
                      aria-label="Previous product image"
                    >
                      <FaChevronLeft size={13} />
                    </button>

                    <button
                      type="button"
                      className="pc-modal-nav pc-modal-nav-right"
                      onClick={(e) => {
                        e.stopPropagation();

                        setActiveIdx(
                          (current) =>
                            (current + 1) %
                            allImages.length
                        );
                      }}
                      aria-label="Next product image"
                    >
                      <FaChevronRight size={13} />
                    </button>
                  </>
                )}

                {/* IMAGE COUNTER */}
                {allImages.length > 1 && (
                  <div className="pc-modal-image-counter">
                    <span>{activeIdx + 1}</span>
                    <i>/</i>
                    <span>{allImages.length}</span>
                  </div>
                )}

                {/* THUMBNAILS */}
                {allImages.length > 1 && (
                  <div
                    className="pc-modal-thumbs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allImages.map((src, i) => (
                      <button
                        key={`${src}-modal-${i}`}
                        type="button"
                        className={`pc-modal-thumb ${
                          i === activeIdx
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setActiveIdx(i)
                        }
                        aria-label={`Show product image ${
                          i + 1
                        }`}
                      >
                        <img
                          src={src}
                          alt=""
                          draggable="false"
                        />
                      </button>
                    ))}
                  </div>
                )}

              </div>

              {/* =================================================
                  PRODUCT INFORMATION
              ================================================== */}
              <div className="pc-modal-content">

                <div className="pc-modal-topline">

                  <span className="pc-modal-featured">
                    <span className="pc-modal-featured-dot" />
                    Featured
                  </span>

                  {ratingValue > 0 && (
                    <span className="pc-modal-rating">
                      <span className="pc-modal-star">
                        ★
                      </span>
                      {Number(ratingValue).toFixed(1)}
                    </span>
                  )}

                </div>

                <h2 className="pc-modal-title">
                  {product?.title}
                </h2>

                {brandName && (
                  <p className="pc-modal-brand">
                    by <strong>{brandName}</strong>
                  </p>
                )}

                <div className="pc-modal-price">
                  <span className="pc-modal-price-symbol">
                    ₹
                  </span>

                  <span>
                    {displayPrice.toLocaleString("en-IN")}
                  </span>
                </div>

                {product?.description && (
                  <div className="pc-modal-description-box">
                    <p className="pc-modal-description">
                      {product.description}
                    </p>
                  </div>
                )}

                <div className="pc-modal-info-row">

                  <div className="pc-modal-info-item">
                    <span className="pc-modal-info-icon">
                      ✓
                    </span>
                    <span>Secure checkout</span>
                  </div>

                  <div className="pc-modal-info-item">
                    <span className="pc-modal-info-icon">
                      ↻
                    </span>
                    <span>Easy shopping</span>
                  </div>

                </div>

               <button
  type="button"
  onClick={handleAddToCart}
  className={`group relative flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-5 text-[14px] font-semibold tracking-[-0.01em] transition-all duration-300
    focus:outline-none focus:ring-4
    ${
      isInCart
        ? "bg-emerald-600 text-white shadow-[0_8px_24px_rgba(16,185,129,0.22)] hover:bg-emerald-700 focus:ring-emerald-100"
        : "bg-slate-900 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] hover:bg-blue-600 hover:shadow-[0_10px_28px_rgba(37,99,235,0.25)] focus:ring-blue-100"
    }
  `}
>
  {/* Animated shine */}
  <span
    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100"
    aria-hidden="true"
  />

  {/* Icon */}
  <span
    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300
      ${
        isInCart
          ? "bg-white/15 group-hover:scale-105"
          : "bg-white/10 group-hover:bg-white/15 group-hover:scale-105"
      }
    `}
  >
    <IoCartOutline
      size={19}
      className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110"
    />
  </span>

  {/* Text */}
  <span className="relative z-10 whitespace-nowrap">
    {isInCart ? "Go to Cart" : "Add to Cart"}
  </span>

  {/* Arrow */}
  <span
    className="relative z-10 ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[17px] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white/15"
  >
    →
  </span>
</button>

              </div>

            </div>
          </div>
        </div>
      )}


    </>
  );
}
