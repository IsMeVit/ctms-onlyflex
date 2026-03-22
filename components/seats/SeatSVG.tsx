'use client';

import React, { memo } from 'react';

interface SeatIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

const SEAT_PATH = "M460.058,207.774v-89.116C460.058,53.103,406.904,0,341.349,0H170.651C105.096,0,51.942,53.103,51.942,118.658v89.115 c-27.208,0.753-49.469,23.185-49.469,50.669v235.234c0,10.246,8.306,18.323,18.551,18.323H131.76 c10.245,0,19.12-8.077,19.12-18.322v-5.176h210.242v5.176c0,10.245,8.875,18.322,19.12,18.322h110.735 c10.245,0,18.551-8.077,18.551-18.322V258.444C509.527,230.959,487.266,208.527,460.058,207.774z M113.778,474.899H39.575V258.444 c0-7.502,6.103-13.574,13.604-13.574h46.426c7.501,0,14.173,6.072,14.173,13.574V474.899z M361.121,451.401H150.879v-92.754 h210.242V451.401z M361.121,258.444v35.894H150.879v-35.894c0-27.96-23.316-50.676-51.274-50.676H89.043v-89.11 c0-45.097,36.51-81.556,81.607-81.556h170.698c45.098,0,81.608,36.46,81.608,81.556v89.11h-10.562 C384.437,207.768,361.121,230.484,361.121,258.444z M472.425,474.899h-74.203V258.444c0-7.501,6.672-13.574,14.173-13.574h46.426 c7.501,0,13.604,6.072,13.604,13.574V474.899z";

export const SeatIcon = memo(function SeatIcon({
  size = 24,
  color = "currentColor",
  className,
  ...props
}: SeatIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path d={SEAT_PATH} />
    </svg>
  );
});

interface SeatSVGProps {
  color?: string;
  isSelected?: boolean;
  isBooked?: boolean;
  isBlocked?: boolean;
  size?: number;
  isTwinseat?: boolean;
}

export const SeatSVG = memo(function SeatSVG({
  color = '#3B82F6',
  isSelected = false,
  isBooked = false,
  isBlocked = false,
  size = 36,
  isTwinseat = false,
}: SeatSVGProps) {
  const getFillColor = () => {
    if (isBooked || isBlocked) {
      return '#6B7280'; // Gray for booked/blocked
    }
    return color;
  };

  const getStrokeColor = () => {
    if (isSelected) {
      return '#FFFFFF'; // White ring when selected
    }
    if (isBooked || isBlocked) {
      return '#4B5563';
    }
    return color;
  };

  const fillColor = getFillColor();
  const strokeColor = getStrokeColor();
  
  // Adjusted width for twinseat to fill its container
  const width = isTwinseat ? size * 2 : size;
  const height = size;

  return (
    <svg
      width={width}
      height={height}
      viewBox={isTwinseat ? "0 0 1024 512" : "0 0 512 512"}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={isSelected ? 'drop-shadow-lg' : ''}
    >
      <path
        d={SEAT_PATH}
        fill={fillColor}
        stroke={isSelected ? strokeColor : 'none'}
        strokeWidth={isSelected ? 20 : 0}
      />
      {isTwinseat && (
        <path
          d={SEAT_PATH}
          transform="translate(512, 0)"
          fill={fillColor}
          stroke={isSelected ? strokeColor : 'none'}
          strokeWidth={isSelected ? 20 : 0}
        />
      )}
    </svg>
  );
});
