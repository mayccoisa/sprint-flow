interface Props {
  size?: number;
  className?: string;
}

export function ConfluenceIcon({ size = 14, className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="img"
    >
      <linearGradient
        id="confA"
        x1="22.5067"
        y1="-0.4067"
        x2="13.1118"
        y2="26.7799"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset=".18" stopColor="#0052CC" />
        <stop offset="1" stopColor="#2684FF" />
      </linearGradient>
      <linearGradient
        id="confB"
        x1="9.4922"
        y1="32.4146"
        x2="18.8867"
        y2="5.2274"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset=".18" stopColor="#0052CC" />
        <stop offset="1" stopColor="#2684FF" />
      </linearGradient>
      <path
        fill="url(#confA)"
        d="M1.14 22.78c-0.32 0.53-0.69 1.16-1 1.63-0.27 0.46-0.12 1.05 0.34 1.33l6.51 4c0.46 0.28 1.06 0.13 1.33-0.34 0.27-0.45 0.61-1.04 0.97-1.66 2.55-4.21 5.12-3.69 9.74-1.48l6.46 3.07c0.49 0.23 1.07 0.02 1.3-0.46l3.1-7.02c0.22-0.5-0.01-1.08-0.51-1.3-1.36-0.64-4.07-1.92-6.52-3.1-8.81-4.29-16.3-4.02-21.72 5.34z"
      />
      <path
        fill="url(#confB)"
        d="M30.86 9.22c0.32-0.53 0.69-1.16 1-1.63 0.27-0.46 0.12-1.05-0.34-1.33l-6.51-4c-0.46-0.29-1.07-0.15-1.36 0.31-0.01 0.01-0.01 0.02-0.01 0.03-0.27 0.45-0.61 1.04-0.97 1.66-2.55 4.21-5.12 3.69-9.74 1.48l-6.44-3.05c-0.49-0.23-1.07-0.02-1.3 0.46L1.99 9.94c-0.22 0.5 0.01 1.08 0.51 1.3 1.36 0.64 4.07 1.92 6.52 3.1 8.84 4.29 16.32 4.02 21.74-5.34z"
      />
    </svg>
  );
}
