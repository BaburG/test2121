"use client";

import { useEffect, useRef } from "react";

const heroFont = { fontFamily: "var(--font-inter)" } as const;

// Displacement map for the fisheye/lens warp: a full-frame normal map where the
// red channel encodes horizontal displacement and the green channel vertical, so
// feDisplacementMap bulges the blob outward from its center like a lens.
const fisheyeMap = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>
     <defs>
       <linearGradient id='fx' x1='0' y1='0' x2='1' y2='0'>
         <stop offset='0' stop-color='#f00'/>
         <stop offset='1' stop-color='#000'/>
       </linearGradient>
       <linearGradient id='fy' x1='0' y1='0' x2='0' y2='1'>
         <stop offset='0' stop-color='#0f0'/>
         <stop offset='1' stop-color='#000'/>
       </linearGradient>
     </defs>
     <rect width='320' height='320' fill='#000'/>
     <rect width='320' height='320' fill='url(#fx)'/>
     <rect width='320' height='320' fill='url(#fy)' style='mix-blend-mode:screen'/>
   </svg>`,
)}`;

export default function Home() {
  const blobRef = useRef<HTMLDivElement>(null);
  const whiteRef = useRef<HTMLHeadingElement>(null);
  const blackRef = useRef<HTMLHeadingElement>(null);
  const fisheyeRef = useRef<SVGFEDisplacementMapElement>(null);

  // Normalized horizontal mouse position (0 = far left, 1 = far right).
  const targetX = useRef(0.5);
  const currentX = useRef(0.5);

  // Lagging displacement (px, relative to viewport center) toward the cursor.
  const targetOffset = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const setFromPoint = (clientX: number, clientY: number) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      targetX.current = Math.min(1, Math.max(0, clientX / w));
      targetOffset.current = { x: clientX - w / 2, y: clientY - h / 2 };
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
      // Slow, viscous damping — the smaller the factor, the more subtle the drift.
      currentX.current += (targetX.current - currentX.current) * 0.035;
      currentOffset.current.x +=
        (targetOffset.current.x - currentOffset.current.x) * 0.028;
      currentOffset.current.y +=
        (targetOffset.current.y - currentOffset.current.y) * 0.028;

      const nx = currentX.current;
      const ox = currentOffset.current.x;
      const oy = currentOffset.current.y;

      // Transformation: expand/bulge toward the left, contract/densify to the right.
      // (Contraction is kept moderate so the pure-white type stays on the gradient.)
      const scale = 1.55 - 0.75 * nx;
      const dx = ox * 0.04;
      const dy = oy * 0.04;
      if (blobRef.current) {
        blobRef.current.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0) scale(${scale})`;
      }

      // Fisheye/lens intensity grows as the cursor moves left (blob bulges more).
      if (fisheyeRef.current) {
        const warp = 45 + (1 - nx) * 70;
        fisheyeRef.current.setAttribute("scale", warp.toFixed(2));
      }

      // The wordmarks ride a subtle fluid layer that drifts slightly with the mouse.
      if (whiteRef.current) {
        whiteRef.current.style.transform = `translate3d(${(-ox * 0.02).toFixed(
          2,
        )}px, ${(-oy * 0.02).toFixed(2)}px, 0)`;
      }
      if (blackRef.current) {
        blackRef.current.style.transform = `translate(${(-ox * 0.03).toFixed(
          2,
        )}px, calc(-50% + ${(-oy * 0.03).toFixed(2)}px)) skewX(-6deg)`;
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
      {/* Filter definitions (offscreen). */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0"
      >
        <defs>
          <filter
            id="fisheye"
            x="-15%"
            y="-15%"
            width="130%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={fisheyeMap}
              preserveAspectRatio="none"
              result="map"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            />
            <feDisplacementMap
              ref={fisheyeRef}
              in="SourceGraphic"
              in2="map"
              scale="70"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves={4}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="2.8" intercept="-0.9" />
              <feFuncG type="linear" slope="2.8" intercept="-0.9" />
              <feFuncB type="linear" slope="2.8" intercept="-0.9" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Fluid gradient blob — sits toward the left, warped by the fisheye lens. */}
      <div
        ref={blobRef}
        className="pointer-events-none absolute left-[18%] top-[58%] z-0 h-[86vmin] w-[86vmin] will-change-transform"
        style={{
          transform: "translate3d(-50%, -50%, 0) scale(1.2)",
          filter: "url(#fisheye) blur(22px)",
        }}
      >
        <div
          className="blob-shape absolute inset-0 overflow-hidden"
          style={{
            animation: "blob-morph 42s ease-in-out infinite",
            background:
              "radial-gradient(closest-side at 46% 42%, #635bff 0%, #4f46e5 30%, #3b2d84 52%, #17132e 74%, rgba(10,8,20,0) 100%)",
          }}
        >
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl 70s linear infinite",
              mixBlendMode: "screen",
              background:
                "radial-gradient(36% 36% at 32% 30%, rgba(196,181,253,0.9) 0%, rgba(196,181,253,0) 68%), radial-gradient(34% 34% at 40% 40%, rgba(99,102,241,0.95) 0%, rgba(99,102,241,0) 70%)",
            }}
          />
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl-reverse 90s linear infinite",
              mixBlendMode: "multiply",
              background:
                "radial-gradient(44% 44% at 64% 70%, rgba(9,7,20,0.98) 0%, rgba(9,7,20,0) 72%), radial-gradient(30% 30% at 58% 32%, rgba(59,45,132,0.9) 0%, rgba(59,45,132,0) 70%)",
            }}
          />
        </div>
      </div>

      {/* Hero typography (rides a subtle fluid parallax layer). */}
      <h1
        ref={whiteRef}
        className="pointer-events-none absolute bottom-[24vh] left-[2vw] z-30 select-none leading-[0.78] text-white will-change-transform"
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
        ref={blackRef}
        className="pointer-events-none absolute right-[-1vw] top-[42%] z-20 select-none whitespace-nowrap italic leading-[0.78] text-black will-change-transform"
        style={{
          ...heroFont,
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "-0.045em",
          fontSize: "clamp(3.5rem, 15vw, 14rem)",
          transform: "translate(0px, -50%) skewX(-6deg)",
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

      {/* Hard film-grain — a uniform noise layer on top of everything, so the
          texture also sits on the wordmarks and the white background. */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-50 h-full w-full opacity-[0.35]"
      >
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </section>
  );
}
