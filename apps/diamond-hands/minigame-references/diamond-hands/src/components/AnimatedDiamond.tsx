import { useState, useEffect } from 'react';
import diamondFrame1 from 'figma:asset/a873c9fb942c6e4d973274b08ebacd928c30e2f2.png';
import diamondFrame2 from 'figma:asset/7cd2293e09cb3628644b1b7bad3b13c62e01de53.png';
import diamondFrame3 from 'figma:asset/a6430ecef6ab48a8e9ab97d5eeccfff31dd78ae0.png';
import diamondFrame4 from 'figma:asset/619faeae7c94e1ab4028acd317168b6ce717466d.png';

interface AnimatedDiamondProps {
  className?: string;
  alt?: string;
  animationSpeed?: number; // Duration per frame in milliseconds
}

const diamondFrames = [
  diamondFrame1,
  diamondFrame2,
  diamondFrame3,
  diamondFrame4
];

export function AnimatedDiamond({ 
  className = "w-full h-full object-contain", 
  alt = "Diamond",
  animationSpeed = 800 
}: AnimatedDiamondProps) {
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % diamondFrames.length);
    }, animationSpeed);

    return () => clearInterval(interval);
  }, [animationSpeed]);

  return (
    <div className={`relative ${className}`}>
      {/* Base image to establish container size */}
      <img
        src={diamondFrames[0]}
        alt={alt}
        className="w-full h-full object-contain opacity-0"
      />
      
      {/* Animated overlay images */}
      {diamondFrames.map((frame, index) => (
        <img
          key={index}
          src={frame}
          alt={alt}
          className="absolute inset-0 w-full h-full object-contain transition-opacity duration-300"
          style={{
            opacity: index === currentFrame ? 1 : 0,
          }}
        />
      ))}
    </div>
  );
}