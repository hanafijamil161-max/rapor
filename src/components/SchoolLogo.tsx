import React from "react";

interface SchoolLogoProps {
  className?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`${className} flex items-center justify-center select-none`}>
      <svg
        id="school-logo-svg"
        viewBox="0 0 500 500"
        className="w-full h-full drop-shadow-md"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer subtle shadow / glow ring */}
        <circle cx="250" cy="250" r="248" fill="none" stroke="#fef08a" strokeWidth="2" opacity="0.4" />
        
        {/* Outer Yellow/Gold Ring */}
        <circle cx="250" cy="250" r="238" fill="none" stroke="#fef08a" strokeWidth="8" />
        
        {/* Main Blue Circle Background */}
        <circle cx="250" cy="250" r="230" fill="#2c3a93" />
        
        {/* Inner Yellow Ring */}
        <circle cx="250" cy="250" r="172" fill="none" stroke="#fef08a" strokeWidth="3" />
        <circle cx="250" cy="250" r="166" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.5" />

        {/* Hidden paths for circular text wrapping */}
        {/* Path for TOP text - clockwise from 9:30 to 2:30 */}
        <path
          id="top-text-path"
          d="M 68,235 A 182,182 0 0,1 432,235"
          fill="none"
          stroke="none"
        />
        
        {/* Path for BOTTOM text - clockwise from 3:30 to 8:30 (reads clockwise but inverted, OR counter-clockwise to read upright) */}
        {/* We use sweep-flag=0 (counter-clockwise) starting at 75,265 and ending at 425,265 to keep readable bottom text */}
        <path
          id="bottom-text-path"
          d="M 75,265 A 182,182 0 0,0 425,265"
          fill="none"
          stroke="none"
        />

        {/* Top Arc Text */}
        <text className="font-sans font-black tracking-[0.06em]" fill="#ffffff" fontSize="24">
          <textPath href="#top-text-path" startOffset="50%" textAnchor="middle">
            SEKOLAH ISLAM MUMTAZ
          </textPath>
        </text>

        {/* Bottom Arc Text */}
        <text className="font-sans font-black tracking-[0.06em]" fill="#ffffff" fontSize="24">
          <textPath href="#bottom-text-path" startOffset="50%" textAnchor="middle">
            BANDAR LAMPUNG
          </textPath>
        </text>

        {/* Left Side Star */}
        {/* Centered at X=65, Y=250 */}
        <polygon
          points="62,240 65,247 73,248 67,253 69,260 62,256 55,260 57,253 51,248 59,247"
          fill="#fef08a"
        />

        {/* Right Side Star */}
        {/* Centered at X=435, Y=250 */}
        <polygon
          points="438,240 441,247 449,248 443,253 445,260 438,256 431,260 433,253 427,248 435,247"
          fill="#fef08a"
        />

        {/* CENTER EMBLEM AREA */}
        
        {/* Arabic text: ممتاز */}
        <text
          x="250"
          y="152"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="38"
          fontWeight="bold"
          fill="#fef08a"
          textAnchor="middle"
        >
          ممتاز
        </text>

        {/* Center Star */}
        <polygon
          points="250,165 254,177 267,177 256,185 260,197 250,189 240,197 244,185 233,177 246,177"
          fill="#fef08a"
        />

        {/* Left Page of Open Book */}
        <path
          d="M 242,205 Q 185,185 130,208 L 130,295 Q 185,272 242,295 Z"
          fill="#fffb84"
          stroke="#fef08a"
          strokeWidth="1.5"
        />
        
        {/* Right Page of Open Book */}
        <path
          d="M 258,205 Q 315,185 370,208 L 370,295 Q 315,272 258,295 Z"
          fill="#fffb84"
          stroke="#fef08a"
          strokeWidth="1.5"
        />

        {/* Letter M on Left Page */}
        <text
          x="186"
          y="272"
          fontFamily="'Times New Roman', Times, serif"
          fontSize="76"
          fontWeight="900"
          fill="#2c3a93"
          textAnchor="middle"
        >
          M
        </text>

        {/* Letter Z on Right Page */}
        <text
          x="314"
          y="272"
          fontFamily="'Times New Roman', Times, serif"
          fontSize="76"
          fontWeight="900"
          fill="#2c3a93"
          textAnchor="middle"
        >
          Z
        </text>

        {/* Bottom Subtitle: Muslim Kaffah */}
        <text
          x="250"
          y="342"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize="21"
          fontWeight="bold"
          fill="#fef08a"
          textAnchor="middle"
        >
          Muslim Kaffah
        </text>

        {/* Bottom Subtitle: School */}
        <text
          x="250"
          y="368"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontStyle="italic"
          fontSize="21"
          fontWeight="bold"
          fill="#fef08a"
          textAnchor="middle"
        >
          School
        </text>
      </svg>
    </div>
  );
};
