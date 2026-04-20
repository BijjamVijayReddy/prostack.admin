import { CSSProperties } from "react";

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
  rounded?: string;
}

/** Animated shimmer block — use width/height via className or style */
export function Skeleton({ className = "", style, rounded = "rounded-md" }: SkeletonProps) {
  return (
    <div
      className={`${rounded} ${className} skeleton-shimmer`}
      style={style}
    />
  );
}
