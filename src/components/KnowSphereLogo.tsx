'use client';

export default function KnowSphereLogo({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 38 38"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="ks-logo-bg" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="0.5" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="ks-swirl-grad1" x1="10" y1="8" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93c5fd" />
          <stop offset="0.5" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <filter id="ks-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Squircle Background */}
      <rect width="38" height="38" rx="11" fill="url(#ks-logo-bg)" />
      <rect width="38" height="38" rx="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />

      {/* Stylized Ribbon Swirl */}
      <path
        d="M26 12C26 12 14 13 13 20C12 26 24 25 24 25"
        stroke="url(#ks-swirl-grad1)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#ks-glow)"
      />
      <circle cx="20" cy="19" r="2.8" fill="#ffffff" />
    </svg>
  );
}
