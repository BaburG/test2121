"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

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
  const whiteRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
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

      // Transformation: broaden/bulge toward the left, condense toward the right.
      const scale = 1.5 - 0.62 * nx;
      const dx = ox * 0.04;
      const dy = oy * 0.04;
      if (blobRef.current) {
        blobRef.current.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0) scale(${scale})`;
      }

      // Fisheye/lens intensity grows as the cursor moves left (blob bulges more).
      if (fisheyeRef.current) {
        const warp = 30 + (1 - nx) * 48;
        fisheyeRef.current.setAttribute("scale", warp.toFixed(2));
      }

      // The wordmarks ride a subtle fluid layer that drifts a little with the mouse
      // (opposite directions for a gentle parallax depth).
      if (whiteRef.current) {
        whiteRef.current.style.transform = `translate3d(${(-ox * 0.035).toFixed(
          2,
        )}px, ${(-oy * 0.035).toFixed(2)}px, 0)`;
      }
      if (blackRef.current) {
        blackRef.current.style.transform = `translate(${(ox * 0.045).toFixed(
          2,
        )}px, calc(-50% + ${(oy * 0.045).toFixed(2)}px))`;
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
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
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
              scale="50"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves={3}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.8" intercept="-0.4" />
              <feFuncG type="linear" slope="1.8" intercept="-0.4" />
              <feFuncB type="linear" slope="1.8" intercept="-0.4" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>

      {/* Fluid atmospheric mesh — a violet/blue bloom over the upper-left that
          dissolves into white toward the top and center-right, with a charcoal
          shadow tucked along its lower edge. */}
      <div
        ref={blobRef}
        className="pointer-events-none absolute left-[26%] top-[48%] z-0 h-[92vmin] w-[92vmin] will-change-transform"
        style={{
          transform: "translate3d(-50%, -50%, 0) scale(1.2)",
          filter: "url(#fisheye) blur(52px)",
        }}
      >
        <div
          className="blob-shape absolute inset-0 overflow-hidden"
          style={{
            animation: "blob-morph 46s ease-in-out infinite",
            background:
              "radial-gradient(34% 30% at 30% 30%, #635bff 0%, rgba(99,91,255,0) 60%)," +
              "radial-gradient(52% 50% at 34% 40%, #4f46e5 0%, rgba(79,70,229,0) 66%)," +
              "radial-gradient(62% 58% at 40% 52%, #3b2d84 0%, rgba(59,45,132,0) 70%)," +
              "radial-gradient(66% 42% at 45% 78%, rgba(8,7,18,0.96) 0%, rgba(8,7,18,0) 60%)",
          }}
        >
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl 80s linear infinite",
              mixBlendMode: "screen",
              background:
                "radial-gradient(30% 30% at 30% 28%, rgba(196,181,253,0.7) 0%, rgba(196,181,253,0) 64%)",
            }}
          />
        </div>
      </div>

      {/* Subtle dithered noise, tightly bound to the color gradients (overlay
          keeps the pure-white canvas and the crisp logos clean). */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-[0.45] mix-blend-overlay"
      >
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {/* Lower-left hero: 4Muse (white), riding a subtle parallax layer. */}
      <div
        ref={whiteRef}
        className="pointer-events-none absolute bottom-[22vh] left-[2vw] z-30 will-change-transform"
      >
        <Image
          src="/Logo/4muse-white.webp"
          alt="4Muse"
          width={865}
          height={150}
          priority
          draggable={false}
          style={{ height: "clamp(2.6rem, 9vw, 8rem)", width: "auto" }}
        />
      </div>

      {/* Center-right hero: 4Minds (black), vertically centered and bleeding off
          the right edge. */}
      <div
        ref={blackRef}
        className="pointer-events-none absolute right-[-4vw] top-1/2 z-20 will-change-transform"
        style={{ transform: "translateY(-50%)" }}
      >
        <Image
          src="/Logo/4minds-black.webp"
          alt="4Minds"
          width={4588}
          height={810}
          priority
          draggable={false}
          style={{ height: "clamp(3.5rem, 12vw, 10rem)", width: "auto" }}
        />
      </div>

      {/* Header bar */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-start justify-between px-8 pt-8 sm:px-12 sm:pt-10">
        <button
          type="button"
          aria-label="Open menu"
          className="group flex flex-col gap-[6px] p-1"
        >
          <span className="block h-[2px] w-7 bg-black transition-all group-hover:w-8" />
          <span className="block h-[2px] w-7 bg-black transition-all group-hover:w-5" />
          <span className="block h-[2px] w-7 bg-black transition-all group-hover:w-8" />
        </button>
        <Image
          src="/Logo/4m-black.webp"
          alt="4M"
          width={380}
          height={150}
          priority
          draggable={false}
          style={{ height: "clamp(1.5rem, 2.4vw, 2.1rem)", width: "auto" }}
        />
      </header>
    </section>
  );
}
