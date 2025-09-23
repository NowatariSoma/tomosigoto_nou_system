export function LoginBackground() {
  return (
    <>
      {/* Dark purple gradient background - exactly matching specification */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #12100D 0%, #47475C 50%, #5C5C7D 75%, #0D0D12 100%)'
      }}></div>
      
      {/* Two ultra-thin curved light streaks from Figma */}
      <svg 
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1920 1080"
      >
        <defs>
          {/* Filter for Line 1 - matching Figma */}
          <filter id="line1-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="29.2" />
          </filter>
          
          {/* Filter for Line 2 - matching Figma */}
          <filter id="line2-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18.9" />
          </filter>
          
          {/* Gradient for Line 1 */}
          <linearGradient id="line1-gradient" x1="0%" y1="100%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#999999" stopOpacity="0.7"/>
            <stop offset="50%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="#999999" stopOpacity="0.7"/>
          </linearGradient>
          
          {/* Gradient for Line 2 */}
          <linearGradient id="line2-gradient" x1="0%" y1="100%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#999999" stopOpacity="0.7"/>
            <stop offset="50%" stopColor="white" stopOpacity="1"/>
            <stop offset="100%" stopColor="#999999" stopOpacity="0.7"/>
          </linearGradient>
        </defs>
        
        {/* Line 1 - exact path from Figma */}
        <g filter="url(#line1-blur)">
          <path 
            d="M58.5313 1109.2C71.7854 1074.95 93.7391 1043.91 118.642 1016.89C266.759 861.508 500.955 855.766 701.72 887.302C825.469 906.844 955.443 907.63 1076.2 866.461C1419.93 749.226 1508.51 348.889 1528.49 30.5707C1530.86 -7.34213 1532.22 -42.8101 1533 -81C1533 -81 1533 -81 1533 -81C1530.89 -42.8604 1528.26 -7.48903 1524.7 30.2719C1494.23 348.762 1399.05 736.806 1069.74 847.535C953.305 887.265 826.607 887.57 704.389 869.769C501.109 839.995 260.607 851.91 115.816 1014.35C91.5458 1042.45 70.539 1074.46 58.5313 1109.2Z"
            fill="url(#line1-gradient)"
            opacity="0.8"
            transform="scale(1) translate(350, -100)"
          />
        </g>
        
        {/* Line 2 - exact path from Figma */}
        <g opacity="0.6" filter="url(#line2-blur)">
          <path 
            d="M-176.853 655.025C-135.508 631.734 -94.7008 612.64 -50.5804 597.127C128.05 528.859 325.127 573.331 490.031 659.289C652.147 736.121 840.638 868.749 1028.8 772.706C1066.28 754.171 1097.79 727.218 1126 698.147C1269.07 541.714 1355.97 347.024 1505.62 202.812C1648.69 49.7267 1880.78 8.36394 2076.46 83.7076C2119.6 98.3015 2161.73 116.085 2204.67 137.138C2162.37 114.837 2120.71 95.7961 2077.79 79.9454C1884.3 -1.49992 1642.29 35.6421 1494.05 190.701C1339.71 335.74 1249.92 532.099 1110.91 683.545C1083.72 711.595 1053.81 737.003 1019.58 754.015C845.897 844.908 662.441 721.253 496.895 644.953C329.722 560.559 125.538 519.46 -51.9504 593.379C-95.8969 610.172 -136.213 630.526 -176.853 655.025Z"
            fill="url(#line2-gradient)"
            transform="scale(1) translate(50, 300)"
          />
        </g>
      </svg>
    </>
  );
}