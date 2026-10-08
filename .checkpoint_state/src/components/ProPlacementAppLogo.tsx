import React, { useEffect, useState } from 'react';
import { THREELION_LOGO_DATA_URI } from '../assets/threeLlionLogoData';

interface ProPlacementAppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTextBeside?: boolean;
}

let cachedCroppedThreeLlionUri: string | null = null;

/**
 * Exact 1:1 reproduction of the uploaded Pro Placement App Logo (1000x1000 coordinate grid):
 * - Top white semi-circle notch containing the tightly cropped exact 3LLION logo
 * - Deep midnight-navy squircle (#142949 -> #050C18) with slate-blue 3D bevel rim
 * - Exact 3D sculpted periwinkle/indigo "P" with flat-left/rounded-right bottom stem and S-fold loop
 * - Exact 3D rounded cyan upward-right arrow emerging seamlessly from the P counter
 * - 3D recessed metallic ring with glossy emerald-teal sphere at (718, 718)
 * - "PRO PLACEMENT" white serif capitals at (500, 912)
 */
export const ProPlacementAppLogo: React.FC<ProPlacementAppLogoProps> = React.memo(
  ({ size = 'md', className = '', showTextBeside = false }) => {
    const [croppedLogoUri, setCroppedLogoUri] = useState<string>(
      cachedCroppedThreeLlionUri || THREELION_LOGO_DATA_URI
    );

    useEffect(() => {
      if (cachedCroppedThreeLlionUri) return;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

          let minX = width;
          let minY = height;
          let maxX = 0;
          let maxY = 0;

          // Ignore outer 12px border to exclude any edge frame line
          for (let y = 12; y < height - 12; y++) {
            for (let x = 12; x < width - 12; x++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              if (r < 225 || g < 225 || b < 225) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          if (maxX > minX && maxY > minY) {
            const pad = 10;
            const sx = Math.max(0, minX - pad);
            const sy = Math.max(0, minY - pad);
            const sw = Math.min(width - sx, maxX - minX + pad * 2);
            const sh = Math.min(height - sy, maxY - minY + pad * 2);

            const out = document.createElement('canvas');
            out.width = sw;
            out.height = sh;
            const outCtx = out.getContext('2d');
            if (outCtx) {
              outCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
              const uri = out.toDataURL('image/png');
              cachedCroppedThreeLlionUri = uri;
              setCroppedLogoUri(uri);
            }
          }
        } catch {
          // Keep original URI fallback
        }
      };
      img.src = THREELION_LOGO_DATA_URI;
    }, []);

    const dimensions = {
      xs: 'w-8 h-8',
      sm: 'w-9 h-9 sm:w-10 sm:h-10',
      md: 'w-12 h-12 sm:w-14 sm:h-14',
      lg: 'w-16 h-16 sm:w-20 sm:h-20',
      xl: 'w-24 h-24 sm:w-28 sm:h-28',
    }[size];

    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div
          className={`${dimensions} relative shrink-0 rounded-[22%] overflow-hidden bg-white`}
        >
          <svg
            viewBox="0 0 1000 1000"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full block"
            role="img"
            aria-label="Pro Placement App Logo"
          >
            <defs>
              {/* Squircle Outer Metallic Bevel Rim */}
              <linearGradient
                id="ppRim1000"
                x1="42"
                y1="35"
                x2="958"
                y2="956"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#324663" />
                <stop offset="45%" stopColor="#1B2B44" />
                <stop offset="100%" stopColor="#132035" />
              </linearGradient>

              {/* Squircle Deep Midnight-Navy Interior */}
              <radialGradient
                id="ppBg1000"
                cx="44%"
                cy="42%"
                r="62%"
              >
                <stop offset="0%" stopColor="#162D50" />
                <stop offset="52%" stopColor="#0B192F" />
                <stop offset="100%" stopColor="#040B16" />
              </radialGradient>

              {/* Layer 1: Left Outer Stem & Top Arch Ribbon */}
              <linearGradient
                id="ppOuterLeft1000"
                x1="273"
                y1="224"
                x2="348"
                y2="795"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#8EC3FF" />
                <stop offset="30%" stopColor="#5882F8" />
                <stop offset="72%" stopColor="#4144DC" />
                <stop offset="100%" stopColor="#3B2ECA" />
              </linearGradient>

              {/* Layer 2: Inner Stem & Top Arch Underside Bevel */}
              <linearGradient
                id="ppInnerStem1000"
                x1="348"
                y1="276"
                x2="450"
                y2="600"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#2651D4" />
                <stop offset="50%" stopColor="#4553E8" />
                <stop offset="100%" stopColor="#362BB8" />
              </linearGradient>

              {/* Layer 3: P Loop Main Outer Ribbon Flowing into Lower Stem */}
              <linearGradient
                id="ppBowlOuter1000"
                x1="690"
                y1="320"
                x2="335"
                y2="795"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#6D7AF8" />
                <stop offset="48%" stopColor="#564FE6" />
                <stop offset="82%" stopColor="#4438D4" />
                <stop offset="100%" stopColor="#3B2EC6" />
              </linearGradient>

              {/* Layer 4: P Loop Inner S-Fold Bevel */}
              <linearGradient
                id="ppBowlInner1000"
                x1="640"
                y1="350"
                x2="348"
                y2="650"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#5E68F4" />
                <stop offset="50%" stopColor="#7380FA" />
                <stop offset="100%" stopColor="#483ED8" />
              </linearGradient>

              {/* Layer 5: Cyan Arrow 3D Outer Bevel */}
              <linearGradient
                id="ppArrowBevel1000"
                x1="500"
                y1="360"
                x2="782"
                y2="172"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#1974EC" />
                <stop offset="55%" stopColor="#2FB8F8" />
                <stop offset="100%" stopColor="#6FE7FF" />
              </linearGradient>

              {/* Layer 6: Cyan Arrow Luminous Inner Face */}
              <linearGradient
                id="ppArrowFace1000"
                x1="510"
                y1="355"
                x2="755"
                y2="195"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#1B82F6" />
                <stop offset="45%" stopColor="#37CBFA" />
                <stop offset="85%" stopColor="#8BF3FF" />
                <stop offset="100%" stopColor="#B8FCFF" />
              </linearGradient>

              {/* Layer 7: Emerald Sphere Outer Bevel Ring */}
              <linearGradient
                id="ppSphereRim1000"
                x1="650"
                y1="650"
                x2="786"
                y2="786"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#72F7D2" />
                <stop offset="50%" stopColor="#26A692" />
                <stop offset="100%" stopColor="#14635C" />
              </linearGradient>

              {/* Layer 8: Emerald Sphere Inner Glossy Core */}
              <radialGradient
                id="ppSphereCore1000"
                cx="38%"
                cy="30%"
                r="68%"
              >
                <stop offset="0%" stopColor="#5CF4C9" />
                <stop offset="52%" stopColor="#1CA98E" />
                <stop offset="100%" stopColor="#0C584F" />
              </radialGradient>

              <filter
                id="ppShadow1000"
                x="-12%"
                y="-12%"
                width="124%"
                height="128%"
              >
                <feDropShadow
                  dx="0"
                  dy="14"
                  stdDeviation="12"
                  floodColor="#02060E"
                  floodOpacity="0.6"
                />
              </filter>
            </defs>

            {/* 1. Outer Beveled Squircle */}
            <rect
              x="42"
              y="35"
              width="916"
              height="921"
              rx="215"
              fill="url(#ppRim1000)"
              stroke="#7A8B9E"
              strokeWidth="3"
            />
            <rect
              x="58"
              y="51"
              width="884"
              height="889"
              rx="200"
              fill="url(#ppBg1000)"
              stroke="#071120"
              strokeWidth="4"
            />

            {/* 2. Top White Semi-Circle Notch with Exact Cropped 3LLION Logo */}
            <path
              d="M 322 0 H 678 C 672 124, 598 196, 500 196 C 402 196, 328 124, 322 0 Z"
              fill="#FFFFFF"
            />
            <image
              href={croppedLogoUri}
              x="384"
              y="42"
              width="232"
              height="112"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* 3. Exact 3D "P" Ribbon + Cyan Arrow */}
            <g filter="url(#ppShadow1000)">
              {/* Piece B: Inner Vertical Stem & Top Arch Underside */}
              <path
                d="M 348 620 V 368 C 348 308, 374 276, 434 276 H 618 C 594 312, 560 332, 512 332 H 416 V 556 Z"
                fill="url(#ppInnerStem1000)"
              />

              {/* Piece C: P Loop Main Outer Ribbon Flowing into Lower-Right Stem */}
              <path
                d="M 696 316 C 716 352, 725 392, 725 432 C 725 548, 628 614, 484 614 H 416 V 700 C 416 756, 382 795, 334 795 H 348 V 624 C 348 562, 392 534, 464 534 H 504 C 594 534, 654 492, 654 424 C 654 396, 646 370, 634 350 Z"
                fill="url(#ppBowlOuter1000)"
              />

              {/* Piece D: P Loop Inner S-Fold Bevel Wrapping from D-Hole Down into Lower Stem */}
              <path
                d="M 634 350 C 646 370, 654 396, 654 424 C 654 492, 594 534, 504 534 H 464 C 392 534, 348 562, 348 624 V 795 H 348 V 574 C 348 518, 392 490, 462 490 H 508 C 562 490, 596 460, 596 412 C 596 394, 592 378, 584 364 Z"
                fill="url(#ppBowlInner1000)"
              />

              {/* Fill Lower-Right Stem Body Between x=348 and x=416 */}
              <path
                d="M 348 610 C 348 560, 388 534, 456 534 H 484 V 614 H 416 V 700 C 416 756, 382 795, 334 795 H 348 Z"
                fill="url(#ppBowlOuter1000)"
              />

              {/* Piece A: Outer Left Vertical Stem & Top Arch Ribbon (Flat Bottom at y=795) */}
              <path
                d="M 273 795 V 365 C 273 272, 332 224, 424 224 H 572 C 604 224, 626 244, 622 266 C 596 276, 556 276, 434 276 C 374 276, 348 308, 348 368 V 795 H 273 Z"
                fill="url(#ppOuterLeft1000)"
              />

              {/* Subtle Vertical Groove Highlight at x=348 */}
              <path
                d="M 348 790 V 368 C 348 308, 374 276, 434 276 H 606"
                stroke="#93C5FD"
                strokeWidth="3.5"
                strokeLinecap="round"
                opacity="0.55"
              />

              {/* Piece E: 3D Cyan Upward-Right Arrow — Outer Beveled Body */}
              <path
                d="M 484 332 C 554 332, 616 300, 672 232 H 644 C 624 232, 612 218, 612 202 C 612 186, 624 172, 644 172 H 754 C 770 172, 782 184, 782 200 V 310 C 782 330, 768 342, 752 342 C 736 342, 722 330, 722 310 V 280 C 654 348, 596 402, 596 446 C 596 378, 552 332, 484 332 Z"
                fill="url(#ppArrowBevel1000)"
              />

              {/* Piece F: 3D Cyan Upward-Right Arrow — Inner Raised Luminous Face */}
              <path
                d="M 508 334 C 568 330, 626 298, 686 220 H 646 C 632 220, 624 212, 624 202 C 624 192, 632 184, 646 184 H 748 C 760 184, 768 192, 768 204 V 306 C 768 320, 760 328, 750 328 C 740 328, 732 320, 732 306 V 262 C 664 332, 606 386, 596 426 C 592 374, 556 338, 508 334 Z"
                fill="url(#ppArrowFace1000)"
              />
            </g>

            {/* 4. 3D Glossy Emerald-Teal Sphere at (718, 718) */}
            <g filter="url(#ppShadow1000)">
              {/* Outer 3D Beveled Ring */}
              <circle
                cx="718"
                cy="718"
                r="67"
                fill="url(#ppSphereRim1000)"
              />
              {/* Inner Glossy Sphere */}
              <circle
                cx="718"
                cy="718"
                r="57"
                fill="url(#ppSphereCore1000)"
              />
            </g>

            {/* 5. Bottom Serif Title: "PRO PLACEMENT" */}
            <text
              x="500"
              y="910"
              textAnchor="middle"
              fill="#FFFFFF"
              fontFamily="Cinzel, Georgia, 'Times New Roman', serif"
              fontWeight="700"
              fontSize="47"
              letterSpacing="13"
            >
              PRO PLACEMENT
            </text>
          </svg>
        </div>

        {showTextBeside && (
          <div className="text-left">
            <span className="font-bold text-sm sm:text-base text-[#0B2545] tracking-tight block leading-tight">
              Pro Placement
            </span>
            <span className="block text-[9px] sm:text-[10px] font-semibold text-[#13315C] uppercase tracking-widest">
              3LLION Ventures
            </span>
          </div>
        )}
      </div>
    );
  }
);
