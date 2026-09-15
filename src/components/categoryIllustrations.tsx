import React from 'react';

// High-fidelity vector illustrations depicting the paired products from the Blinkit category tiles

export const PaanCornerArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Green lighter */}
    <g transform="translate(18, 14)">
      <rect x="0" y="24" width="22" height="52" rx="4" fill="#69db38" />
      <rect x="0" y="24" width="6" height="52" rx="2" fill="#8ce94e" opacity="0.6" />
      <rect x="2" y="8" width="18" height="16" rx="2" fill="#cbd5e1" />
      <rect x="5" y="0" width="12" height="9" rx="1" fill="#94a3b8" />
      <circle cx="11" cy="4" r="2.5" fill="#475569" />
      {/* Flame spark hint */}
      <path d="M11 0 C9 -5 13 -7 11 -10 C14 -7 14 -3 11 0" fill="#f59e0b" opacity="0.85" />
    </g>
    {/* RAW Rolling Papers pack */}
    <g transform="translate(48, 12)">
      <rect x="0" y="0" width="46" height="74" rx="3" fill="#8c3310" />
      <rect x="3" y="3" width="40" height="68" rx="2" fill="#ad4318" />
      <rect x="0" y="0" width="46" height="74" rx="3" stroke="#e08453" strokeWidth="1" />
      {/* RAW text */}
      <text x="23" y="38" textAnchor="middle" fill="#d42617" fontSize="17" fontWeight="900" fontFamily="sans-serif" letterSpacing="-1">
        RAW
      </text>
      <text x="23" y="47" textAnchor="middle" fill="#fef08a" fontSize="5" fontWeight="800">
        CLASSIC
      </text>
      <text x="23" y="56" textAnchor="middle" fill="#fed7aa" fontSize="3.5" fontWeight="600">
        NATURAL UNREFINED
      </text>
      {/* Ribbon stripe */}
      <line x1="6" y1="20" x2="40" y2="20" stroke="#fef08a" strokeWidth="1" strokeDasharray="2 1" />
    </g>
  </svg>
);

export const DairyBreadEggsArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Amul Milk Pouch */}
    <g transform="translate(14, 18)">
      <path d="M4 12 C10 10 26 10 32 12 L34 64 C28 66 8 66 2 64 Z" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
      <rect x="6" y="24" width="24" height="26" rx="2" fill="#0284c7" />
      <text x="18" y="34" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">Amul</text>
      <text x="18" y="43" textAnchor="middle" fill="#fef08a" fontSize="6" fontWeight="800">Taaza</text>
      {/* Amul baby girl hint */}
      <circle cx="18" cy="56" r="3" fill="#ef4444" />
    </g>
    {/* Harvest Gold Bread Pack */}
    <g transform="translate(52, 10)">
      <rect x="0" y="16" width="48" height="60" rx="6" fill="#f97316" />
      {/* Bread slices pattern inside clear center */}
      <rect x="6" y="28" width="36" height="38" rx="4" fill="#fef3c7" stroke="#ea580c" strokeWidth="1" />
      <circle cx="24" cy="46" r="11" fill="#f59e0b" opacity="0.3" />
      <text x="24" y="24" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">HARVEST</text>
      <text x="24" y="43" textAnchor="middle" fill="#7c2d12" fontSize="5.5" fontWeight="900">SANDWICH</text>
      <text x="24" y="50" textAnchor="middle" fill="#c2410c" fontSize="4.5" fontWeight="800">BREAD</text>
      {/* Bread top twist tie */}
      <path d="M18 16 C20 4 28 4 30 16 Z" fill="#dc2626" />
      <rect x="18" y="14" width="12" height="4" rx="1" fill="#fef08a" />
    </g>
  </svg>
);

