import React, { useEffect, useRef, useState } from "react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef(0);
  const pulling = useRef(false);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  useEffect(() => {
    const handleTouchStart = (e) => {
      // Only activate when page is at the very top
      if (window.scrollY !== 0) return;

      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const handleTouchMove = (e) => {
      if (!pulling.current || refreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      // Only allow pulling downward
      if (distance <= 0) {
        setPullDistance(0);
        return;
      }

      // Prevent browser's default pull-to-refresh
      if (distance > 10) {
        e.preventDefault();
      }

      // Add resistance
      const resistedDistance = Math.min(distance * 0.5, MAX_PULL);

      setPullDistance(resistedDistance);
    };

    const handleTouchEnd = async () => {
      if (!pulling.current) return;

      pulling.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setRefreshing(true);
        setPullDistance(PULL_THRESHOLD);

        try {
          await onRefresh?.();
        } catch (error) {
          console.error("Refresh failed:", error);
        } finally {
          setRefreshing(false);
          setPullDistance(0);
        }
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    document.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });

    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullDistance, refreshing, onRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div className="relative">
      {/* Pull indicator */}
      <div
        className="flex justify-center overflow-hidden transition-all duration-200"
        style={{
          height: `${pullDistance}px`,
        }}
      >
        <div className="flex items-end pb-3">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md ${
              refreshing ? "animate-spin" : ""
            }`}
          >
            {refreshing ? (
              <span className="text-lg">⟳</span>
            ) : (
              <span
                className="text-lg transition-transform"
                style={{
                  transform: `rotate(${progress * 180}deg)`,
                }}
              >
                ↓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Page */}
      <div>{children}</div>
    </div>
  );
}