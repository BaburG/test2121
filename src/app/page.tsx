"use client";

import { useEffect, useRef } from "react";

const syneFont = { fontFamily: "var(--font-syne)" } as const;

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
      {/* Fluid gradient blob */}
      <div
        ref={blobRef}
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[68vmin] w-[68vmin] will-change-transform"
        style={{
          transform: "translate3d(-50%, -50%, 0) scale(1.2)",
          filter: "blur(44px)",
        }}
      >
        <div
          className="blob-shape absolute inset-0 overflow-hidden"
          style={{
            animation: "blob-morph 14s ease-in-out infinite",
            background:
              "radial-gradient(closest-side at 46% 42%, #4f46e5 0%, #3b2d84 44%, #17132e 72%, rgba(10,8,20,0) 100%)",
          }}
        >
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl 22s linear infinite",
              mixBlendMode: "screen",
              background:
                "radial-gradient(38% 38% at 34% 36%, rgba(99,102,241,0.95) 0%, rgba(99,102,241,0) 70%)",
            }}
          />
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl-reverse 30s linear infinite",
              mixBlendMode: "multiply",
              background:
                "radial-gradient(42% 42% at 66% 68%, rgba(12,10,24,0.98) 0%, rgba(12,10,24,0) 72%), radial-gradient(30% 30% at 60% 30%, rgba(59,45,132,0.9) 0%, rgba(59,45,132,0) 70%)",
            }}
          />
        </div>
      </div>

      {/* Granular / dithered noise overlay (SVG feTurbulence + feColorMatrix) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-[0.22] mix-blend-multiply"
      >
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves={2}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Hero typography */}
      <h1
        className="pointer-events-none absolute bottom-[5vh] left-[4vw] z-30 select-none leading-[0.8] text-white"
        style={{
          ...syneFont,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          fontSize: "clamp(4.5rem, 20vw, 19rem)",
        }}
      >
        ACME
      </h1>

      <h2
        className="pointer-events-none absolute right-[4vw] top-1/2 z-20 -translate-y-1/2 select-none leading-[0.8] text-black"
        style={{
          ...syneFont,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          fontSize: "clamp(3rem, 13vw, 12rem)",
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
          className="text-xl font-bold tracking-tight text-black"
          style={syneFont}
        >
          ACME
        </span>
      </header>
    </section>
  );
}