export const FruitsVegArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Bunch of Bananas */}
    <g transform="translate(10, 16)">
      <path d="M22 6 C10 18 6 42 20 62 C26 44 26 26 22 6 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
      <path d="M30 6 C20 22 18 46 32 64 C36 46 36 28 30 6 Z" fill="#fde047" stroke="#eab308" strokeWidth="1" />
      <path d="M36 10 C28 26 28 48 40 60 C44 44 42 26 36 10 Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
      {/* Banana crown stem */}
      <rect x="20" y="4" width="16" height="6" rx="2" fill="#4d7c0f" />
    </g>
    {/* Crisp Green Spinach Bundle */}
    <g transform="translate(56, 12)">
      <path d="M22 65 L22 74" stroke="#15803d" strokeWidth="6" strokeLinecap="round" />
      <path d="M20 70 L26 70" stroke="#facc15" strokeWidth="3" />
      {/* Spinach Leaves */}
      <path d="M8 44 C0 24 16 10 26 26 C36 12 50 24 44 46 C50 56 34 66 24 64 C12 66 4 56 8 44 Z" fill="#16a34a" />
      <path d="M14 42 C10 28 22 18 26 30 C34 20 44 28 38 46 C42 54 30 60 24 58 C16 60 12 52 14 42 Z" fill="#22c55e" />
      <path d="M24 60 Q25 40 26 24" stroke="#86efac" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

export const ColdDrinksJuiceArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Real Juice Pack */}
    <g transform="translate(18, 18)">
      <rect x="0" y="10" width="34" height="58" rx="3" fill="#f97316" />
      <rect x="0" y="10" width="34" height="14" rx="2" fill="#ea580c" />
      <text x="17" y="20" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">Réal</text>
      <circle cx="17" cy="40" r="10" fill="#fde047" />
      <text x="17" y="41" textAnchor="middle" fill="#c2410c" fontSize="4.5" fontWeight="900">MANGO</text>
      <circle cx="17" cy="6" r="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
    </g>
    {/* Pepsi Bottle */}
    <g transform="translate(60, 10)">
      <path d="M14 14 C12 24 8 36 8 68 C8 74 26 74 26 68 C26 36 22 24 20 14 Z" fill="#1e3a8a" />
      {/* Bottle neck & cap */}
      <rect x="14" y="4" width="6" height="10" fill="#2563eb" />
      <rect x="13" y="1" width="8" height="4" rx="1" fill="#0284c7" />
      {/* Pepsi Globe Logo */}
      <circle cx="17" cy="46" r="8" fill="#ffffff" />
      <path d="M9 46 A8 8 0 0 1 25 46 Z" fill="#dc2626" />
      <path d="M9 46 A8 8 0 0 0 25 46 Z" fill="#2563eb" />
      <path d="M9 46 Q17 48 25 46" stroke="#ffffff" strokeWidth="2" fill="none" />
      <text x="17" y="60" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900">pepsi</text>
    </g>
  </svg>
);

export const SnacksMunchiesArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Haldiram Bhujia Sev pack */}
    <g transform="translate(12, 18)">
      <rect x="0" y="4" width="34" height="60" rx="3" fill="#ea580c" />
      <rect x="3" y="14" width="28" height="26" fill="#fef08a" rx="2" />
      <text x="17" y="10" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900">Haldiram's</text>
      <text x="17" y="26" textAnchor="middle" fill="#9a3412" fontSize="6" fontWeight="900">BHUJIA</text>
      <text x="17" y="34" textAnchor="middle" fill="#c2410c" fontSize="4.5" fontWeight="800">SEV</text>
      {/* Sev sprinkle hints */}
      <circle cx="10" cy="52" r="1.5" fill="#fef08a" />
      <circle cx="18" cy="50" r="1.5" fill="#fef08a" />
      <circle cx="24" cy="54" r="1.5" fill="#fef08a" />
    </g>
    {/* Lay's Magic Masala Blue Bag */}
    <g transform="translate(50, 10)">
      <path d="M4 8 Q26 2 48 8 L44 72 Q26 76 6 72 Z" fill="#1d4ed8" />
      {/* Yellow sunburst logo */}
      <circle cx="26" cy="34" r="14" fill="#facc15" stroke="#ef4444" strokeWidth="2" />
      <rect x="12" y="31" width="28" height="7" rx="2" fill="#dc2626" />
      <text x="26" y="36.5" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900" fontStyle="italic">Lay's</text>
      <text x="26" y="53" textAnchor="middle" fill="#fde047" fontSize="4" fontWeight="800">India's Magic</text>
      <text x="26" y="58" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900">MASALA</text>
    </g>
  </svg>
);

