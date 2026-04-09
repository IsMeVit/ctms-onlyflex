"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export function ImageWithFallback({
  src,
  fallbackSrc = "/placeholder.jpg",
  alt,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    setError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className="relative overflow-hidden bg-zinc-900">
      {loading && !error && (
        <div className="absolute inset-0 animate-pulse bg-zinc-800" />
      )}
      <Image
        {...props}
        src={error ? fallbackSrc : src}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`${props.className || ""} ${loading ? "opacity-0" : "opacity-100"} transition-opacity`}
      />
    </div>
  );
}