import { useState, useEffect } from 'react';

interface AnimatedDiamondProps {
  className?: string;
  alt?: string;
  animationSpeed?: number; // Duration per frame in milliseconds
}

const diamondFrames = [
  '/minigame-assets/diamond-frame-1.png',
  '/minigame-assets/diamond-frame-2.png',
  '/minigame-assets/diamond-frame-3.png',
  '/minigame-assets/diamond-frame-4.png'
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