export const BreakfastInstantFoodArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Maggi 2-Minute Noodles pack */}
    <g transform="translate(12, 22)">
      <rect x="0" y="0" width="40" height="56" rx="4" fill="#facc15" stroke="#eab308" strokeWidth="1" />
      <rect x="6" y="6" width="28" height="15" rx="3" fill="#dc2626" />
      <text x="20" y="16" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="900" fontStyle="italic">Maggi</text>
      <rect x="8" y="24" width="24" height="6" rx="1.5" fill="#2563eb" />
      <text x="20" y="28.5" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="900">2-MINUTE</text>
      <circle cx="20" cy="42" r="9" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
    </g>
    {/* Kellogg's Corn Flakes red box */}
    <g transform="translate(54, 8)">
      <rect x="0" y="0" width="46" height="72" rx="3" fill="#dc2626" />
      <text x="23" y="16" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontStyle="italic">Kellogg's</text>
      <rect x="4" y="22" width="38" height="42" rx="2" fill="#ffffff" />
      <text x="23" y="34" textAnchor="middle" fill="#16a34a" fontSize="6.5" fontWeight="900">CORN</text>
      <text x="23" y="42" textAnchor="middle" fill="#ca8a04" fontSize="5.5" fontWeight="800">FLAKES</text>
      <circle cx="23" cy="53" r="8" fill="#fde047" />
    </g>
  </svg>
);

export const SweetToothArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Kwality Wall's Ice Cream Tub */}
    <g transform="translate(14, 20)">
      <path d="M2 14 L36 14 L32 54 L6 54 Z" fill="#0284c7" />
      <ellipse cx="19" cy="14" rx="17" ry="5" fill="#38bdf8" />
      <ellipse cx="19" cy="54" rx="13" ry="4" fill="#0369a1" />
      <circle cx="19" cy="28" r="7" fill="#ef4444" />
      <text x="19" y="44" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="900">VANILLA</text>
    </g>
    {/* Cadbury Silk Chocolate Bar */}
    <g transform="translate(56, 10)">
      <rect x="0" y="0" width="40" height="72" rx="4" fill="#4a154b" />
      <rect x="3" y="3" width="34" height="66" rx="2" fill="#5b1f63" />
      <text x="20" y="18" textAnchor="middle" fill="#facc15" fontSize="5" fontWeight="900" fontStyle="italic">Cadbury</text>
      <text x="20" y="28" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">Dairy Milk</text>
      {/* Silk curved golden ribbon */}
      <path d="M6 46 Q20 36 34 46" stroke="#facc15" strokeWidth="3" fill="none" />
      <text x="20" y="44" textAnchor="middle" fill="#facc15" fontSize="8" fontWeight="900" fontStyle="italic">Silk</text>
    </g>
  </svg>
);

export const BakeryBiscuitsArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Sunfeast Farmlite Pack */}
    <g transform="translate(14, 22)">
      <rect x="0" y="0" width="36" height="56" rx="3" fill="#ea580c" />
      <text x="18" y="14" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="900">Sunfeast</text>
      <rect x="4" y="18" width="28" height="24" rx="2" fill="#fef08a" />
      <text x="18" y="28" textAnchor="middle" fill="#9a3412" fontSize="5" fontWeight="900">Farmlite</text>
      <text x="18" y="36" textAnchor="middle" fill="#c2410c" fontSize="4" fontWeight="800">OATS</text>
    </g>
    {/* Oreo Biscuit Roll */}
    <g transform="translate(56, 12)">
      <rect x="0" y="0" width="38" height="68" rx="6" fill="#0284c7" />
      <rect x="0" y="20" width="38" height="24" fill="#0369a1" />
      <ellipse cx="19" cy="32" rx="14" ry="7" fill="#18181b" />
      <ellipse cx="19" cy="30" rx="14" ry="7" fill="#ffffff" />
      <ellipse cx="19" cy="28" rx="14" ry="7" fill="#18181b" />
      <text x="19" y="52" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontStyle="italic">OREO</text>
    </g>
  </svg>
);

