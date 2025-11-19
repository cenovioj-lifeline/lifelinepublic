interface LifelineBookIconProps {
  size?: number;
  className?: string;
}

export function LifelineBookIcon({ size = 16, className = "" }: LifelineBookIconProps) {
  // Maintain the original rectangular aspect ratio (108.35:88.459 ≈ 1.225:1)
  const width = size * 1.225;
  
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 108.35 88.459"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id="a">
          <path d="m0 0h108.35v88.459h-108.35z" />
        </clipPath>
      </defs>
      <g clipPath="url(#a)">
        <path
          d="m56.772 16.993c-0.4934 1.5802-1.4802 3.6569-2.9603 3.6569h-0.493c-2.9604 0-2.4671-9.3672-2.4671-9.3672 2.5658 1.0846 4.9339 3.5622 5.9204 5.7103"
          fill="#b31942"
          fillRule="evenodd"
        />
        <path
          d="m28.284 74.741v-55.126c0-1.4815 0.69204-2.4671 2.0748-2.4671 4.4405 0 21.231 6.0138 24.092 7.5939-0.19735 4.2431-1.4815 12.427 1.4815 12.427 3.5569 0 3.8529-12.427 3.8529-12.427 3.6569 1.9722 18.172 6.7992 23.006 7.5939 1.1833 0 1.7779 1.0846 1.7779 2.4671v55.126c-3.5569 1.6792-13.018 4.3418-27.533 4.3418-15.509 0-24.092-2.6625-28.75-4.3418"
          fill="#6f9100"
          fillRule="evenodd"
        />
        <path
          d="m56.772 16.993c-0.4934 1.5802-1.4802 3.6569-2.9603 3.6569h-0.493c-2.9604 0-2.4671-9.3672-2.4671-9.3672 2.5658 1.0846 4.9339 3.5622 5.9204 5.7103z"
          fill="none"
          stroke="#010101"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m28.284 74.741v-55.126c0-1.4815 0.69204-2.4671 2.0748-2.4671 4.4405 0 21.231 6.0138 24.092 7.5939-0.19735 4.2431-1.4815 12.427 1.4815 12.427 3.5569 0 3.8529-12.427 3.8529-12.427 3.6569 1.9722 18.172 6.7992 23.006 7.5939 1.1833 0 1.7779 1.0846 1.7779 2.4671v55.126c-3.5569 1.6792-13.018 4.3418-27.533 4.3418-15.509 0-24.092-2.6625-28.75-4.3418z"
          fill="none"
          stroke="#010101"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m84.441 17.091v57.65"
          fill="none"
          stroke="#010101"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m54.451 24.684v49.663"
          fill="none"
          stroke="#010101"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m37.75 30.105c2.2697 0.88876 5.7237 2.9669 8.779 5.0319"
          fill="none"
          stroke="#f5f3e6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m37.75 36.612c2.2697 0.88876 5.7237 2.9669 8.779 5.0319"
          fill="none"
          stroke="#f5f3e6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m37.75 43.119c2.2697 0.88876 5.7237 2.9669 8.779 5.0319"
          fill="none"
          stroke="#f5f3e6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m61.508 30.105c2.2697 0.88876 5.7237 2.9669 8.779 5.0319"
          fill="none"
          stroke="#f5f3e6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m61.508 36.612c2.2697 0.88876 5.7237 2.9669 8.779 5.0319"
          fill="none"
          stroke="#f5f3e6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
        <path
          d="m61.508 43.119c2.2697 0.88876 5.7237 2.9669 8.779 5.0319"
          fill="none"
          stroke="#f5f3e6"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.1833"
        />
      </g>
    </svg>
  );
}
