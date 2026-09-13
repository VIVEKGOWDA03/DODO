function DodoLogo() {
  return (
    <svg viewBox="0 0 160 40" width="140" height="35" fill="none" role="img" aria-label="Dodo Checkout">
      <g transform="translate(4, 4)">
        <rect width="32" height="32" rx="9" fill="#4F46E5" />
        <path
          d="M10 16C10 12.6863 12.6863 10 16 10H19C22.3137 10 25 12.6863 25 16V17C25 20.3137 22.3137 23 19 23H15C12.2386 23 10 20.7614 10 18V16Z"
          fill="white"
        />
        <circle cx="18" cy="14.5" r="1.75" fill="#4F46E5" />
        <path
          d="M21 16H25C26.1046 16 27 16.8954 27 18C27 19.1046 26.1046 20 25 20H23"
          stroke="#EEF2FF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <text
        x="44"
        y="25"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="-0.4px"
        fill="#0F172A"
      >
        Dodo <tspan fontWeight="500" fill="#64748B">Checkout</tspan>
      </text>
    </svg>
  )
}

export default DodoLogo