export const TeaCoffeeArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Bournvita brown jar */}
    <g transform="translate(14, 20)">
      <path d="M4 14 L30 14 L28 56 L6 56 Z" fill="#7c2d12" />
      <rect x="8" y="6" width="18" height="8" rx="2" fill="#dc2626" />
      <text x="17" y="28" textAnchor="middle" fill="#facc15" fontSize="4.5" fontWeight="900">Bourn</text>
      <text x="17" y="36" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">Vita</text>
    </g>
    {/* Tata Tea Premium Pack */}
    <g transform="translate(48, 10)">
      <rect x="0" y="0" width="50" height="70" rx="4" fill="#15803d" />
      <rect x="4" y="4" width="42" height="22" rx="2" fill="#166534" />
      <text x="25" y="14" textAnchor="middle" fill="#fef08a" fontSize="5.5" fontWeight="900">TATA TEA</text>
      <text x="25" y="22" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="800">PREMIUM</text>
      {/* Chai cup graphic */}
      <circle cx="25" cy="46" r="12" fill="#ca8a04" stroke="#facc15" strokeWidth="1" />
      <path d="M19 46 Q25 40 31 46" stroke="#ffffff" strokeWidth="1.5" fill="none" />
    </g>
  </svg>
);

export const AttaRiceDalArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Green Dal Pouch */}
    <g transform="translate(10, 22)">
      <rect x="0" y="0" width="34" height="54" rx="3" fill="#65a30d" />
      <rect x="4" y="14" width="26" height="24" rx="2" fill="#fef08a" />
      <text x="17" y="26" textAnchor="middle" fill="#3f6212" fontSize="5" fontWeight="900">RAJMA</text>
      <text x="17" y="33" textAnchor="middle" fill="#4d7c0f" fontSize="4" fontWeight="800">DAL</text>
    </g>
    {/* Aashirvaad Atta Bag */}
    <g transform="translate(48, 8)">
      <rect x="0" y="0" width="52" height="72" rx="4" fill="#b91c1c" />
      <rect x="4" y="18" width="44" height="42" rx="3" fill="#fef3c7" />
      <text x="26" y="14" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">AASHIRVAAD</text>
      <text x="26" y="36" textAnchor="middle" fill="#991b1b" fontSize="7" fontWeight="900">ATTA</text>
      <text x="26" y="46" textAnchor="middle" fill="#b45309" fontSize="4.5" fontWeight="700">Shudh Chakki</text>
    </g>
  </svg>
);

export const MasalaOilArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Fortune Oil Bottle */}
    <g transform="translate(14, 18)">
      <path d="M8 12 L24 12 L22 60 L10 60 Z" fill="#eab308" />
      <rect x="12" y="4" width="8" height="8" rx="2" fill="#ca8a04" />
      <rect x="8" y="24" width="16" height="20" rx="1" fill="#dc2626" />
      <text x="16" y="36" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="900">fortune</text>
    </g>
    {/* Everest Tikhalal Red Box */}
    <g transform="translate(48, 10)">
      <rect x="0" y="0" width="50" height="70" rx="4" fill="#1e293b" />
      <rect x="4" y="4" width="42" height="20" rx="2" fill="#b91c1c" />
      <text x="25" y="12" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900">EVEREST</text>
      <text x="25" y="20" textAnchor="middle" fill="#fef08a" fontSize="5.5" fontWeight="900">Tikhalal</text>
      {/* Red Chilli powder pyramid */}
      <path d="M10 58 L25 32 L40 58 Z" fill="#dc2626" />
    </g>
  </svg>
);

