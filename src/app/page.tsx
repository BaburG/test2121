"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

// Displacement map for the organic lens / fisheye warp:
// Encodes spherical displacement so feDisplacementMap produces an organic, viscous lens bulge
const fisheyeMap = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>
     <defs>
       <radialGradient id='lens' cx='45%' cy='45%' r='50%'>
         <stop offset='0%' stop-color='#808080'/>
         <stop offset='60%' stop-color='#b55050'/>
         <stop offset='100%' stop-color='#808080'/>
       </radialGradient>
       <linearGradient id='fx' x1='0' y1='0' x2='1' y2='0'>
         <stop offset='0' stop-color='#f00'/>
         <stop offset='1' stop-color='#000'/>
       </linearGradient>
       <linearGradient id='fy' x1='0' y1='0' x2='0' y2='1'>
         <stop offset='0' stop-color='#0f0'/>
         <stop offset='1' stop-color='#000'/>
       </linearGradient>
     </defs>
     <rect width='320' height='320' fill='#808080'/>
     <circle cx='150' cy='150' r='140' fill='url(#lens)'/>
     <rect width='320' height='320' fill='url(#fx)' opacity='0.55' style='mix-blend-mode:overlay'/>
     <rect width='320' height='320' fill='url(#fy)' opacity='0.55' style='mix-blend-mode:screen'/>
   </svg>`,
)}`;

