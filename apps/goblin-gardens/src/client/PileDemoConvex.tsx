import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, CuboidCollider, RigidBody, InstancedRigidBodies, RapierRigidBody, useRapier, vec3 } from '@react-three/rapier';
import { OrbitControls, Environment, useGLTF, Stats } from '@react-three/drei';
import { useMemo, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ConvexGeometry } from 'three-stdlib';
import seedrandom from 'seedrandom';
import DraggableRigidBody from './components/DraggableRigidBody';
import { Selection, Select, EffectComposer, Outline } from '@react-three/postprocessing';

// ============================================================================
// Types & Interfaces
// ============================================================================

type ObjectType = 'polyhedron' | 'mushroom' | 'rare-item';
type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface BaseObject {
  id: string;
  type: ObjectType;
  position: [number, number, number];
  rarity: RarityTier;
}

interface PolyhedronObject extends BaseObject {
  type: 'polyhedron';
  vertices: Float32Array;
  color: string;
  layer: number;
  size: string;
}

interface ModelObject extends BaseObject {
  type: 'mushroom' | 'rare-item';
  modelUrl: string;
  name: string;
  scientificName?: string;
  description: string;
  properties?: Record<string, string | boolean>;
  scale?: number;
}

type DroppableObject = PolyhedronObject | ModelObject;

interface MushroomDefinition {
  id: string;
  name: string;
  scientificName: string;
  modelUrl: string;
  rarity: RarityTier;
  bioluminescent: boolean;
  description: string;
  scale?: number;
}

// ============================================================================
// Object Registry
// ============================================================================

// Import mushroom models
import jackOLanternUrl from './models/mush-01-jackolantern.glb?url';
import yellowMorelUrl from './models/mush-02-yellowmorel.glb?url';

const MUSHROOM_REGISTRY: Record<string, MushroomDefinition> = {
  'jack-o-lantern': {
    id: 'jack-o-lantern',
    name: "Jack-o'-Lantern Mushroom",
    scientificName: 'Omphalotus olearius',
    modelUrl: jackOLanternUrl,
    rarity: 'legendary',
    bioluminescent: true,
    description: 'A rare glowing mushroom! Its gills emit a greenish-white light in the dark.',
    scale: 1.0,
  },
  'yellow-morel': {
    id: 'yellow-morel',
    name: 'Yellow Morel',
    scientificName: 'Morchella americana',
    modelUrl: yellowMorelUrl,
    rarity: 'uncommon',
    bioluminescent: false,
    description: 'Highly prized spring delicacy with distinctive honeycomb cap. Must be cooked thoroughly.',
    scale: 1.0,
  },
};

// Rarity colors for UI
const RARITY_COLORS: Record<RarityTier, string> = {
  common: '#9e9e9e',
  uncommon: '#4caf50',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff6d00',
};

