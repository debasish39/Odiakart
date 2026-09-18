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

            h-[60px]
            max-w-7xl

            items-center
            justify-between

            rounded-2xl

            border
            border-white/70

            bg-white/85

            px-2.5

            shadow-[0_8px_30px_rgba(15,23,42,0.08)]

            backdrop-blur-2xl
            backdrop-saturate-150

            sm:h-[64px]
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

              bg-slate-100
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
              CENTER SEARCH BUTTON
          ==================================================== */}

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

      hover:border-indigo-200
      hover:bg-indigo-50
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