export const SaucesSpreadsArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Nutella Jar */}
    <g transform="translate(12, 20)">
      <path d="M4 14 L32 14 L30 54 L6 54 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="6" y="6" width="24" height="8" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="6" y="22" width="24" height="18" rx="1" fill="#ffffff" />
      <text x="18" y="32" textAnchor="middle" fill="#18181b" fontSize="5.5" fontWeight="900">nutella</text>
      <path d="M6 40 L30 40 L29 52 L7 52 Z" fill="#451a03" />
    </g>
    {/* Kissan Tomato Ketchup Pouch */}
    <g transform="translate(52, 10)">
      <path d="M6 14 C16 10 32 10 42 14 L40 68 C30 72 18 72 8 68 Z" fill="#dc2626" />
      <rect x="20" y="4" width="8" height="8" rx="2" fill="#16a34a" />
      <circle cx="24" cy="38" r="12" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
      <text x="24" y="30" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900" fontStyle="italic">Kissan</text>
      <text x="24" y="42" textAnchor="middle" fill="#fef08a" fontSize="4.5" fontWeight="800">FRESH</text>
      <text x="24" y="48" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="800">TOMATO</text>
    </g>
  </svg>
);

export const ChickenMeatFishArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Fresh Fish */}
    <g transform="translate(10, 16)">
      <path d="M12 4 C18 16 18 42 12 56 C6 42 6 16 12 4 Z" fill="#94a3b8" />
      <path d="M12 4 L6 -4 L18 -4 Z" fill="#64748b" />
      <circle cx="12" cy="14" r="2" fill="#0f172a" />
    </g>
    {/* Raw Chicken Fillets on cutting board */}
    <g transform="translate(38, 12)">
      <rect x="0" y="0" width="56" height="72" rx="6" fill="#78350f" opacity="0.8" />
      <rect x="2" y="2" width="52" height="68" rx="5" fill="#92400e" opacity="0.6" />
      {/* Chicken breasts */}
      <path d="M12 24 C10 14 36 10 40 22 C44 32 32 40 20 38 C12 36 8 30 12 24 Z" fill="#fecdd3" stroke="#fda4af" strokeWidth="1" />
      <path d="M14 44 C12 34 38 30 42 42 C46 52 34 60 22 58 C14 56 10 50 14 44 Z" fill="#fda4af" stroke="#fb7185" strokeWidth="1" />
    </g>
  </svg>
);

export const OrganicHealthyArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Jaggery pack */}
    <g transform="translate(14, 22)">
      <rect x="0" y="0" width="32" height="52" rx="3" fill="#b45309" />
      <text x="16" y="20" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900">ORGANIC</text>
      <text x="16" y="28" textAnchor="middle" fill="#fde047" fontSize="5" fontWeight="900">JAGGERY</text>
    </g>
    {/* Organic Tattva Brown Sugar */}
    <g transform="translate(50, 10)">
      <rect x="0" y="0" width="48" height="70" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
      <text x="24" y="20" textAnchor="middle" fill="#78350f" fontSize="5.5" fontWeight="900">organic</text>
      <text x="24" y="28" textAnchor="middle" fill="#92400e" fontSize="5" fontWeight="900">tattva</text>
      {/* Purple dotted mandala cluster */}
      <circle cx="24" cy="46" r="10" fill="#7e22ce" opacity="0.7" />
      <text x="24" y="64" textAnchor="middle" fill="#78350f" fontSize="4.5" fontWeight="700">Brown Sugar</text>
    </g>
  </svg>
);

