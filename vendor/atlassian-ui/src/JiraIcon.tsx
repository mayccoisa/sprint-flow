interface Props {
  size?: number;
  className?: string;
}

export function JiraIcon({ size = 14, className }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      role="img"
    >
      <linearGradient id="jiraA" x1="22.034" x2="17.118" y1="9.773" y2="14.842" gradientUnits="userSpaceOnUse">
        <stop offset=".18" stopColor="#0052cc" />
        <stop offset="1" stopColor="#2684ff" />
      </linearGradient>
      <linearGradient id="jiraB" x1="16.001" x2="10.967" y1="15.626" y2="20.81" gradientUnits="userSpaceOnUse">
        <stop offset=".18" stopColor="#0052cc" />
        <stop offset="1" stopColor="#2684ff" />
      </linearGradient>
      <path
        fill="#2684ff"
        d="M30.41 14.94 17.503 2.034 16.252.783l-9.711 9.711-4.439 4.446a1.487 1.487 0 0 0 0 2.103l8.872 8.872 5.278 5.278 9.711-9.711.151-.151 4.296-4.288a1.487 1.487 0 0 0 0-2.103zm-14.158 4.288-4.432-4.432 4.432-4.432 4.432 4.432z"
      />
      <path
        fill="url(#jiraA)"
        d="M16.252 10.364a7.453 7.453 0 0 1-.032-10.51l-9.687 9.679 5.277 5.277z"
      />
      <path
        fill="url(#jiraB)"
        d="m20.696 14.797-4.444 4.444a7.464 7.464 0 0 1 0 10.541l9.71-9.71z"
      />
    </svg>
  );
}
