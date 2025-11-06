import React, { useState } from "react";

import { Box, Clone, Sphere, useGLTF } from "@react-three/drei";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";
import { ThreeElements } from "@react-three/fiber";
import { Mesh } from "three";
import { Demo } from "../../DemoApp";
import { useResetOrbitControls } from "../../hooks/use-reset-orbit-controls";
import DraggableRigidBody from "../../components/DraggableRigidBody";

type GroupProps = ThreeElements["group"];

const Map = () => {
  const { nodes } = useGLTF(
    // @ts-ignore
    new URL("../../models/map.glb", import.meta.url).toString()
  ) as unknown as { nodes: { map: Mesh } };

  nodes.map.castShadow = true;
  nodes.map.receiveShadow = true;

  return (
    <group position={[0, -3, 0]} scale={0.2}>
      <RigidBody position={[0, -2, 0]}>
        <primitive object={nodes.map.clone(true)} position={[0, 0, 0]} />;
        <TrimeshCollider
          args={[
            nodes.map.geometry.attributes.position.array,
            nodes.map.geometry.index?.array || []
          ]}
        />
      </RigidBody>
    </group>
  );
};

const Pear = (props: GroupProps) => {
  const { nodes } = useGLTF(
    new URL("../../models/objects.glb", import.meta.url).toString()
  ) as unknown as {
    nodes: {
      pear: Mesh;
    };
  };

  return (
    <DraggableRigidBody
      groupProps={{ ...props, scale: 1 }}
      rigidBodyProps={{
        position: [0, 2, 0],
        colliders: "hull"
      }}
      dragControlsProps={{ preventOverlap: true }}
      visibleMesh={
        <mesh
          geometry={nodes.pear.geometry}
          material={nodes.pear.material}
          castShadow
          receiveShadow
        />
      }
    />
  );
};

const Ball = () => {
  const [colliding, setColliding] = useState(false);

  return (
    <DraggableRigidBody
      rigidBodyProps={{
        colliders: "ball",
        position: [5, 0, 0],
        onCollisionEnter: ({ manifold }) => {
          setColliding(true);
        },
        onCollisionExit: () => setColliding(false)
      }}
      dragControlsProps={{ preventOverlap: true }}
      visibleMesh={
        <Sphere castShadow>
          <meshPhysicalMaterial color={colliding ? "blue" : "green"} />
        </Sphere>
      }
    />
  );
};

const CompoundShape = () => {
  const [asleep, setAsleep] = useState(false);

  return (
    <DraggableRigidBody
      groupProps={{ scale: 1 }}
      rigidBodyProps={{
        colliders: "cuboid",
        onSleep: () => setAsleep(true)
      }}
      dragControlsProps={{ preventOverlap: true }}
      visibleMesh={
        <Box castShadow>
          <meshPhysicalMaterial color={asleep ? "red" : "white"} />
        </Box>
      }
    />
  );
};

export const ComponentsExample: Demo = () => {
  useResetOrbitControls();

  return (
    <group>
      <CompoundShape />
      <Pear />
      <Ball />
      <Map />
    </group>
  );
};