export const BabyCareArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Feeding Bottle */}
    <g transform="translate(16, 16)">
      <rect x="4" y="20" width="18" height="42" rx="4" fill="#fce7f3" stroke="#f472b6" strokeWidth="1" />
      <rect x="5" y="14" width="16" height="6" rx="1" fill="#ec4899" />
      <path d="M9 14 C9 6 17 6 17 14 Z" fill="#fbcfe8" />
      <line x1="8" y1="28" x2="14" y2="28" stroke="#f472b6" strokeWidth="1" />
      <line x1="8" y1="36" x2="14" y2="36" stroke="#f472b6" strokeWidth="1" />
      <line x1="8" y1="44" x2="14" y2="44" stroke="#f472b6" strokeWidth="1" />
    </g>
    {/* Pampers Diaper Pack */}
    <g transform="translate(46, 10)">
      <rect x="0" y="0" width="50" height="70" rx="4" fill="#0d9488" />
      <circle cx="38" cy="14" r="8" fill="#ef4444" />
      <text x="38" y="16" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="900">air</text>
      <text x="25" y="32" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">Pampers.</text>
      <text x="25" y="42" textAnchor="middle" fill="#fef08a" fontSize="5" fontWeight="800">pants</text>
      <rect x="6" y="52" width="14" height="12" rx="2" fill="#ffffff" />
      <text x="13" y="60" textAnchor="middle" fill="#0d9488" fontSize="6" fontWeight="900">XL</text>
    </g>
  </svg>
);

export const PharmaWellnessArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Durex Air pack */}
    <g transform="translate(14, 20)">
      <rect x="0" y="0" width="38" height="56" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
      <rect x="4" y="6" width="30" height="14" rx="2" fill="#2563eb" />
      <text x="19" y="16" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="900">durex</text>
      <text x="19" y="38" textAnchor="middle" fill="#1e3a8a" fontSize="9" fontWeight="900">AiR</text>
    </g>
    {/* Dabur Honitus bottle */}
    <g transform="translate(56, 10)">
      <path d="M6 16 L28 16 L26 66 L8 66 Z" fill="#991b1b" />
      <rect x="12" y="4" width="10" height="12" rx="2" fill="#dc2626" />
      <rect x="8" y="26" width="18" height="24" rx="1" fill="#fef08a" />
      <text x="17" y="34" textAnchor="middle" fill="#991b1b" fontSize="4" fontWeight="900">Dabur</text>
      <text x="17" y="42" textAnchor="middle" fill="#b91c1c" fontSize="5" fontWeight="900">Honitus</text>
    </g>
  </svg>
);

export const CleaningEssentialsArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Harpic bottle */}
    <g transform="translate(12, 16)">
      <path d="M12 2 C8 2 4 10 4 20 L4 58 L20 58 L20 20 C20 12 16 2 12 2 Z" fill="#1d4ed8" />
      <rect x="8" y="0" width="8" height="6" rx="1" fill="#dc2626" />
      <rect x="6" y="26" width="12" height="18" fill="#dc2626" rx="1" />
      <text x="12" y="38" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900">HARPIC</text>
    </g>
    {/* Surf Excel Matic Liquid Pouch */}
    <g transform="translate(42, 8)">
      <path d="M8 12 C18 8 36 8 46 12 L42 70 C30 74 20 74 12 70 Z" fill="#1e3a8a" />
      <rect x="22" y="2" width="10" height="8" rx="2" fill="#84cc16" />
      <text x="27" y="22" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="800">TOP LOAD</text>
      {/* Matic multi-color starburst */}
      <circle cx="27" cy="42" r="12" fill="#ffffff" />
      <circle cx="27" cy="42" r="9" fill="#2563eb" />
      <text x="27" y="40" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900">Surf</text>
      <text x="27" y="46" textAnchor="middle" fill="#facc15" fontSize="4" fontWeight="800">excel</text>
      <text x="27" y="58" textAnchor="middle" fill="#84cc16" fontSize="4.5" fontWeight="900">MATIC</text>
    </g>
  </svg>
);

