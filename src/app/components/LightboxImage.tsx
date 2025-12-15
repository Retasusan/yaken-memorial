"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface LightboxImageProps {
  src: string;
  alt: string;
}

export function LightboxImage({ src, alt }: LightboxImageProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative min-h-[320px] max-h-[70vh] overflow-hidden rounded-xl border border-white/10 bg-black/40 p-3">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block h-full w-full cursor-zoom-in"
        aria-label="画像を拡大表示"
      >
        <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" priority />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
          <span className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-black">クリックで拡大</span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-8"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal
          aria-label="拡大画像"
        >
          <div className="relative h-full w-full max-w-5xl">
            <Image
              src={src}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-black shadow"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