// Helper to create mushroom objects from registry
function createMushroomObject(
  mushroomId: string,
  position: [number, number, number]
): ModelObject {
  const mushroom = MUSHROOM_REGISTRY[mushroomId];
  if (!mushroom) {
    throw new Error(`Mushroom ${mushroomId} not found in registry`);
  }

  return {
    id: `mushroom-${mushroomId}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'mushroom',
    position,
    rarity: mushroom.rarity,
    modelUrl: mushroom.modelUrl,
    name: mushroom.name,
    scientificName: mushroom.scientificName,
    description: mushroom.description,
    scale: mushroom.scale,
    properties: {
      bioluminescent: mushroom.bioluminescent,
    },
  };
}

// Generate trimesh floor (from reference)
function generateTriMesh(nsubdivs: number, wx: number, wy: number, wz: number, slope: number = 0) {
  const vertices: number[] = [];
  const indices: number[] = [];
  const elementWidth = 1.0 / nsubdivs;
  const rng = seedrandom('trimesh');

  for (let i = 0; i <= nsubdivs; i++) {
    for (let j = 0; j <= nsubdivs; j++) {
      const x = (j * elementWidth - 0.5) * wx;
      const zNormalized = i * elementWidth - 0.5; // -0.5 to 0.5
      const z = zNormalized * wz;
      // Add slope: higher at one end, lower at the other
      const slopeY = zNormalized * slope;
      const y = rng() * wy + slopeY;
      vertices.push(x, y, z);
    }
  }

  for (let i = 0; i < nsubdivs; i++) {
    for (let j = 0; j < nsubdivs; j++) {
      const i1 = (i + 0) * (nsubdivs + 1) + (j + 0);
      const i2 = (i + 0) * (nsubdivs + 1) + (j + 1);
      const i3 = (i + 1) * (nsubdivs + 1) + (j + 0);
      const i4 = (i + 1) * (nsubdivs + 1) + (j + 1);

      indices.push(i1, i3, i2);
      indices.push(i3, i4, i2);
    }
  }

  return {
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}

// Generate positions for convex polyhedrons (from reference)
const generatePolyhedronData = (): PolyhedronObject[] => {
  const data: PolyhedronObject[] = [];
  const num = 10; // Increased from 5 to 10 for more spread (10x10 grid = 100 per layer)
  const regularScale = 2.4; // 2x larger regular objects (was 0.8)
  const rareScale = 2.4; // Slightly larger rare objects
  const borderRad = 0.1;
  const shift = borderRad * 2.0 + regularScale;
  const centerx = shift * (num / 2);
  const centery = shift / 2.0;
  const centerz = shift * (num / 2);

  const rng = seedrandom('convexPolyhedron');
  let objectIndex = 0;

  // Rare object colors (vibrant and distinct)
  const rareColors = [
    '#ff1744', // Bright red
    '#f50057', // Pink
    '#d500f9', // Purple
    '#651fff', // Deep purple
    '#00e676', // Green
    '#ffea00', // Yellow
    '#ff6d00', // Orange
  ];

  // 2x more objects: 10x10 grid x 8 layers = 800 objects (was 375)
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < num; i++) {
      for (let k = 0; k < num; k++) {
        const x = i * shift - centerx;
        const y = j * shift + centery + 3.0; // From reference
        const z = k * shift - centerz;

        // 5% chance of spawning a rare (larger) object
        const isRare = rng() < 0.05;
        const scale = isRare ? rareScale : regularScale;

        const vertices: number[] = [];
        for (let l = 0; l < Math.floor(rng() * 6) + 5; l++) {
          vertices.push(rng() * scale, rng() * scale, rng() * scale);
        }

        let color: string;
        let size: string;
        let rarity: RarityTier;

        if (isRare) {
          // Random rare color
          color = rareColors[Math.floor(rng() * rareColors.length)];
          size = 'Large';
          rarity = 'rare';
        } else {
          // Blue shades for regular objects
          const lightness = 40 + (objectIndex * 7) % 40;
          color = `hsl(200, 80%, ${lightness}%)`;
          size = 'Small';
          rarity = 'common';
        }

        data.push({
          id: `poly-${objectIndex}`,
          type: 'polyhedron',
          position: [x, y, z],
          vertices: new Float32Array(vertices),
          color: color,
          layer: j,
          rarity: rarity,
          size: size,
        });

        objectIndex++;
      }
    }
  }

  return data;
};

// Generate all objects
// const polyhedronData = generatePolyhedronData();
const trimeshData = generateTriMesh(20, 60.0, 4.0, 60.0, -20); // Larger floor with downward slope

// Create special objects (mushrooms, rare items)
// const specialObjects: ModelObject[] = [
//   createMushroomObject('jack-o-lantern', [0, 25, 0]),
//   createMushroomObject('yellow-morel', [5, 25, 5]),
//   // Easy to add more:
//   // createMushroomObject('ghost-fungus', [10, 25, 10]),
// ];

// Combine all droppable objects
const allDroppableObjects: DroppableObject[] = [
  // ...polyhedronData,
  // ...specialObjects,
];

// Preload all model URLs
// specialObjects.forEach(obj => {
//   if ('modelUrl' in obj) {
//     useGLTF.preload(obj.modelUrl);
//   }
// });

// Component to render a convex hull mesh from vertices
function ConvexHullMesh({
  vertices,
  color,
  isSelected,
  onSelect,
  ...props
}: {
  vertices: Float32Array;
  color: string;
  isSelected: boolean;
  onSelect?: () => void;
} & any) {
  const geometry = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    for (let i = 0; i < vertices.length; i += 3) {
      positions.push(new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]));
    }
    const hull = new ConvexGeometry(positions);
    return hull;
  }, [vertices]);

  return (
    <Select enabled={isSelected}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (onSelect) onSelect();
        }}
        {...props}
      >
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
    </Select>
  );
}

// Floor mesh component
function FloorMesh() {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(trimeshData.vertices, 3));
    geo.setIndex(new THREE.BufferAttribute(trimeshData.indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#e8d4a0" roughness={0.8} />
    </mesh>
  );
}

// ============================================================================
// Components
// ============================================================================

// ============================================================================
// Constants
// ============================================================================

// Falling boxes (from three.js instancing demo)
const BOX_COUNT = 400;

function FallingBoxes() {
  const api = useRef<RapierRigidBody[]>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < BOX_COUNT; i++) {
        meshRef.current.setColorAt(i, new THREE.Color(Math.random() * 0xffffff));
      }
      meshRef.current.instanceColor!.needsUpdate = true;
    }

    // Randomly reset box positions (make them fall continuously)
    const interval = setInterval(() => {
      if (api.current) {
        const index = Math.floor(Math.random() * BOX_COUNT);
        const body = api.current[index];
        if (body) {
          body.setTranslation(
            {
              x: (Math.random() - 0.5) * 60,
              y: Math.random() + 15,
              z: (Math.random() - 0.5) * 60
            },
            true
          );
        }
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, []);

  return (
    <InstancedRigidBodies
      ref={api}
      instances={Array.from({ length: BOX_COUNT }, (_, i) => ({
        key: i,
        position: [(Math.random() - 0.5) * 60, Math.random() * 2, (Math.random() - 0.5) * 60] as [number, number, number]
      }))}
      colliders={"cuboid"}
      linearDamping={1.0}
      angularDamping={0.5}
    >
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, BOX_COUNT]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.0, 1.0, 1.0]} />
        <meshLambertMaterial />
      </instancedMesh>
    </InstancedRigidBodies>
  );
}

// Falling spheres (from three.js instancing demo)
const SPHERE_COUNT = 400;

function FallingSpheres() {
  const api = useRef<RapierRigidBody[]>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < SPHERE_COUNT; i++) {
        meshRef.current.setColorAt(i, new THREE.Color(Math.random() * 0xffffff));
      }
      meshRef.current.instanceColor!.needsUpdate = true;
    }

    // Randomly reset sphere positions (make them fall continuously)
    const interval = setInterval(() => {
      if (api.current) {
        const index = Math.floor(Math.random() * SPHERE_COUNT);
        const body = api.current[index];
        if (body) {
          body.setTranslation(
            {
              x: (Math.random() - 0.5) * 60,
              y: Math.random() + 15,
              z: (Math.random() - 0.5) * 60
            },
            true
          );
        }
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, []);

  return (
    <InstancedRigidBodies
      ref={api}
      instances={Array.from({ length: SPHERE_COUNT }, (_, i) => ({
        key: i,
        position: [(Math.random() - 0.5) * 60, Math.random() * 2, (Math.random() - 0.5) * 60] as [number, number, number]
      }))}
      colliders={"ball"}
      linearDamping={1.0}
      angularDamping={0.5}
    >
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, SPHERE_COUNT]}
        castShadow
        receiveShadow
      >
        <icosahedronGeometry args={[0.7, 4]} />
        <meshLambertMaterial />
      </instancedMesh>
    </InstancedRigidBodies>
  );
}

// Cluster of instanced spheres (from ClusterExample)
const BALLS = 5;

function ClusterBalls() {
  const api = useRef<RapierRigidBody[]>(null);
  const { isPaused } = useRapier();
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useFrame(() => {
    if (!isPaused && api.current) {
      api.current.forEach((body) => {
        if (body) {
          const p = vec3(body.translation());
          p.normalize().multiplyScalar(-0.25);
          body.applyImpulse(p, true);
        }
      });
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      for (let i = 0; i < BALLS; i++) {
        meshRef.current.setColorAt(i, new THREE.Color(Math.random() * 0xffffff));
      }
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, []);

  return (
    <InstancedRigidBodies
      ref={api}
      instances={Array.from({ length: BALLS }, (_, i) => ({
        key: i,
        position: [Math.floor(i / 30) * 1, (i % 30) * 0.5, 0] as [number, number, number]
      }))}
      colliders={"ball"}
      linearDamping={5}
    >
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, BALLS]}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1.0]} />
        <meshPhysicalMaterial
          roughness={0}
          metalness={0.5}
          color={"yellow"}
        />
      </instancedMesh>
    </InstancedRigidBodies>
  );
}

// Generic component for rendering GLB model objects (mushrooms, rare items, etc.)
function ModelObjectMesh({
  modelUrl,
  scale = 1.0,
  isSelected,
  onSelect,
  visible = true,
}: {
  modelUrl: string;
  scale?: number;
  isSelected: boolean;
  onSelect?: () => void;
  visible?: boolean;
}) {
  const { scene } = useGLTF(modelUrl);

  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    if (scale !== 1.0) {
      clone.scale.setScalar(scale);
    }
    // Set visibility on the entire scene
    clone.visible = visible;
    return clone;
  }, [scene, scale, visible]);

  return (
    <Select enabled={isSelected}>
      <primitive
        object={clonedScene}
        onDoubleClick={(e: any) => {
          e.stopPropagation();
          if (onSelect) onSelect();
        }}
      />
    </Select>
  );
}

export const PileDemo = ({ onClose }: { onClose: () => void }) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [foundRareIds, setFoundRareIds] = useState<Set<string>>(new Set());

  // Detect if device is mobile/touch (enable outline) or desktop (disable for performance)
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  const selectedObject = selectedObjectId !== null
    ? allDroppableObjects.find(obj => obj.id === selectedObjectId)
    : null;

  const totalRareObjects = allDroppableObjects.filter(
    obj => obj.rarity === 'rare' || obj.rarity === 'epic' || obj.rarity === 'legendary'
  ).length;

  // Calculate total physics objects
  const totalObjects = BOX_COUNT + SPHERE_COUNT + BALLS + allDroppableObjects.length;

  // Track when a rare object is selected
  const handleSelectObject = (id: string) => {
    setSelectedObjectId(id);
    const obj = allDroppableObjects.find(o => o.id === id);
    if (obj && (obj.rarity === 'rare' || obj.rarity === 'epic' || obj.rarity === 'legendary')) {
      setFoundRareIds(prev => new Set(prev).add(id));
    }
  };

  // Listen for Space key to deselect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && selectedObjectId !== null) {
        e.preventDefault();
        setSelectedObjectId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#2e2e2e' }}>
      {/* UI Controls */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
        <button
          onClick={onClose}
          style={{
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 'bold'
          }}
        >
          Close Demo
        </button>

        {/* Rare Object Counter */}
        <div style={{
          background: 'rgba(255, 215, 0, 0.9)',
          color: '#000',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          <div>Rare Objects Found</div>
          <div style={{ fontSize: 20 }}>
            {foundRareIds.size} / {totalRareObjects}
          </div>
        </div>

        {/* Object Count Display */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 8,
          fontSize: 12,
          fontFamily: 'monospace'
        }}>
          <div style={{ marginBottom: 5 }}>
            <strong>Objects on Screen:</strong>
          </div>
          <div>Boxes: {BOX_COUNT}</div>
          <div>Spheres: {SPHERE_COUNT}</div>
          <div>Cluster Balls: {BALLS}</div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', marginTop: 5, paddingTop: 5 }}>
            <strong>Total: {totalObjects}</strong>
          </div>
        </div>
      </div>

      {/* Object Details Overlay */}
      {selectedObject && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: 12,
          minWidth: 200,
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>
              {selectedObject.type === 'mushroom' ? 'Mushroom Details' :
               selectedObject.type === 'rare-item' ? 'Rare Item Details' :
               'Object Details'}
            </h3>
            <button
              onClick={() => setSelectedObjectId(null)}
              style={{
                background: 'transparent',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: 20,
                padding: 0,
                width: 24,
                height: 24
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Rarity Badge */}
            <div>
              <strong>Rarity:</strong>
              <span style={{
                marginLeft: 8,
                padding: '2px 8px',
                background: RARITY_COLORS[selectedObject.rarity],
                color: '#fff',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {selectedObject.rarity}
              </span>
            </div>

            {/* Type-specific details */}
            {selectedObject.type === 'polyhedron' && (
              <>
                <div>
                  <strong>ID:</strong> {selectedObject.id}
                </div>
                <div>
                  <strong>Size:</strong> {selectedObject.size}
                </div>
                <div>
                  <strong>Layer:</strong> {selectedObject.layer}
                </div>
                <div>
                  <strong>Color:</strong>
                  <div style={{
                    display: 'inline-block',
                    width: 20,
                    height: 20,
                    backgroundColor: selectedObject.color,
                    marginLeft: 8,
                    border: '1px solid white',
                    verticalAlign: 'middle'
                  }} />
                </div>
                <div>
                  <strong>Vertices:</strong> {selectedObject.vertices.length / 3}
                </div>
              </>
            )}

            {selectedObject.type === 'mushroom' && (
              <>
                <div>
                  <strong>Type:</strong> {selectedObject.name}
                </div>
                {selectedObject.scientificName && (
                  <div>
                    <strong>Scientific Name:</strong> <em>{selectedObject.scientificName}</em>
                  </div>
                )}
                {selectedObject.properties?.bioluminescent && (
                  <div>
                    <strong>Bioluminescent:</strong> Yes ✨
                  </div>
                )}
              </>
            )}

            {selectedObject.type === 'rare-item' && (
              <>
                <div>
                  <strong>Name:</strong> {selectedObject.name}
                </div>
                {selectedObject.properties && Object.entries(selectedObject.properties).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {String(value)}
                  </div>
                ))}
              </>
            )}

            {/* Description */}
            {(selectedObject.type === 'mushroom' || selectedObject.type === 'rare-item') && (
              <div style={{ fontSize: 12, marginTop: 10, opacity: 0.9, fontStyle: 'italic' }}>
                {selectedObject.description}
              </div>
            )}

            {/* Footer hint */}
            <div style={{ fontSize: 12, marginTop: 10, opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 10 }}>
              {(selectedObject.rarity === 'rare' || selectedObject.rarity === 'epic' || selectedObject.rarity === 'legendary')
                ? '🎉 You found a rare object!'
                : 'Keep looking for rare objects!'}
              <br />
              Double-tap another object to select it, or press Space to deselect
            </div>
          </div>
        </div>
      )}

      <Canvas
        camera={{
          position: [0, 20, 30],
          fov: 50,
          near: 0.1,
          far: 150
        }}
        gl={{
          powerPreference: "high-performance",
          alpha: false,
          antialias: true,
        }}
      >
        {/* FPS Counter */}
        <Stats />

        <OrbitControls
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          target={[0, 10, 0]}
        />

        <Environment files="/venice_sunset_1k.hdr" />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1}
          castShadow
        />

        {isMobile ? (
          <Selection>
            <EffectComposer multisampling={2} autoClear={false}>
              <Outline blur visibleEdgeColor="white" edgeStrength={100} width={1000} />
            </EffectComposer>

            <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
            {/* Trimesh floor */}
            <RigidBody type="fixed" colliders="trimesh">
              <FloorMesh />
            </RigidBody>

            {/* Falling boxes and spheres */}
            <FallingBoxes />
            <FallingSpheres />

            {/* Cluster of 800 instanced balls */}
            <ClusterBalls />

            {/* All droppable objects - draggable */}
            {/* {allDroppableObjects.map((obj) => (
              <DraggableRigidBody
                key={obj.id}
                groupProps={{ position: obj.position }}
                rigidBodyProps={{ colliders: 'hull' }}
                enableSpringJoint={true}
                dragControlsProps={{ preventOverlap: true }}
                visibleMesh={
                  obj.type === 'polyhedron' ? (
                    <ConvexHullMesh
                      vertices={obj.vertices}
                      color={obj.color}
                      isSelected={selectedObjectId === obj.id}
                      onSelect={() => handleSelectObject(obj.id)}
                    />
                  ) : (
                    <ModelObjectMesh
                      modelUrl={obj.modelUrl}
                      scale={obj.scale}
                      isSelected={selectedObjectId === obj.id}
                      onSelect={() => handleSelectObject(obj.id)}
                    />
                  )
                }
              />
            ))} */}
          </Physics>
        </Selection>
        ) : (
          <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
            {/* Trimesh floor */}
            <RigidBody type="fixed" colliders="trimesh">
              <FloorMesh />
            </RigidBody>

            {/* Falling boxes and spheres */}
            <FallingBoxes />
            <FallingSpheres />

            {/* Cluster of 800 instanced balls */}
            <ClusterBalls />

            {/* All droppable objects - draggable (no outline on desktop) */}
            {/* {allDroppableObjects.map((obj) => (
              <DraggableRigidBody
                key={obj.id}
                groupProps={{ position: obj.position }}
                rigidBodyProps={{ colliders: 'hull' }}
                enableSpringJoint={true}
                dragControlsProps={{ preventOverlap: true }}
                visibleMesh={
                  obj.type === 'polyhedron' ? (
                    <ConvexHullMesh
                      vertices={obj.vertices}
                      color={obj.color}
                      isSelected={selectedObjectId === obj.id}
                      onSelect={() => handleSelectObject(obj.id)}
                    />
                  ) : (
                    <ModelObjectMesh
                      modelUrl={obj.modelUrl}
                      scale={obj.scale}
                      isSelected={selectedObjectId === obj.id}
                      onSelect={() => handleSelectObject(obj.id)}
                    />
                  )
                }
              />
            ))} */}
          </Physics>
        )}
      </Canvas>
    </div>
  );
};
