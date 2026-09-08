"use client";

import { useEffect, useRef } from "react";

const heroFont = { fontFamily: "var(--font-inter)" } as const;

export default function Home() {
  const blobRef = useRef<HTMLDivElement>(null);

  // Normalized horizontal mouse position (0 = far left, 1 = far right).
  const targetX = useRef(0.5);
  const currentX = useRef(0.5);

  // Lagging displacement (in px, relative to viewport center) toward the cursor.
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const setFromPoint = (clientX: number, clientY: number) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      targetX.current = Math.min(1, Math.max(0, clientX / w));
      targetOffset.current = {
        x: clientX - w / 2,
        y: clientY - h / 2,
      };
    };

    const onMouseMove = (e: MouseEvent) => setFromPoint(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setFromPoint(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    let raf = 0;
    const tick = () => {
      // Viscous damping via lerp — the position eases toward the target,
      // and the displacement eases more slowly to create a trailing "lag".
      currentX.current += (targetX.current - currentX.current) * 0.09;
      currentOffset.current.x +=
        (targetOffset.current.x - currentOffset.current.x) * 0.05;
      currentOffset.current.y +=
        (targetOffset.current.y - currentOffset.current.y) * 0.05;

      const nx = currentX.current;
      // Left (nx→0): bulge/expand ~1.75. Right (nx→1): contract/densify ~0.6.
      const scale = 1.75 - 1.15 * nx;
      // Subtle lagging drift toward the cursor.
      const dx = currentOffset.current.x * 0.05;
      const dy = currentOffset.current.y * 0.05;

      const el = blobRef.current;
      if (el) {
        el.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0) scale(${scale})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-white">
      {/* Fluid gradient blob — sits toward the left and bleeds off-screen. */}
      <div
        ref={blobRef}
        className="pointer-events-none absolute left-[30%] top-1/2 z-0 h-[80vmin] w-[80vmin] will-change-transform"
        style={{
          transform: "translate3d(-50%, -50%, 0) scale(1.2)",
          filter: "blur(40px)",
        }}
      >
        <div
          className="blob-shape absolute inset-0 overflow-hidden"
          style={{
            animation: "blob-morph 14s ease-in-out infinite",
            background:
              "radial-gradient(closest-side at 46% 42%, #635bff 0%, #4f46e5 30%, #3b2d84 52%, #17132e 74%, rgba(10,8,20,0) 100%)",
          }}
        >
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl 22s linear infinite",
              mixBlendMode: "screen",
              background:
                "radial-gradient(36% 36% at 32% 30%, rgba(196,181,253,0.9) 0%, rgba(196,181,253,0) 68%), radial-gradient(34% 34% at 40% 40%, rgba(99,102,241,0.95) 0%, rgba(99,102,241,0) 70%)",
            }}
          />
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl-reverse 30s linear infinite",
              mixBlendMode: "multiply",
              background:
                "radial-gradient(44% 44% at 64% 70%, rgba(9,7,20,0.98) 0%, rgba(9,7,20,0) 72%), radial-gradient(30% 30% at 58% 32%, rgba(59,45,132,0.9) 0%, rgba(59,45,132,0) 70%)",
            }}
          />
        </div>
      </div>

      {/* Granular / dithered noise overlay (SVG feTurbulence + feColorMatrix). */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-[0.55] mix-blend-overlay"
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves={3}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Hero typography */}
      <h1
        className="pointer-events-none absolute bottom-[24vh] left-[1vw] z-30 select-none leading-[0.78] text-white"
        style={{
          ...heroFont,
          fontWeight: 800,
          letterSpacing: "-0.045em",
          fontSize: "clamp(4rem, 16vw, 15rem)",
        }}
      >
        ACME
      </h1>

      <h2
        className="pointer-events-none absolute right-[-1vw] top-[42%] z-20 -translate-y-1/2 select-none whitespace-nowrap italic leading-[0.78] text-black"
        style={{
          ...heroFont,
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "-0.045em",
          fontSize: "clamp(3.5rem, 15vw, 14rem)",
          transform: "translateY(-50%) skewX(-6deg)",
        }}
      >
        ACME
      </h2>

      {/* Header bar */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10">
        <button
          type="button"
          aria-label="Open menu"
          className="group flex flex-col gap-[6px] p-1"
        >
          <span className="block h-[2px] w-7 bg-black transition-all group-hover:w-8" />
          <span className="block h-[2px] w-7 bg-black transition-all group-hover:w-5" />
          <span className="block h-[2px] w-7 bg-black transition-all group-hover:w-8" />
        </button>
        <span
          className="text-2xl font-black tracking-tight text-black"
          style={heroFont}
        >
          ACME
        </span>
      </header>
    </section>
  );
}
