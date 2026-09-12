"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { renderAtmosphere, renderWordmark } from "@/lib/hero-effects";

export default function Home() {
  const sceneRef = useRef<HTMLElement>(null);
  const atmosphereRef = useRef<HTMLCanvasElement>(null);
  const museRef = useRef<HTMLCanvasElement>(null);
  const mindsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const atmosphere = atmosphereRef.current;
    const muse = museRef.current;
    const minds = mindsRef.current;
    if (!scene || !atmosphere || !muse || !minds) return;
    let disposed = false;
    let frame = 0;
    const museImage = new window.Image();
    const mindsImage = new window.Image();
    museImage.src = "/Logo/4muse-white.webp";
    mindsImage.src = "/Logo/4minds-black.webp";

    const render = () => {
      const { width, height } = scene.getBoundingClientRect();
      renderAtmosphere(atmosphere, width, height);
      if (museImage.complete && museImage.naturalWidth) renderWordmark(muse, museImage, width, height, "muse");
      if (mindsImage.complete && mindsImage.naturalWidth) renderWordmark(minds, mindsImage, width, height, "minds");
    };
    // A fixed composition for design review: repaint only on asset load or resize.
    const scheduleRender = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(render);
    };
    Promise.all([museImage.decode(), mindsImage.decode()])
      .then(() => { if (!disposed) scheduleRender(); })
      .catch(() => { /* The underlying images remain visible if decoding fails. */ });
    const observer = new ResizeObserver(scheduleRender);
    observer.observe(scene);
    scheduleRender();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <main ref={sceneRef} className="hero" aria-label="4M — 4Muse and 4Minds">
      <div className="hero-atmosphere-fallback" aria-hidden="true" />
      <canvas ref={atmosphereRef} className="hero-atmosphere" aria-hidden="true" />
      {/* Each wordmark has its own raster grid and lens transform. */}
      <div className="wordmark wordmark-muse" role="img" aria-label="4Muse">
        <Image src="/Logo/4muse-white.webp" alt="" width={865} height={150} priority />
      </div>
      <canvas ref={museRef} className="wordmark-effect wordmark-effect-muse" aria-hidden="true" />
      <div className="wordmark wordmark-minds" role="img" aria-label="4Minds">
        <Image src="/Logo/4minds-black.webp" alt="" width={4588} height={810} priority />
      </div>
      <canvas ref={mindsRef} className="wordmark-effect wordmark-effect-minds" aria-hidden="true" />
      <header className="hero-header">
        <button className="menu-button" type="button" aria-label="Open menu">
          <span /><span /><span />
        </button>
        <Image className="brand-mark" src="/Logo/4m-black.webp" alt="4M" width={380} height={150} priority draggable={false} />
      </header>
    </main>
  );
}
