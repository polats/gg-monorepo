import { Line } from '@react-three/drei';
import { CanvasText } from './CanvasText';
import type { FaucetConfig } from '../../../types/game';

export function DebugAxes() {
  return (
    <group position={[0, 0.005, 0]}>
      {/* X Axis - Red - Left/Right */}
      <Line
        points={[
          [-1, 0, 0],
          [1, 0, 0],
        ]}
        color="red"
        lineWidth={3}
      />
      <CanvasText
        position={[1.1, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.1}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        +X
      </CanvasText>

      {/* Y Axis - Green - Up/Down */}
      <Line
        points={[
          [0, 0, 0],
          [0, 0.5, 0],
        ]}
        color="green"
        lineWidth={3}
      />
      <CanvasText
        position={[0, 0.6, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.1}
        color="green"
        anchorX="center"
        anchorY="middle"
      >
        +Y
      </CanvasText>

      {/* Z Axis - Blue - Forward/Back (toward/away from camera) */}
      <Line
        points={[
          [0, 0, -1],
          [0, 0, 1],
        ]}
        color="blue"
        lineWidth={3}
      />
      <CanvasText
        position={[0, 0, 1.1]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.1}
        color="blue"
        anchorX="center"
        anchorY="middle"
      >
        +Z
      </CanvasText>

      {/* Origin marker */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </group>
  );
}

export function FaucetIndicator({ config }: { config: FaucetConfig }) {
  if (!config.enabled) return null;

  return (
    <group position={config.position}>
      {/* Spawn point indicator */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.05]} />
        <meshBasicMaterial color="#4caf50" />
      </mesh>
      {/* Spawn radius ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[config.spawnRadius * 0.9, config.spawnRadius, 32]} />
        <meshBasicMaterial color="#4caf50" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
