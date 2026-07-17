"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

export type AboutGalleryPhoto = {
  src: string;
  alt: string;
};

type Props = {
  photos: AboutGalleryPhoto[];
};

export default function AboutPhotoGallery({ photos }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, goPrev, goNext]);

  const active = photos[activeIndex];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {photos.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => openAt(index)}
            className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--espresso)]/5 ring-1 ring-[var(--espresso)]/10 hover:ring-[var(--terracotta)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--terracotta)] transition-shadow cursor-pointer"
            aria-label={photo.alt}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 448px"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={14} className="text-white" />
            </div>
          </button>
        ))}
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">{active.alt}</Dialog.Title>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 sm:left-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 sm:right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight size={22} />
              </button>
            </>
          )}

          <div className="relative w-full max-w-lg sm:max-w-xl md:max-w-2xl aspect-[3/4] max-h-[85vh]">
            <Image
              key={active.src}
              src={active.src}
              alt={active.alt}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>

          {photos.length > 1 && (
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 font-body text-sm">
              {activeIndex + 1} / {photos.length}
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
