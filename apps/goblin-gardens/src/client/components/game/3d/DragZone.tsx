import { CanvasText } from './CanvasText';

export function DragZone({ action = 'my-offer' }: { action?: 'grow' | 'appraise' | 'my-offer' }) {
  const rotationY = 5.5;

  // Determine colors based on action
  const backgroundColor =
    action === 'grow'
      ? '#1a3a2a' // Dark green
      : action === 'appraise'
        ? '#3a2a1a' // Dark gold/brown
        : '#1a2a3a'; // Dark cyan (default)

  const textColor =
    action === 'grow'
      ? '#50C878' // Green
      : action === 'appraise'
        ? '#FFD700' // Gold
        : '#88ccff'; // Cyan (default)

  const borderColor =
    action === 'grow'
      ? '#2a5a3a' // Medium green
      : action === 'appraise'
        ? '#5a4a2a' // Medium gold/brown
        : '#3a5a7a'; // Medium cyan (default)

  const displayText = action === 'grow' ? 'Grow' : action === 'appraise' ? 'Appraise' : 'My Offer';

  return (
    <group rotation={[0, rotationY, 0]} position={[-0.39, -0.01, 0.4]}>
      {/* Dark textured floor area - garden themed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.5, 0.75]} />
        <meshStandardMaterial
          color={backgroundColor}
          roughness={0.9}
          metalness={0.2}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Dynamic text based on action */}
      <CanvasText
        position={[0, 0.01, -0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color={textColor}
        anchorX="center"
        anchorY="middle"
      >
        {displayText}
      </CanvasText>

      {/* Rotation value display */}
      {/*
      <CanvasText
        position={[0, 0.01, -0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.1}
        color="#ffff00"
        anchorX="center"
        anchorY="middle"
      >
        {rotationY.toFixed(3)}
      </CanvasText>
      */}

      {/* Border lines for visual definition */}
      <mesh position={[0, 0.01, 0.375]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 0.02]} />
        <meshBasicMaterial color={borderColor} />
      </mesh>
      <mesh position={[0, 0.01, -0.375]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 0.02]} />
        <meshBasicMaterial color={borderColor} />
      </mesh>
    </group>
  );
}
