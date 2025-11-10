import React, { FC, memo, useEffect, useRef, useState } from 'react';

import { Box, Html, Sphere, useGLTF } from '@react-three/drei';
import { CylinderCollider, RigidBody, RapierRigidBody } from '@react-three/rapier';
import Plinko from './Plinko';
import { Mesh, Vector3 } from 'three';
import { useControls, button } from 'leva';
import { useResetOrbitControls } from '../../hooks/use-reset-orbit-controls';
import DraggableRigidBody from '../../components/DraggableRigidBody';

const colors = ['red', 'green', 'blue', 'yellow', 'orange', 'purple'];
const randomColor = () => colors[Math.floor(Math.random() * colors.length)];
const useRandomColor = () => {
  const [color] = useState(randomColor());
  return color;
};

const Label = ({ label }: { label: string }) => {
  return (
    <Html>
      <div
        style={{
          position: 'absolute',
          background: '#fff',
          border: '2px solid #000',
          padding: 8,
          transform: 'translate(100%, -100%)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            width: 0,
            height: 40,
            top: 'calc(100% - 5px)',
            left: -16,
            borderLeft: '2px solid black',
            transform: 'rotate(45deg)',
          }}
        ></span>
        {label}
      </div>
    </Html>
  );
};

const RigidBox = memo(() => {
  const color = useRandomColor();

  return (
    <DraggableRigidBody
      rigidBodyProps={{
        colliders: 'cuboid',
        position: [-4 + Math.random() * 8, 10, 0],
      }}
      dragControlsProps={{ preventOverlap: true }}
      visibleMesh={
        <Box scale={0.5} receiveShadow castShadow>
          <meshPhysicalMaterial color={color} />
        </Box>
      }
    />
  );
});

const RigidCylinder = memo(() => {
  const color = useRandomColor();

  return (
    <DraggableRigidBody
      rigidBodyProps={{
        colliders: false,
        position: [-4 + Math.random() * 8, 10, 0],
      }}
      dragControlsProps={{ preventOverlap: true }}
      visibleMesh={
        <mesh castShadow receiveShadow scale={1}>
          <cylinderGeometry args={[0.4, 0.4, 0.4, 16]} />
          <meshPhysicalMaterial color={color} />
        </mesh>
      }
    />
  );
});

const RigidBall = memo(() => {
  const color = useRandomColor();

  return (
    <DraggableRigidBody
      rigidBodyProps={{
        colliders: 'ball',
        position: new Vector3(-4 + Math.random() * 8, 10, 0),
        scale: 1,
      }}
      dragControlsProps={{ preventOverlap: true }}
      visibleMesh={
        <Sphere scale={0.2} castShadow receiveShadow>
          <meshPhysicalMaterial color={color} />
        </Sphere>
      }
    />
  );
});

useGLTF.preload(new URL('../../models/objects.glb', import.meta.url).toString());

const HullPear = memo(() => {
  const { nodes } = useGLTF(
    new URL('../../models/objects.glb', import.meta.url).toString()
  ) as unknown as {
    nodes: {
      pear: Mesh;
    };
  };

  return (
    <DraggableRigidBody
      rigidBodyProps={{
        colliders: 'hull',
        position: [-4 + Math.random() * 8, 10, 0],
      }}
      dragControlsProps={{ preventOverlap: true }}
      visibleMesh={
        <mesh
          scale={0.5}
          castShadow
          receiveShadow
          geometry={nodes.pear.geometry}
          material={nodes.pear.material}
        />
      }
    />
  );
});

const MeshBoat = memo(() => {
  const { nodes } = useGLTF(
    new URL('../../models/objects.glb', import.meta.url).toString()
  ) as unknown as {
    nodes: {
      boat: Mesh;
    };
  };

  return (
    <DraggableRigidBody
      groupProps={{ scale: 0.3 }}
      rigidBodyProps={{
        colliders: 'hull',
        position: [-4 + Math.random() * 8, 10, 0],
      }}
      dragControlsProps={{ preventOverlap: true }}
      visibleMesh={
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.boat.geometry}
          material={nodes.boat.material}
          rotation={[0, 0, Math.PI / 2]}
        />
      }
    />
  );
});

const itemMap: Record<string, FC> = {
  box: RigidBox,
  cylinder: RigidCylinder,
  ball: RigidBall,
  convexHull: HullPear,
  convexMesh: MeshBoat,
};

const randomItem = () => {
  const keys = Object.keys(itemMap);
  return keys[Math.floor(Math.random() * keys.length)];
};

const Thing = ({ item }: { item: string }) => {
  const Thang = itemMap[item];
  return <Thang />;
};

const Scene: FC = () => {
  const [items, setItems] = useState<string[]>([]);

  useControls({
    box: button(() => addItem('box')),
    cylinder: button(() => addItem('cylinder')),
    ball: button(() => addItem('ball')),
    convexHull: button(() => addItem('convexHull')),
    convexMesh: button(() => addItem('convexMesh')),
  });

  useEffect(() => {
    let ticker = 0;
    const interval = setInterval(() => {
      ticker++;
      addItem(randomItem());

      if (ticker > 50) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const addItem = (str: string) => {
    setItems((curr) => [...curr, str]);
  };

  return (
    <group scale={1}>
      {items.map((item, i) => (
        <Thing item={item} key={i} />
      ))}

      <Plinko />
    </group>
  );
};

export default Scene;