export default function Home() {
  const blobRef = useRef<HTMLDivElement>(null);
  const whiteRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const fisheyeRef = useRef<SVGFEDisplacementMapElement>(null);
  const textFisheyeRef = useRef<SVGFEDisplacementMapElement>(null);

  // Normalized horizontal mouse position (0 = far left, 1 = far right).
  const targetX = useRef(0.4);
  const currentX = useRef(0.4);

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
      // Viscous, organic damping (slow, continuous liquid response)
      currentX.current += (targetX.current - currentX.current) * 0.032;
      currentOffset.current.x +=
        (targetOffset.current.x - currentOffset.current.x) * 0.024;
      currentOffset.current.y +=
        (targetOffset.current.y - currentOffset.current.y) * 0.024;

      const nx = currentX.current;
      const ox = currentOffset.current.x;
      const oy = currentOffset.current.y;

      // Transformation: broaden/bulge toward left, condense toward right
      const scale = 1.35 - 0.45 * nx;
      const dx = ox * 0.038;
      const dy = oy * 0.038;
      if (blobRef.current) {
        blobRef.current.style.transform = `translate3d(calc(-50% + ${dx}px), calc(-50% + ${dy}px), 0) scale(${scale})`;
      }

      // Fisheye/lens warp intensity on the fluid body:
      if (fisheyeRef.current) {
        const warp = 35 + (1 - nx) * 45;
        fisheyeRef.current.setAttribute("scale", warp.toFixed(2));
      }

      // Subtle fisheye warp on the text layer:
      if (textFisheyeRef.current) {
        const textWarp = 6 + (1 - nx) * 10;
        textFisheyeRef.current.setAttribute("scale", textWarp.toFixed(2));
      }

      // The wordmarks ride a subtle fluid parallax layer:
      // 4Muse on the lower-left drifts gently with the fluid body
      if (whiteRef.current) {
        whiteRef.current.style.transform = `translate3d(${(-ox * 0.028).toFixed(
          2,
        )}px, ${(-oy * 0.028).toFixed(2)}px, 0)`;
      }
      // 4Minds on the right has an opposing fluid displacement
      if (blackRef.current) {
        blackRef.current.style.transform = `translate(${(ox * 0.04).toFixed(
          2,
        )}px, calc(-50% + ${(oy * 0.04).toFixed(2)}px))`;
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
      {/* SVG Filters for Fisheye Warp, Heavy Color Grain, and Text Texture */}
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
        <defs>
          {/* Fluid blob fisheye displacement filter */}
          <filter
            id="fisheye"
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
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

          {/* Text-layer subtle fluid displacement */}
          <filter
            id="text-fisheye"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={fisheyeMap}
              preserveAspectRatio="none"
              result="textMap"
              x="0%"
              y="0%"
              width="100%"
              height="100%"
            />
            <feDisplacementMap
              ref={textFisheyeRef}
              in="SourceGraphic"
              in2="textMap"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Heavy, sharp digital grain / stochastic noise texture */}
          <filter id="grain-hard">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.95"
              numOctaves={4}
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0.33 0.33 0.33 0 0
                      0.33 0.33 0.33 0 0
                      0.33 0.33 0.33 0 0
                      0    0    0    1 0"
              in="noise"
              result="monoNoise"
            />
            <feComponentTransfer in="monoNoise" result="contrasty">
              <feFuncR type="linear" slope="3.2" intercept="-1.05" />
              <feFuncG type="linear" slope="3.2" intercept="-1.05" />
              <feFuncB type="linear" slope="3.2" intercept="-1.05" />
            </feComponentTransfer>
          </filter>

          {/* Gritty edge dither filter for text */}
          <filter id="text-dither" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1.4"
              numOctaves={3}
              stitchTiles="stitch"
              result="fineNoise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="fineNoise"
              scale="1.8"
              xChannelSelector="R"
              yChannelSelector="G"
              result="ditheredEdges"
            />
          </filter>
        </defs>
      </svg>

      {/* Atmospheric fluid gradient aura:
          - Saturated indigo-purple and cobalt wash (#3b3780 / #272863) in upper-left and center
          - Feathering smoothly into pure white (#ffffff) toward top and center-right
          - Deep obsidian/charcoal shadow along the lower-left and bottom
      */}
      <div
        ref={blobRef}
        className="pointer-events-none absolute left-[15%] top-[54%] z-0 h-[105vmin] w-[105vmin] will-change-transform"
        style={{
          transform: "translate3d(-50%, -50%, 0) scale(1.15)",
          filter: "url(#fisheye) blur(42px)",
        }}
      >
        <div
          className="blob-shape absolute inset-0 overflow-hidden"
          style={{
            animation: "blob-morph 48s ease-in-out infinite",
            background:
              // Lavender-indigo wash at top-left fading to pure white at top & right
              "radial-gradient(38% 36% at 30% 25%, rgba(105, 98, 185, 0.95) 0%, rgba(68, 64, 142, 0.85) 45%, rgba(255,255,255,0) 74%), " +
              // Rich saturated deep indigo / cobalt mid-wash
              "radial-gradient(52% 48% at 34% 42%, #38347e 0%, #292862 55%, rgba(41, 40, 98, 0) 80%), " +
              // Deep indigo/navy core
              "radial-gradient(56% 52% at 36% 56%, #212250 0%, #15163a 60%, rgba(21, 22, 58, 0) 82%), " +
              // Obsidian charcoal shadow tightly tucked along the bottom-left edge
              "radial-gradient(68% 46% at 36% 82%, rgba(10, 8, 16, 0.98) 0%, rgba(18, 16, 28, 0.92) 44%, rgba(10, 8, 16, 0) 70%)",
          }}
        >
          {/* Swirling deep indigo highlight */}
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl 84s linear infinite",
              mixBlendMode: "screen",
              background:
                "radial-gradient(30% 30% at 32% 28%, rgba(142, 134, 215, 0.6) 0%, rgba(105, 96, 185, 0.3) 48%, rgba(255,255,255,0) 70%)",
            }}
          />
          {/* Swirling deep obsidian shadow layer along lower edge */}
          <div
            className="blob-layer absolute -inset-1/4"
            style={{
              animation: "blob-swirl-reverse 96s linear infinite",
              mixBlendMode: "multiply",
              background:
                "radial-gradient(48% 40% at 38% 84%, rgba(10, 8, 16, 0.98) 0%, rgba(20, 18, 34, 0.75) 52%, rgba(255,255,255,0) 78%)",
            }}
          />
        </div>
      </div>

      {/* Gritty Texture Layer 1: Bound to the gradient colors via mix-blend-mode: overlay.
          Produces hard, tactile film grain in the mid-tones, highlights, and transitions.
      */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-[0.92] mix-blend-overlay"
      >
        <rect width="100%" height="100%" filter="url(#grain-hard)" />
      </svg>

      {/* Gritty Texture Layer 2: Subtle multiply dither to give the dark shadows and edges
          a gritty, coarse print-like grain while keeping pure white (#ffffff) clean.
      */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-[0.28] mix-blend-multiply"
      >
        <rect width="100%" height="100%" filter="url(#grain-hard)" />
      </svg>

      {/* Hero Typography Layer: sits on the fluid physics plane with dithered text edges */}
      <div
        style={{ filter: "url(#text-dither)" }}
        className="pointer-events-none absolute inset-0 z-30"
      >
        {/* Lower-left hero: 4Muse (crisp white with dithered edges, on purple/charcoal fluid body) */}
        <div
          ref={whiteRef}
          className="pointer-events-none absolute bottom-[18vh] left-[2.5vw] will-change-transform"
          style={{ filter: "drop-shadow(0 0 1px rgba(255,255,255,0.4))" }}
        >
          <Image
            src="/Logo/4muse-white.webp"
            alt="4Muse"
            width={865}
            height={150}
            priority
            draggable={false}
            style={{
              height: "clamp(3.2rem, 11vw, 9.5rem)",
              width: "auto",
            }}
          />
        </div>

        {/* Center-right hero: 4Minds (bold black with dithered texture, vertically centered, bleeding off right edge) */}
        <div
          ref={blackRef}
          className="pointer-events-none absolute right-[-3vw] top-1/2 will-change-transform"
          style={{ transform: "translateY(-50%)" }}
        >
          <Image
            src="/Logo/4minds-black.webp"
            alt="4Minds"
            width={4588}
            height={810}
            priority
            draggable={false}
            style={{
              height: "clamp(3.8rem, 13vw, 11rem)",
              width: "auto",
            }}
          />
        </div>
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
