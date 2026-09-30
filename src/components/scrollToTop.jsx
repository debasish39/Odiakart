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

      if (scrollingUp && currentScrollY > 140) {
        setShowButton(true);
      }

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

        top-148
        sm:top-148
        max-sm:bottom-[calc(68px+env(safe-area-inset-bottom))]

        flex
        items-center
        gap-1.5

        h-10
        pl-1
        pr-2.5

        rounded-full

        border
        border-indigo-50
        cursor-pointer
        bg-white/60
        backdrop-blur-xl
        backdrop-saturate-150

        shadow-[0_8px_28px_rgba(30,41,59,0.14)]

        ring-1
        ring-indigo-500/[0.06]

        text-[11px]
        font-semibold
        text-slate-700

        overflow-hidden
        isolate
        select-none

        transition-all
        duration-400
        ease-[cubic-bezier(0.22,1,0.36,1)]

        hover:border-indigo-200/80
        hover:bg-white/90
        hover:text-indigo-700
        hover:shadow-[0_12px_35px_rgba(79,70,229,0.20)]

        active:scale-[0.92]

        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-indigo-500/40

        ${
          showButton
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-4 scale-90 opacity-0"
        }
      `}
    >
      {/* Ambient glow */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -inset-3
          -z-20
          rounded-full

          bg-gradient-to-r
          from-blue-500/15
          via-indigo-500/20
          to-purple-500/15

          blur-xl
        "
      />

      {/* Glass surface */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          rounded-full

          bg-gradient-to-br
          from-white/90
          via-white/60
          to-indigo-50/60
        "
      />

      {/* Small gradient icon */}
      <span
        className="
          relative
          flex
          h-7
          w-7
          shrink-0
          items-center
          justify-center

          overflow-hidden
          rounded-full

          bg-gradient-to-br
          from-blue-600
          via-indigo-600
          to-purple-600

          text-white

          shadow-[0_4px_14px_rgba(79,70,229,0.30)]

          ring-1
          ring-white/50

          transition-all
          duration-300

          group-hover:scale-105
          group-hover:shadow-[0_6px_18px_rgba(79,70,229,0.40)]
        "
      >
        <ArrowUp
          size={14}
          strokeWidth={2.8}
          className="
            relative
            z-10
            transition-transform
            duration-300
          "
        />
      </span>

      {/* Label */}
      <span
        className="
          relative
          z-10
          whitespace-nowrap

          bg-gradient-to-r
          from-blue-600
          via-indigo-600
          to-purple-600

          bg-clip-text
          text-transparent

          font-bold
        "
      >
        Back to top
      </span>

      {/* Bottom indicator */}
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
          from-blue-500
          via-indigo-500
          to-purple-500

          transition-all
          duration-300

          group-hover:w-6
        "
      />
    </button>
  );
}