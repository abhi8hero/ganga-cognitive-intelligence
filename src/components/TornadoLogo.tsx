import React from 'react';

interface TornadoLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

/**
 * GCI Logo — original aerodynamic motorsport wordmark.
 *
 * Design direction:
 * - Wide / low racing proportions
 * - Strong forward italic
 * - Sharp aerodynamic terminals
 * - Tight letter spacing
 * - Subtle chrome/silver treatment
 * - Cyan racing reflections
 * - Integrated speed streaks
 *
 * The geometry is intentionally original rather than reproducing
 * the Formula 1 logo or its proprietary typeface.
 */
const TornadoLogo: React.FC<TornadoLogoProps> = ({
  size = 40,
  className = '',
  animated = true,
}) => {
  const width = Math.round(size * 3.2);
  const height = size;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none overflow-visible ${className}`}
      role="img"
      aria-label="GCI logo"
    >
      <defs>
        {/* =========================================================
            PRIMARY RACING CHROME
           ========================================================= */}
        <linearGradient
          id="gci-metal"
          x1="15"
          y1="3"
          x2="135"
          y2="47"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="14%" stopColor="#F8FAFC" />
          <stop offset="32%" stopColor="#CBD5E1" />
          <stop offset="48%" stopColor="#FFFFFF" />
          <stop offset="64%" stopColor="#94A3B8" />
          <stop offset="82%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        {/* Dark lower metallic surface */}
        <linearGradient
          id="gci-metal-dark"
          x1="20"
          y1="15"
          x2="140"
          y2="48"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="25%" stopColor="#CBD5E1" />
          <stop offset="55%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        {/* Bright racing highlight */}
        <linearGradient
          id="gci-highlight"
          x1="8"
          y1="4"
          x2="145"
          y2="11"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#FFFFFF" />
          <stop offset="55%" stopColor="#38BDF8" />
          <stop offset="75%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
        </linearGradient>

        {/* Cyan edge */}
        <linearGradient
          id="gci-cyan-edge"
          x1="0"
          y1="20"
          x2="155"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0" />
          <stop offset="20%" stopColor="#38BDF8" />
          <stop offset="60%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
        </linearGradient>

        {/* Speed trail */}
        <linearGradient
          id="gci-speed"
          x1="0"
          y1="25"
          x2="45"
          y2="25"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" stopOpacity="0" />
          <stop offset="55%" stopColor="#38BDF8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.9" />
        </linearGradient>

        {/* Background glow */}
        <radialGradient id="gci-glow">
          <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.24" />
          <stop offset="45%" stopColor="#0284C7" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
        </radialGradient>

        {/* Deep racing shadow */}
        <filter
          id="gci-shadow"
          x="-20%"
          y="-30%"
          width="145%"
          height="165%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="2"
            floodColor="#020617"
            floodOpacity="0.9"
          />

          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="3"
            floodColor="#0284C7"
            floodOpacity="0.22"
          />
        </filter>

        {/* Subtle highlight blur */}
        <filter id="gci-soft-glow">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      {/* =========================================================
          BACKGROUND AERODYNAMIC GLOW
         ========================================================= */}
      <ellipse
        cx="82"
        cy="25"
        rx="76"
        ry="21"
        fill="url(#gci-glow)"
      />

      {/* =========================================================
          RACING SPEED LINES
         ========================================================= */}
      <g opacity={animated ? 0.9 : 0.55}>
        <path
          d="M 0 9 H 30"
          stroke="url(#gci-speed)"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        <path
          d="M 4 14 H 39"
          stroke="url(#gci-speed)"
          strokeWidth="1"
          strokeLinecap="round"
        />

        <path
          d="M 0 38 H 34"
          stroke="url(#gci-speed)"
          strokeWidth="0.9"
          strokeLinecap="round"
        />

        <path
          d="M 8 42 H 27"
          stroke="url(#gci-speed)"
          strokeWidth="0.7"
          strokeLinecap="round"
        />
      </g>

      {/* =========================================================
          MAIN GCI WORDMARK
         ========================================================= */}
      <g filter="url(#gci-shadow)">

        {/* =======================================================
            G
            Wide, low, forward-slanted racing shape
           ======================================================= */}

        <path
          d="
            M 46 7

            C 39 4 32 3 25 5
            C 17 7 11 13 8 21
            C 5 29 7 37 13 42
            C 18 47 27 48 35 46
            C 42 44 47 40 51 34

            L 53 24
            L 31 24
            L 27 31
            L 40 31

            C 37 35 33 37 29 37
            C 24 37 21 34 21 30
            C 20 26 22 21 25 18
            C 28 14 32 12 36 13
            C 40 13 43 15 46 18

            L 53 11
            Z
          "
          fill="url(#gci-metal)"
        />

        {/* G lower dark aerodynamic plane */}
        <path
          d="
            M 13 35
            C 18 42 28 45 38 41
            L 33 46
            C 25 48 17 45 12 40
            Z
          "
          fill="url(#gci-metal-dark)"
          opacity="0.72"
        />

        {/* G internal cut */}
        <path
          d="
            M 46 18
            C 43 15 40 13 36 13
            C 31 12 27 15 24 19
            C 21 23 20 28 21 31
            C 22 35 25 37 29 37
            C 34 37 38 34 40 31
            L 27 31
            L 31 24
            L 53 24
            L 51 34
            C 47 40 41 44 35 46
            L 30 39
            C 36 37 39 34 40 31
            C 37 35 33 37 29 37
            C 25 37 22 35 21 31
            C 20 27 22 22 25 18
            C 28 14 32 12 36 13
            C 40 13 43 15 46 18
            Z
          "
          fill="#020B1C"
        />

        {/* G upper racing highlight */}
        <path
          d="
            M 10 21
            C 14 11 23 5 34 5
            C 40 5 44 7 48 10
          "
          stroke="url(#gci-highlight)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* G cyan leading edge */}
        <path
          d="
            M 8 21
            C 5 29 7 37 13 42
          "
          stroke="#38BDF8"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.9"
        />


        {/* =======================================================
            C
            Compressed aerodynamic center character
           ======================================================= */}

        <path
          d="
            M 94 7

            C 88 4 81 3 75 5
            C 67 7 61 13 58 21
            C 55 29 57 37 63 42
            C 69 47 78 48 86 44
            C 91 42 95 39 99 35

            L 90 28

            C 87 32 83 35 79 35
            C 75 35 72 33 71 30
            C 70 27 71 23 73 20
            C 75 16 79 13 83 13
            C 87 13 90 15 93 18

            L 101 10
            Z
          "
          fill="url(#gci-metal)"
        />

        {/* C inner negative space */}
        <path
          d="
            M 93 18
            C 90 15 87 13 83 13
            C 78 13 74 16 72 21
            C 70 25 70 30 72 33
            C 74 36 77 37 81 36
            C 85 35 88 32 90 28
            L 84 28
            C 82 31 79 32 77 31
            C 75 30 75 27 76 24
            C 77 21 79 19 82 18
            C 85 17 88 19 90 21
            Z
          "
          fill="#020B1C"
        />

        {/* C lower metallic plane */}
        <path
          d="
            M 62 36
            C 68 44 79 47 88 42
            L 84 46
            C 76 49 67 46 62 42
            Z
          "
          fill="url(#gci-metal-dark)"
          opacity="0.7"
        />

        {/* C top specular */}
        <path
          d="
            M 59 21
            C 63 11 71 5 82 5
            C 88 5 93 7 97 10
          "
          stroke="url(#gci-highlight)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* C cyan leading edge */}
        <path
          d="
            M 58 21
            C 55 29 57 37 63 42
          "
          stroke="#38BDF8"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.9"
        />


        {/* =======================================================
            I
            Narrow aerodynamic blade — intentionally NOT a T
           ======================================================= */}

        <path
          d="
            M 111 5
            L 124 5
            L 114 45
            L 101 45
            Z
          "
          fill="url(#gci-metal)"
        />

        {/* I dark lower plane */}
        <path
          d="
            M 108 30
            L 117 7
            L 114 45
            L 104 45
            Z
          "
          fill="url(#gci-metal-dark)"
          opacity="0.5"
        />

        {/* I bright top reflection */}
        <path
          d="
            M 111 5
            L 124 5
          "
          stroke="#FFFFFF"
          strokeWidth="1.4"
          strokeLinecap="round"
        />

        {/* I cyan aerodynamic edge */}
        <path
          d="
            M 101 45
            L 111 5
          "
          stroke="#38BDF8"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* I secondary reflection */}
        <path
          d="
            M 115 8
            L 106 42
          "
          stroke="#E0F2FE"
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.55"
        />
      </g>

      {/* =========================================================
          FINAL ULTRA-THIN SPEED ACCENT
         ========================================================= */}
      <path
        d="M 116 47 C 128 46 139 43 153 37"
        stroke="url(#gci-cyan-edge)"
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity={animated ? 0.8 : 0.45}
      />
    </svg>
  );
};

export default TornadoLogo;
