import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [showButton, setShowButton] = useState(false);

  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const getScrollY = () =>
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    lastScrollY.current = getScrollY();

    const updateScrollDirection = () => {
      const currentScrollY = getScrollY();
      const previousScrollY = lastScrollY.current;

      const scrollingUp = currentScrollY < previousScrollY;
      const scrollingDown = currentScrollY > previousScrollY;

      // Show only when user scrolls upward
      if (scrollingUp && currentScrollY > 140) {
        setShowButton(true);
      }

      // Hide while scrolling downward or near the top
      if (scrollingDown || currentScrollY <= 140) {
        setShowButton(false);
      }

      lastScrollY.current = currentScrollY;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    setShowButton(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      title="Back to top"
      className={`
        group
        fixed
        left-1/2
        z-[999999]
        -translate-x-1/2

        top-21
        sm:top-21
        max-sm:top-[calc(72px+env(safe-area-inset-top))]

        flex
        items-center
        gap-2

        h-12
        pl-1.5
        pr-4

        rounded-full

        border
        border-white/80

        bg-white/80
        backdrop-blur-2xl
        backdrop-saturate-150

        shadow-[0_10px_35px_rgba(15,23,42,0.16)]
        ring-1
        ring-black/[0.03]

        text-[13px]
        font-bold
        tracking-tight
        text-slate-700

        overflow-hidden
        isolate
        select-none

        transition-all
        duration-300
        ease-[cubic-bezier(0.22,1,0.36,1)]

        hover:border-indigo-200/80
        hover:bg-white/90
        hover:text-indigo-700
        hover:shadow-[0_14px_42px_rgba(79,70,229,0.20)]

        active:scale-[0.94]

        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-indigo-500/40
        focus-visible:ring-offset-2

        ${
          showButton
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-5 scale-90 opacity-0"
        }
      `}
    >
      {/* Ambient glow */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          rounded-full

          bg-gradient-to-r
          from-indigo-500/10
          via-purple-500/10
          to-blue-500/10

          blur-xl
        "
      />

      {/* Animated glass highlight */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-full

          bg-gradient-to-r
          from-transparent
          via-white/60
          to-transparent

          opacity-0
          transition-opacity
          duration-500

          group-hover:opacity-100
        "
      />

      {/* Icon container */}
      <span
        className="
          relative
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center

          overflow-hidden
          rounded-full

          bg-gradient-to-br
          from-indigo-600
          via-purple-600
          to-blue-600

          text-white

          shadow-[0_6px_18px_rgba(79,70,229,0.32)]

          ring-1
          ring-white/40

          transition-all
          duration-300
          ease-out

          group-hover:scale-105
          group-hover:shadow-[0_8px_22px_rgba(79,70,229,0.42)]
        "
      >
        {/* Icon glow */}
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0

            rounded-full

            bg-white/10

            opacity-0
            transition-opacity
            duration-300

            group-hover:opacity-100
          "
        />

        {/* Shine */}
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-10
            top-0

            h-full
            w-8

            rotate-[20deg]

            bg-gradient-to-r
            from-transparent
            via-white/60
            to-transparent

            opacity-0

            transition-all
            duration-700

            group-hover:left-[110%]
            group-hover:opacity-100
          "
        />

        <ArrowUp
          size={17}
          strokeWidth={2.8}
          className="
            relative
            z-10

            transition-transform
            duration-300

            group-hover:-translate-y-0.5
          "
        />
      </span>

      {/* Label */}
      <span
        className="
          relative
          z-10
          whitespace-nowrap

          transition-all
          duration-300

          group-hover:tracking-normal
        "
      >
        Back to top
      </span>

      {/* Tiny active indicator */}
      <span
        aria-hidden="true"
        className="
          absolute
          bottom-0
          left-1/2

          h-[2px]
          w-0
          -translate-x-1/2

          rounded-full

          bg-gradient-to-r
          from-indigo-500
          via-purple-500
          to-blue-500

          transition-all
          duration-300

          group-hover:w-8
        "
      />
    </button>
  );
}