export const HomeOfficeArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Fevistik Yellow Glue */}
    <g transform="translate(18, 20)">
      <rect x="0" y="10" width="18" height="46" rx="2" fill="#facc15" />
      <rect x="0" y="2" width="18" height="10" rx="2" fill="#dc2626" />
      <text x="9" y="26" textAnchor="middle" fill="#1e293b" fontSize="4.5" fontWeight="900">fevi</text>
      <text x="9" y="34" textAnchor="middle" fill="#dc2626" fontSize="4.5" fontWeight="900">stik.</text>
    </g>
    {/* Odonil Room Freshener Spray */}
    <g transform="translate(48, 10)">
      <rect x="0" y="14" width="28" height="60" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
      <rect x="4" y="4" width="20" height="12" rx="3" fill="#e879f9" />
      <text x="14" y="30" textAnchor="middle" fill="#6b21a8" fontSize="6.5" fontWeight="900">Odonil</text>
      <text x="14" y="38" textAnchor="middle" fill="#9333ea" fontSize="4" fontWeight="700">ROOM SPRAY</text>
      <circle cx="14" cy="52" r="7" fill="#f472b6" opacity="0.6" />
      <text x="14" y="66" textAnchor="middle" fill="#6b21a8" fontSize="3.5" fontWeight="800">Lavender</text>
    </g>
  </svg>
);

export const PersonalCareArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Head & Shoulders bottle */}
    <g transform="translate(10, 18)">
      <path d="M4 14 C10 10 24 10 30 14 L28 58 L6 58 Z" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
      <path d="M6 14 C10 2 24 2 28 14 Z" fill="#1d4ed8" />
      <text x="17" y="32" textAnchor="middle" fill="#1d4ed8" fontSize="4" fontWeight="900">head&amp;</text>
      <text x="17" y="38" textAnchor="middle" fill="#1d4ed8" fontSize="3.5" fontWeight="900">shoulders</text>
    </g>
    {/* Whisper Sanitary Pads green pack */}
    <g transform="translate(46, 10)">
      <rect x="0" y="0" width="46" height="70" rx="5" fill="#16a34a" />
      <text x="23" y="24" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontStyle="italic">whisper</text>
      <rect x="4" y="30" width="38" height="24" rx="3" fill="#15803d" />
      <text x="23" y="44" textAnchor="middle" fill="#fef08a" fontSize="5" fontWeight="800">ULTRA CLEAN</text>
      <circle cx="36" cy="12" r="4" fill="#ffffff" opacity="0.8" />
    </g>
  </svg>
);

export const PetCareArt: React.FC = () => (
  <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-sm" fill="none">
    {/* Whiskas Cat Food Purple Pouch */}
    <g transform="translate(10, 20)">
      <rect x="0" y="0" width="32" height="54" rx="3" fill="#6b21a8" />
      <text x="16" y="14" textAnchor="middle" fill="#ffffff" fontSize="4.5" fontWeight="900">whiskas</text>
      <circle cx="16" cy="30" r="8" fill="#fef08a" />
      {/* Cat silhouette */}
      <path d="M12 34 L12 28 L14 26 L18 26 L20 28 L20 34 Z" fill="#3b0764" />
      <text x="16" y="46" textAnchor="middle" fill="#ffffff" fontSize="4" fontWeight="800">1+ Years</text>
    </g>
    {/* Pedigree Dog Food Yellow Bag */}
    <g transform="translate(46, 8)">
      <rect x="0" y="0" width="50" height="72" rx="4" fill="#facc15" />
      <rect x="6" y="6" width="38" height="14" rx="2" fill="#dc2626" />
      <text x="25" y="16" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">Pedigree</text>
      <text x="25" y="28" textAnchor="middle" fill="#78350f" fontSize="4.5" fontWeight="900">ADULT</text>
      {/* Dog photo silhouette */}
      <circle cx="25" cy="46" r="13" fill="#d97706" />
      <circle cx="25" cy="44" r="10" fill="#fef3c7" />
      <circle cx="22" cy="42" r="1.5" fill="#1e293b" />
      <circle cx="28" cy="42" r="1.5" fill="#1e293b" />
      <ellipse cx="25" cy="48" rx="3" ry="2" fill="#1e293b" />
    </g>
  </svg>
);
