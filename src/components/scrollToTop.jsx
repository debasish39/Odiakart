import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [showButton, setShowButton] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const documentHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      const progress =
        documentHeight > 0
          ? Math.min((scrollTop / documentHeight) * 100, 100)
          : 0;

      setShowButton(scrollTop > 400);
      setScrollProgress(progress);
    };

    handleScroll();

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
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Scroll to top"
      title="Back to top"
      className={`
        fixed
        right-3
        bottom-12
        z-[999]

        flex
        h-11
        w-11
        -translate-y-1/2
        items-center
        justify-center

        rounded-full

        border
        border-white/70

        bg-white/85

        text-slate-700

        shadow-[0_8px_30px_rgba(15,23,42,0.14)]

        backdrop-blur-xl
        backdrop-saturate-150

        transition-all
        duration-500
        ease-[cubic-bezier(0.22,1,0.36,1)]

        hover:scale-110
        hover:border-indigo-200
        hover:bg-white
        hover:text-indigo-600
        hover:shadow-[0_12px_35px_rgba(79,70,229,0.20)]

        active:scale-95

        focus:outline-none
        focus-visible:ring-2
        focus-visible:ring-indigo-500
        focus-visible:ring-offset-2

        sm:right-5
        sm:h-12
        sm:w-12

        ${
          showButton
            ? "translate-y-[-50%] opacity-100"
            : "pointer-events-none translate-y-[10%] opacity-0"
        }
      `}
    >
      {/* Progress Ring */}
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        {/* Background Ring */}
        <circle
          cx="24"
          cy="24"
          r="21"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-slate-200/70"
        />

        {/* Progress */}
        <circle
          cx="24"
          cy="24"
          r="21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 21}
          strokeDashoffset={
            2 * Math.PI * 21 -
            (scrollProgress / 100) * (2 * Math.PI * 21)
          }
          className="
            text-indigo-500
            transition-[stroke-dashoffset]
            duration-150
          "
        />
      </svg>

      {/* Inner Button */}
      <span
        className="
          relative
          z-10
          flex
          h-7
          w-7
          items-center
          justify-center

          rounded-full

          bg-gradient-to-br
          from-slate-50
          to-white

          shadow-[inset_0_1px_2px_rgba(255,255,255,0.9)]

          transition-all
          duration-300

          group-hover:from-indigo-50
          group-hover:to-white
        "
      >
        <ArrowUp
          size={17}
          strokeWidth={2.6}
          className="
            transition-transform
            duration-300
            ease-out

            group-hover:-translate-y-0.5
          "
        />
      </span>

      {/* Glow */}
      <span
        className="
          pointer-events-none
          absolute
          inset-0
          rounded-full

          bg-indigo-400/10

          opacity-0
          blur-md

          transition-opacity
          duration-300

          hover:opacity-100
        "
      />
    </button>
  );
}