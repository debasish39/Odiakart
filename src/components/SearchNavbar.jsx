import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaSearch,
} from "react-icons/fa";
import {
  ShoppingCart,
} from "lucide-react";
import {
  useNavigate,
} from "react-router-dom";
const OdikartLogo = "/logo.png";
import { useCart } from "../context/CartContext";

export default function SearchNavbar() {
  const navigate = useNavigate();

  const { cartCount = 0 } = useCart();

  // ============================================================
  // STATES
  // ============================================================

  const [showNavbar, setShowNavbar] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // ============================================================
  // NAVBAR SCROLL BEHAVIOR + PROGRESS
  // ============================================================

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        // --------------------------------------------------------
        // SCROLL PROGRESS
        // --------------------------------------------------------

        const documentHeight =
          document.documentElement.scrollHeight -
          window.innerHeight;

        const progress =
          documentHeight > 0
            ? Math.min(
                (currentScrollY / documentHeight) * 100,
                100
              )
            : 0;

        setScrollProgress(progress);

        // --------------------------------------------------------
        // ALWAYS SHOW NAVBAR AT TOP
        // --------------------------------------------------------

        if (currentScrollY <= 10) {
          setShowNavbar(true);

          lastScrollY = currentScrollY;
          ticking = false;

          return;
        }

        // --------------------------------------------------------
        // SCROLLING DOWN
        // --------------------------------------------------------

        if (
          currentScrollY > lastScrollY &&
          currentScrollY > 80
        ) {
          setShowNavbar(false);
        }

        // --------------------------------------------------------
        // SCROLLING UP
        // --------------------------------------------------------

        if (currentScrollY < lastScrollY) {
          setShowNavbar(true);
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  // ============================================================
  // BACK
  // ============================================================

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // ============================================================
  // OPEN SEARCH PAGE
  // ============================================================

  const openSearch = () => {
    navigate("/search");
  };

  // ============================================================
  // CART
  // ============================================================

  const openCart = () => {
    navigate("/cart");
  };

  return (
    <header
      className={`
        fixed
        left-0
        right-0
        top-0
        z-[999]

        transition-all
        duration-500
        ease-[cubic-bezier(0.22,1,0.36,1)]

        ${
          showNavbar
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }
      `}
    >
      
      <style>{`
        @keyframes searchNavShine {
          0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
          15% { opacity: .9; }
          55% { opacity: .9; }
          100% { transform: translateX(420%) skewX(-18deg); opacity: 0; }
        }

        @keyframes searchNavPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(99,102,241,.18); }
          50% { transform: scale(1.06); box-shadow: 0 0 0 7px rgba(99,102,241,0); }
        }

        @keyframes searchNavProgress {
          0% { opacity: .65; }
          50% { opacity: 1; }
          100% { opacity: .65; }
        }

        .search-nav-shell {
          isolation: isolate;
        }

        .search-nav-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background:
            radial-gradient(circle at 15% 0%, rgba(255,255,255,.95), transparent 28%),
            linear-gradient(135deg, rgba(255,255,255,.52), transparent 45%, rgba(99,102,241,.035));
        }

        .search-nav-shine {
          position: absolute;
          top: -20%;
          bottom: -20%;
          left: -35%;
          width: 18%;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.85),
            transparent
          );
          filter: blur(1px);
          transform: skewX(-18deg);
          animation: searchNavShine 5.5s ease-in-out infinite;
        }

        .search-nav-icon-button {
          position: relative;
          overflow: hidden;
          isolation: isolate;
        }

        .search-nav-icon-button::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(
            120deg,
            transparent 25%,
            rgba(255,255,255,.72) 50%,
            transparent 75%
          );
          transform: translateX(-130%) skewX(-18deg);
          transition: transform .65s ease;
        }

        .search-nav-icon-button:hover::after {
          transform: translateX(130%) skewX(-18deg);
        }

        .search-nav-cart-badge {
          animation: searchNavPulse 2.6s ease-in-out infinite;
        }

        .search-nav-progress {
          animation: searchNavProgress 2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .search-nav-shine,
          .search-nav-cart-badge,
          .search-nav-progress {
            animation: none !important;
          }

          .search-nav-icon-button::after {
            transition: none !important;
          }
        }
      `}</style>

      {/* ========================================================
          OUTER SPACING
      ======================================================== */}

      <div className="px-2 pt-2 sm:px-4 sm:pt-3 lg:px-6">
        {/* ======================================================
            MODERN GLASS NAVBAR
        ====================================================== */}

        <div
          className="
            relative

            mx-auto
            flex

            h-[58px]
            max-w-7xl

            items-center
            justify-between

            rounded-[20px]

            border
            border-white/70

            bg-white/88

            px-2.5
            sm:px-3

            shadow-[0_10px_34px_rgba(15,23,42,0.09)]

            backdrop-blur-2xl
            backdrop-saturate-150

            sm:h-[66px]
            sm:px-3

            lg:px-4
          "
        >
          {/* ====================================================
              SCROLL PROGRESS
          ==================================================== */}

          <div
            className="
              pointer-events-none

              absolute
              left-4
              right-4
              top-0

              h-[2px]

              overflow-hidden

              rounded-full

              bg-slate-100/80
              shadow-inner
            "
          >
            <div
              className="
                h-full

                rounded-full

                bg-gradient-to-r
                from-indigo-500
                via-violet-500
                to-purple-500

                search-nav-progress
                transition-[width]
                duration-150
              "
              style={{
                width: `${scrollProgress}%`,
              }}
            />
          </div>

          {/* ====================================================
              LEFT SIDE
          ==================================================== */}

          <div className="flex items-center">
            {/* ==================================================
                BACK BUTTON
            ================================================== */}

            <button
              type="button"
              onClick={goBack}
              aria-label="Go back"
              title="Go back"
              className="
                search-nav-icon-button
                group

                relative

                flex
                h-10
                w-10

                items-center
                justify-center

                overflow-hidden

                rounded-xl

                border
                border-transparent

                text-slate-600

                transition-all
                duration-300

                hover:border-slate-200
                hover:bg-slate-100
                hover:text-indigo-600

                active:scale-90

                focus:outline-none
                focus-visible:ring-2
                focus-visible:ring-indigo-500
                focus-visible:ring-offset-2

                sm:h-11
                sm:w-11
              "
            >
              {/* Hover shine */}

              <span
                className="
                  pointer-events-none

                  absolute
                  inset-0

                  -translate-x-full

                  bg-gradient-to-r
                  from-transparent
                  via-white/80
                  to-transparent

                  transition-transform
                  duration-500

                  group-hover:translate-x-full
                "
              />

              <FaArrowLeft
                size={14}
                className="
                  relative
                  z-10

                  transition-all
                  duration-300
                  ease-out

                  group-hover:-translate-x-1
                "
              />
            </button>
          </div>

          {/* ====================================================
              CENTER — ODikart BRAND
          ==================================================== */}

          <button
            type="button"
            onClick={() => navigate("/")}
            aria-label="Go to Odikart home"
            title="Odikart"
            className="
              group/brand
              absolute
              left-1/2
              top-1/2
              flex
              -translate-x-1/2
              -translate-y-1/2
              items-center
              justify-center
              rounded-2xl
              px-2
              py-1
              outline-none
              transition-all
              duration-300
              hover:scale-[1.035]
              focus-visible:ring-2
              focus-visible:ring-indigo-500
              focus-visible:ring-offset-2
              sm:px-3
            "
          >
            <span
              className="
                pointer-events-none
                absolute
                -inset-2
                rounded-3xl
                bg-gradient-to-r
                from-indigo-500/10
                via-violet-500/10
                to-purple-500/10
                opacity-0
                blur-xl
                transition-opacity
                duration-500
                group-hover/brand:opacity-100
              "
            />

            <span
              className="
                pointer-events-none
                absolute
                inset-0
                overflow-hidden
                rounded-2xl
              "
            >
              <span
                className="
                  absolute
                  inset-y-0
                  -left-1/2
                  w-1/3
                  -skew-x-12
                  bg-gradient-to-r
                  from-transparent
                  via-white/90
                  to-transparent
                  opacity-0
                  transition-all
                  duration-700
                  group-hover/brand:left-[120%]
                  group-hover/brand:opacity-100
                "
              />
            </span>

            <span
              className="
                relative
                z-10
                flex
                items-center
                justify-center
                rounded-xl
                bg-white/40
                px-1.5
                py-0.5
                backdrop-blur-sm
                transition-all
                duration-300
                group-hover/brand:bg-white/70
              "
            >
              <img
                src={OdikartLogo}
                alt="Odikart"
                className="
                  block
                  h-8
                  w-auto
                  max-w-[300px]
                  object-contain
                  object-center
                  drop-shadow-[0_4px_10px_rgba(15,23,42,.12)]
                  transition-transform
                  duration-300
                  group-hover/brand:scale-[1.04]
                  sm:h-9
                  sm:max-w-[150px]
                  max-[380px]:max-w-[100px]
                "
              />
            </span>
          </button>

          {/* ====================================================
              RIGHT SIDE
          ==================================================== */}

         {/* ====================================================
    RIGHT SIDE
==================================================== */}

<div className="flex items-center gap-1 sm:gap-2">

  {/* ==================================================
      SEARCH BUTTON
  ================================================== */}

  <button
    type="button"
    onClick={openSearch}
    aria-label="Search products"
    title="Search products"
    className="
      search-nav-icon-button
      group

      relative

      flex
      h-10
      w-10
      shrink-0

      items-center
      justify-center

      overflow-hidden

      text-slate-600

      rounded-xl

      transition-all
      duration-300

      border border-transparent
      hover:border-indigo-100
      hover:bg-gradient-to-br hover:from-indigo-50 hover:to-violet-50
      hover:text-indigo-600

      hover:shadow-[0_6px_20px_rgba(79,70,229,0.12)]

      active:scale-90

      
      focus-visible:ring-indigo-500
      focus-visible:ring-offset-2

      sm:h-11
      sm:w-11
    "
  >
    {/* Search glow */}

    <span
      className="
        pointer-events-none

        absolute
        inset-1

        rounded-lg
bg-indigo-500/10

        opacity-0
        blur-md

        transition-opacity
        duration-300

        group-hover:opacity-100
      "
    />

    {/* Search icon */}

    <FaSearch
      size={18}
      className="
        relative
        z-10

        transition-all
        duration-300

        group-hover:scale-110
        group-hover:-rotate-3
      "
    />
  </button>


  {/* ==================================================
      CART BUTTON
  ================================================== */}

  <button
    type="button"
    onClick={openCart}
    aria-label={`Shopping cart${
      Number(cartCount) > 0
        ? `, ${cartCount} items`
        : ""
    }`}
    title="Shopping cart"
    className="
      group

      relative

      flex
      h-10
      w-10
      shrink-0

      items-center
      justify-center

      rounded-xl

      border
      border-transparent

      text-slate-700

      transition-all
      duration-300

      hover:border-indigo-100
      hover:bg-indigo-50
      hover:text-indigo-600

      active:scale-90

      focus:outline-none
      focus-visible:ring-2
      focus-visible:ring-indigo-500
      focus-visible:ring-offset-2

      sm:h-11
      sm:w-11
    "
  >
    {/* Cart glow */}

    <span
      className="
        pointer-events-none

        absolute
        inset-1

        rounded-lg

        bg-indigo-500/10

        opacity-0
        blur-md

        transition-opacity
        duration-300

        group-hover:opacity-100
      "
    />

    {/* Cart */}

    <ShoppingCart
      size={21}
      strokeWidth={2.1}
      className="
        relative
        z-10

        transition-all
        duration-300

        group-hover:-translate-y-0.5
        group-hover:scale-110
      "
    />

    {/* Cart count */}

    {Number(cartCount) > 0 && (
      <span
        className="
          absolute
          
          -right-0.5
          -top-0.5

          z-20

          flex
          h-[19px]
          min-w-[19px]

          items-center
          justify-center

          rounded-full

          border-2
          border-white

          bg-gradient-to-br
          from-indigo-500
          to-violet-600

          px-1

          text-[8px]
          font-extrabold
          leading-none
          text-white

          shadow-[0_3px_10px_rgba(79,70,229,0.30)]

          transition-transform
          duration-300

          group-hover:scale-110

          sm:h-5
          sm:min-w-5
          sm:text-[9px]
        "
      >
        {Number(cartCount) > 99
          ? "99+"
          : cartCount}
      </span>
    )}
  </button>

</div>
        </div>
      </div>
    </header>
  );
}