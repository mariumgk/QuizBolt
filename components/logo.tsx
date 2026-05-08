import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="6"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top face */}
      <path d="M45 15 L75 32.5 L45 50 L15 32.5 Z" />
      
      {/* Left face */}
      <path d="M15 32.5 L15 67.5 L45 85 L45 50" />
      
      {/* Right face top edge */}
      <path d="M75 32.5 L75 55" />
      
      {/* Lightning bolt */}
      <path
        d="M55 40 L40 70 L60 65 L50 95 L90 55 L70 60 Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
