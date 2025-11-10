import { RigidBody, CuboidCollider } from '@react-three/rapier';

export function ShadowPlane({ isGarden = false }: { isGarden?: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, isGarden ? -0.03 : 0, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      {isGarden ? (
        <meshStandardMaterial
          color="#2a4a5a"
          roughness={0.7}
          metalness={0.2}
          opacity={0.95}
          transparent
          onBeforeCompile={(shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <output_fragment>',
              `
                #include <output_fragment>
                // Darken towards bottom (positive Z in world space = bottom of screen)
                float gradientFactor = smoothstep(-5.0, 5.0, vUv.y * 10.0 - 5.0);
                gl_FragColor.rgb *= mix(0.3, 1.0, gradientFactor);
              `
            );
          }}
        />
      ) : (
        <shadowMaterial color={0x0a0806} opacity={0.9} />
      )}
    </mesh>
  );
}

export function FloorCollider({ isGarden = false }: { isGarden?: boolean }) {
  const yOffset = isGarden ? -0.03 : 0;
  return (
    <RigidBody type="fixed" position={[0, -2.5 + yOffset, 0]}>
      <CuboidCollider args={[5, 2.5, 5]} />
      <mesh visible={false}>
        <boxGeometry args={[10, 5, 10]} />
      </mesh>
    </RigidBody>
  );
}
