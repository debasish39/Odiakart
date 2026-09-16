import React from "react";

export default function PageSkeleton() {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-white">
      {/* Navbar */}
      <div className="h-14 w-full border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
          <div className="skeleton-shimmer h-7 w-28 rounded-lg" />
          <div className="flex gap-3">
            <div className="skeleton-shimmer h-8 w-8 rounded-full" />
            <div className="skeleton-shimmer h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Category */}
      <section className="mx-auto max-w-7xl px-4 py-5">
        <div className="skeleton-shimmer mb-4 h-6 w-32 rounded-lg" />

        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="flex min-w-[76px] flex-col items-center gap-2"
            >
              <div className="skeleton-shimmer h-16 w-16 rounded-full" />
              <div className="skeleton-shimmer h-3 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="skeleton-shimmer h-[190px] w-full rounded-2xl sm:h-[280px]" />
      </section>

      {/* Product sections */}
      {[1, 2, 3].map((section) => (
        <section
          key={section}
          className="mx-auto max-w-7xl px-4 py-6"
        >
          <div className="mb-4">
            <div className="skeleton-shimmer h-6 w-40 rounded-lg" />
            <div className="skeleton-shimmer mt-2 h-3 w-64 rounded-full" />
          </div>

          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="
                  min-w-[165px]
                  overflow-hidden
                  rounded-[20px]
                  border border-gray-100
                  bg-white
                  shadow-sm
                  sm:min-w-[190px]
                "
              >
                <div className="skeleton-shimmer h-[165px] w-full sm:h-[190px]" />

                <div className="space-y-3 p-3">
                  <div className="skeleton-shimmer h-3 w-20 rounded-full" />

                  <div className="space-y-2">
                    <div className="skeleton-shimmer h-4 w-full rounded-full" />
                    <div className="skeleton-shimmer h-4 w-3/4 rounded-full" />
                  </div>

                  <div className="skeleton-shimmer h-3 w-24 rounded-full" />

                  <div className="flex items-center gap-2">
                    <div className="skeleton-shimmer h-5 w-16 rounded-md" />
                    <div className="skeleton-shimmer h-3 w-12 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <style>{`
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            110deg,
            #eef2f7 0%,
            #f8fafc 35%,
            #e8edff 50%,
            #f8fafc 65%,
            #eef2f7 100%
          );
          background-size: 250% 100%;
          animation: skeletonShimmer 1.8s linear infinite;
        }

        .skeleton-shimmer::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.55),
            transparent
          );
          transform: translateX(-100%);
          animation: skeletonGlow 2.2s ease-in-out infinite;
        }

        @keyframes skeletonShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -50% 0;
          }
        }

        @keyframes skeletonGlow {
          0% {
            transform: translateX(-100%);
          }
          50%,
          100% {
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer,
          .skeleton-shimmer::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}