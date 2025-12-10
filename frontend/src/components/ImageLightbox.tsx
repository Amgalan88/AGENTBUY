"use client";

import { useEffect } from "react";

interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  onClose?: () => void;
}

export default function ImageLightbox({ src, alt = "preview", onClose }: ImageLightboxProps): React.JSX.Element | null {
  useEffect(() => {
    if (!src) return;
    const handler = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape" && onClose) {
          onClose();
        }
      }}
    >
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10 bg-black cursor-zoom-out"
        onClick={(e) => {
          e.stopPropagation();
          if (onClose) onClose();
        }}
      />
    </div>
  );
}

