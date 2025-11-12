import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Physics,
  RigidBody,
  CuboidCollider,
  InstancedRigidBodies,
  RapierRigidBody,
} from '@react-three/rapier';
import { OrbitControls, Stats, Line } from '@react-three/drei';
import { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import {
  detectPerformance,
  scaleObjectCount,
  type PerformanceTier,
} from './utils/performanceDetection';

// Import extracted 3D components
import { CanvasText } from './components/game/3d/CanvasText';
import { FallingObjects } from './components/game/3d/FallingObjects';
import { ParticleExplosion } from './components/game/3d/ParticleExplosion';
import { AnimatedFireLight } from './components/game/3d/Lighting';
import { ShadowPlane, FloorCollider } from './components/game/3d/Floor';
import { DragZone } from './components/game/3d/DragZone';
import { DebugAxes, FaucetIndicator } from './components/game/3d/DebugVisuals';
import { PointerForceField } from './components/game/3d/PointerForceField';

// Import UI components
import { PerformanceInfo } from './components/game/ui/PerformanceInfo';
import { GemIcon, CombinedGemsIcon } from './components/icons/GemIcons';
import { CoinBalance, CoinCost, type Coins } from './components/ui/CoinDisplay';
import { GemList } from './components/game/ui/GemList';

// Import utilities
import { getCoinColor, getCrystalColor, getGemIconStyle } from './utils/colorUtils';
import { createMobileFriendlyHandlers, mobileFriendlyButtonStyles } from './utils/mobileHandlers';
import {
  isInDragZone,
  COIN_SPAWN_X,
  COIN_SPAWN_Z,
  COIN_SPAWN_RADIUS,
  GEM_SPAWN_X,
  GEM_SPAWN_Z,
  GEM_SPAWN_RADIUS,
  GROWING_GEM_SPAWN_X,
  GROWING_GEM_SPAWN_Z,
  GROWING_GEM_SPAWN_RADIUS,
} from './utils/spawnPositions';
import { apiGet, apiPost, apiDelete, setApiUsername, linkWallet, getLinkedWallet, unlinkWallet } from './utils/api-client';
import { WalletProvider } from './components/WalletProvider';
import { WalletButton } from './components/WalletButton';

// Import types and constants
import type {
  LevelConfig,
  ObjectTypeConfig,
  FaucetConfig,
  TouchConfig,
  PlayerState,
  Gem,
} from './types/game';
import type {
  GetActiveOffersResponse,
  LoadPlayerStateResponse,
  SavePlayerStateResponse,
  ExecuteTradeResponse,
  UpdateOfferResponse,
} from '../shared/types/api';
import {
  LEVEL_CONFIGS,
  LOCATION_CONFIGS,
  ROCK_COLORS,
  DEFAULT_FAUCET_CONFIG,
  DEFAULT_TOUCH_CONFIG,
  GARDEN_FAUCET_CONFIGS,
} from './constants/game';
import { generateObjectTypes } from './utils/objectGeneration';
import {
  createGem,
  getGemDisplayName,
  getRarityColor,
  GEM_TYPE_NAMES,
} from './utils/gemGeneration';
import {
  calculateTotalGemValue,
  calculateGemValue,
  formatValueAsCoins,
  convertToCoins,
} from './utils/gemValue';

// ============================================================================
// Garden Initial Spawn Positions
// ============================================================================
// Spawn positions are now centralized in utils/spawnPositions.ts
// ⚠️ IMPORTANT: Keep them synchronized with FallingObjects.tsx

// ============================================================================
// Main Component
// ============================================================================
//
// Performance Optimization System:
// --------------------------------
// This component automatically detects device performance and applies physics
// optimizations to ensure smooth gameplay across all devices:
//
// RENDERING: Always uses HIGH settings for all tiers
//    - Shadows: Always enabled
//    - Lighting: Always full (advanced lighting with all point lights)
//    - Object counts: Always 100% (no reduction)
//
// PHYSICS: Tier-based optimizations (applied to Rapier):
//    - Low Tier (30 fps physics):
//      * timeStep: 1/30 (half the calculations)
//      * maxVelocityIterations: 2 (4x fewer solver iterations)
//      * maxStabilizationIterations: 1 (4x fewer stabilization iterations)
//      * interpolation: disabled (saves computation)
//      * sleeping thresholds: 0.5 (bodies sleep much faster)
//    - Medium Tier (45 fps physics):
//      * timeStep: 1/45 (33% fewer calculations)
//      * maxVelocityIterations: 4 (2x fewer solver iterations)
//      * maxStabilizationIterations: 2 (2x fewer stabilization iterations)
//      * interpolation: enabled
//      * sleeping thresholds: 0.1 (bodies sleep faster)
//    - High Tier (60 fps physics):
//      * timeStep: 1/60 (full accuracy)
//      * maxVelocityIterations: 8 (maximum accuracy)
//      * maxStabilizationIterations: 4 (maximum stability)
//      * interpolation: enabled
//      * sleeping thresholds: default (precise physics)
//
// This approach prioritizes visual quality while reducing physics calculations
// on lower-end devices.
//
// ============================================================================

// ============================================================================
// Helper: Check if a position is inside the drag zone
// ============================================================================
// Now imported from utils/spawnPositions.ts
// Additional check for objects above floor
function isInDragZoneWithFloorCheck(x: number, y: number, z: number): boolean {
  // Only count objects that are above the floor (not fallen through)
  // Floor is at y = -0.5, so anything below that is considered "lost"
  if (y < -0.5) {
    return false;
  }
  return isInDragZone(x, y, z);
}

// Component to track objects in drag zone
function DragZoneCounter({
  gardenApiRefs,
  onCountChange,
  onInstancesChange,
  activeScene,
}: {
  gardenApiRefs: React.RefObject<RapierRigidBody[]>[];
  onCountChange: (count: number) => void;
  onInstancesChange: (instances: Set<string>) => void;
  activeScene: 'scrounge' | 'garden';
}) {
  useFrame(() => {
    // CRITICAL: Check activeScene FIRST - don't run if not in garden
    if (activeScene !== 'garden') {
      return;
    }

    // CRITICAL: Check if any refs have been cleared (scene switching)
    // Skip processing if refs are being cleaned up
    const hasEmptyRefs = gardenApiRefs.some(
      (ref) => ref.current && Array.isArray(ref.current) && ref.current.length === 0
    );

    if (hasEmptyRefs) {
      // Scene is switching, don't access physics bodies
      console.log('[DRAG ZONE COUNTER] Refs cleared, skipping drag zone check');
      return;
    }

    let count = 0;
    const instancesInZone = new Set<string>();

    // Check all garden objects
    gardenApiRefs.forEach((apiRef, meshIndex) => {
      if (apiRef.current) {
        apiRef.current.forEach((body, instanceIndex) => {
          if (body) {
            try {
              const pos = body.translation();
              if (isInDragZoneWithFloorCheck(pos.x, pos.y, pos.z)) {
                count++;
                // Track instance key for highlighting
                // For garden objects, use 'garden-{index}' format
                const meshId =
                  meshIndex < 3 ? `garden-${meshIndex}` : `garden-gem-${meshIndex - 3}`;
                instancesInZone.add(`${meshId}:${instanceIndex}`);
              }
            } catch (error) {
              console.error('[DRAG ZONE COUNTER] Error accessing body:', error, {
                meshIndex,
                instanceIndex,
              });
            }
          }
        });
      }
    });

    onCountChange(count);
    onInstancesChange(instancesInZone);
  });

  return null;
}

// Debug visualization of the drag zone detection area
function DragZoneDebugBox({ visible }: { visible: boolean }) {
  if (!visible) return null;

  const zoneX = -0.39;
  const zoneY = 0.0; // Centered at floor level
  const zoneZ = 0.4;
  const zoneRotation = 5.5; // radians
  const zoneWidth = 1.5;
  const zoneHeight = 1.0; // Height for visualization
  const zoneDepth = 0.75;

  return (
    <mesh position={[zoneX, zoneY, zoneZ]} rotation={[0, zoneRotation, 0]}>
      <boxGeometry args={[zoneWidth, zoneHeight, zoneDepth]} />
      <meshBasicMaterial color="#ff0000" wireframe={true} transparent={true} opacity={0.5} />
    </mesh>
  );
}

// ============================================================================
// Helper Components - Item Icons
// ============================================================================

// Coin icon component - matches the style used in menus and toasts
const CoinIcon = ({ color, size = 10 }: { color: string; size?: number }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
      flexShrink: 0,
    }}
  />
);

// getCoinColor is now imported from utils/colorUtils.ts

// Component to render coin values with icons (inline)
export const CoinValueDisplay = ({
  bronzeValue,
  size = 10,
  showZero = false,
  fontSize,
  fontFamily = 'inherit',
  reverse = false,
}: {
  bronzeValue: number;
  size?: number;
  showZero?: boolean;
  fontSize?: number;
  fontFamily?: string;
  reverse?: boolean;
}) => {
  const coins = convertToCoins(bronzeValue);
  const parts: JSX.Element[] = [];

  const actualFontSize = fontSize || size;
  const formatAmount = (amount: number) =>
    amount >= 1000 ? amount.toLocaleString() : amount.toString();

  const coinOrder = reverse ? ['bronze', 'silver', 'gold'] : ['gold', 'silver', 'bronze'];

  coinOrder.forEach((coinType) => {
    const amount =
      coinType === 'gold' ? coins.gold : coinType === 'silver' ? coins.silver : coins.bronze;

    if (amount > 0 || (showZero && amount === 0)) {
      parts.push(
        <span key={coinType} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          <CoinIcon color={getCoinColor(coinType)} size={size} />
          <span style={{ fontFamily, fontSize: actualFontSize }}>{formatAmount(amount)}</span>
        </span>
      );
    }
  });

  if (parts.length === 0) {
    return <span style={{ fontFamily, fontSize: actualFontSize }}>0</span>;
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {parts.map((part, idx) => (
        <span key={idx}>{part}</span>
      ))}
    </span>
  );
};

// ============================================================================
// Master Physics Loop - Phase 1: Drag Zone Counting Only
// ============================================================================
//
// This component consolidates physics body access into a single useFrame loop
// to prevent concurrent access crashes during garden action transitions.
//
// Currently implements: Phase 2 (Drag Zone Counting)
// TODO: Add Phase 1 (Dragged Body), Phase 3 (Matrix Sync), Phase 4 (Collection)
//
function MasterPhysicsLoop({
  gardenApiRefs,
  gardenMeshRefs,
  gardenObjectTypes,
  scroungeApiRefs,
  scroungeMeshRefs,
  scroungeObjectTypes,
  activeScene,
  gardenAction,
  isTransitioningRef,
  onCountChange,
  onInstancesChange,
  collectingItems,
}: {
  gardenApiRefs: React.RefObject<RapierRigidBody[]>[];
  gardenMeshRefs: React.RefObject<THREE.InstancedMesh | null>[];
  gardenObjectTypes: ObjectTypeConfig[];
  scroungeApiRefs?: React.RefObject<RapierRigidBody[]>[];
  scroungeMeshRefs?: React.RefObject<THREE.InstancedMesh | null>[];
  scroungeObjectTypes?: ObjectTypeConfig[];
  activeScene: 'scrounge' | 'garden';
  gardenAction: 'appraise' | 'grow' | 'my-offer';
  isTransitioningRef: React.MutableRefObject<boolean>;
  onCountChange: (count: number) => void;
  onInstancesChange: (instances: Set<string>) => void;
  collectingItems?: Map<string, { startTime: number; meshId: string; instanceId: number }>;
}) {
  // Frame counter for sleeping optimization
  const frameCountRef = useRef(0);

  useFrame(() => {
    // CRITICAL: Synchronous check - blocks ALL physics access during transitions
    if (isTransitioningRef.current) {
      return;
    }

    frameCountRef.current++;
    const shouldUpdateSleeping = frameCountRef.current % 10 === 0;

    // ========================================================================
    // Phase 1: Matrix Synchronization (Consolidated from FallingObjects)
    // ========================================================================
    const apiRefs = activeScene === 'garden' ? gardenApiRefs : scroungeApiRefs || [];
    const meshRefs = activeScene === 'garden' ? gardenMeshRefs : scroungeMeshRefs || [];
    const objectTypes = activeScene === 'garden' ? gardenObjectTypes : scroungeObjectTypes || [];

    apiRefs.forEach((apiRef, meshIndex) => {
      if (!apiRef.current) return;
      if (Array.isArray(apiRef.current) && apiRef.current.length === 0) return;

      const meshRef = meshRefs[meshIndex];
      if (!meshRef?.current) return;

      const objectType = objectTypes[meshIndex];
      if (!objectType) return;

      const mesh = meshRef.current;
      const matrix = new THREE.Matrix4();
      const position = new THREE.Vector3();
      const rotation = new THREE.Quaternion();
      const scale = new THREE.Vector3();

      // Generate mesh ID for tracking (match FallingObjects naming convention)
      const meshId =
        activeScene === 'garden'
          ? meshIndex < 3
            ? `garden-${meshIndex}`
            : `garden-gem-${meshIndex - 3}`
          : `scrounge-${meshIndex}`;

      for (let i = 0; i < objectType.count; i++) {
        try {
          const body = apiRef.current[i];
          if (!body) continue;

          const instanceKey = `${meshId}:${i}`;
          if (collectingItems && collectingItems.has(instanceKey)) continue;

          const pos = body.translation();
          if (pos.y < -100) continue;

          const isSleeping = body.isSleeping();
          if (isSleeping && !shouldUpdateSleeping) continue;

          const rot = body.rotation();

          mesh.getMatrixAt(i, matrix);
          matrix.decompose(position, rotation, scale);

          matrix.compose(
            new THREE.Vector3(pos.x, pos.y, pos.z),
            new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w),
            scale
          );

          mesh.setMatrixAt(i, matrix);
        } catch (error) {
          // Silently skip bodies that throw errors (already being destroyed)
          // This is expected during rapid transitions
        }
      }

      mesh.instanceMatrix.needsUpdate = true;
    });

    // ========================================================================
    // Phase 2: Collection Animation (Consolidated from FallingObjects)
    // ========================================================================
    if (collectingItems && collectingItems.size > 0) {
      const currentTime = Date.now() / 1000;
      const ANIMATION_DURATION = 0.5;
      const RISE_SPEED = 20;

      // Iterate through all collecting items
      collectingItems.forEach((collectingItem, instanceKey) => {
        const { meshId, instanceId, startTime } = collectingItem;

        // Parse meshId to find the correct refs
        let meshIndex: number;
        let currentApiRefs: React.RefObject<RapierRigidBody[]>[];
        let currentMeshRefs: React.RefObject<THREE.InstancedMesh | null>[];

        if (meshId.startsWith('garden-gem-')) {
          const coinCount = GARDEN_OBJECT_TYPES.filter((t) => t.materialType === 'coin').length;
          meshIndex = parseInt(meshId.replace('garden-gem-', '')) + coinCount;
          currentApiRefs = gardenApiRefs;
          currentMeshRefs = gardenMeshRefs;
        } else if (meshId.startsWith('garden-')) {
          meshIndex = parseInt(meshId.replace('garden-', ''));
          currentApiRefs = gardenApiRefs;
          currentMeshRefs = gardenMeshRefs;
        } else {
          // Scrounge mode
          meshIndex = parseInt(meshId);
          currentApiRefs = scroungeApiRefs || [];
          currentMeshRefs = scroungeMeshRefs || [];
        }

        const apiRef = currentApiRefs[meshIndex];
        const meshRef = currentMeshRefs[meshIndex];

        if (!apiRef?.current || !meshRef?.current) return;
        if (!apiRef.current[instanceId] || instanceId >= apiRef.current.length) return;

        try {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

          // Animate scale: grow to 3x then shrink to 0
          let scaleMultiplier = 1;
          if (progress < 0.3) {
            scaleMultiplier = 1 + (progress / 0.3) * 2.0;
          } else {
            const shrinkProgress = (progress - 0.3) / 0.7;
            scaleMultiplier = 3.0 * (1 - shrinkProgress);
          }

          // Move item upward kinematically
          const body = apiRef.current[instanceId];
          if (body) {
            const currentPos = body.translation();
            const deltaTime = 1 / 60; // Approximate frame time
            body.setNextKinematicTranslation({
              x: currentPos.x,
              y: currentPos.y + RISE_SPEED * deltaTime,
              z: currentPos.z,
            });
          }

          // Update visual matrix with scale animation
          const matrix = new THREE.Matrix4();
          const position = new THREE.Vector3();
          const rotation = new THREE.Quaternion();
          const scale = new THREE.Vector3();

          meshRef.current.getMatrixAt(instanceId, matrix);
          matrix.decompose(position, rotation, scale);
          scale.multiplyScalar(scaleMultiplier);
          matrix.compose(position, rotation, scale);
          meshRef.current.setMatrixAt(instanceId, matrix);
          meshRef.current.instanceMatrix.needsUpdate = true;
        } catch (error) {
          // Silently skip errors during collection animation
        }
      });
    }

    // ========================================================================
    // Phase 3: Drag Zone Counting
    // ========================================================================
    // Only run in garden mode during grow or my-offer actions
    if (activeScene === 'garden' && (gardenAction === 'grow' || gardenAction === 'my-offer')) {
      let count = 0;
      const instancesInZone = new Set<string>();

      // Check all garden objects for drag zone membership
      gardenApiRefs.forEach((apiRef, meshIndex) => {
        if (!apiRef.current) return;

        apiRef.current.forEach((body, instanceIndex) => {
          if (!body) return;

          try {
            const pos = body.translation();
            if (isInDragZoneWithFloorCheck(pos.x, pos.y, pos.z)) {
              count++;
              // Track instance key for highlighting
              const meshId = meshIndex < 3 ? `garden-${meshIndex}` : `garden-gem-${meshIndex - 3}`;
              instancesInZone.add(`${meshId}:${instanceIndex}`);
            }
          } catch (error) {
            // Silently skip bodies that throw errors (already being destroyed)
            // This is expected during rapid transitions
          }
        });
      });

      onCountChange(count);
      onInstancesChange(instancesInZone);
    }
  });

  return null;
}

// ============================================================================
// Data Structures - Scrounge Locations
// ============================================================================
const SCROUNGE_LOCATIONS = [
  {
    id: 'rockfall',
    name: 'Rockfall',
    description: 'Gobtown before the quakes. Good scrounging for metals.',
    yields: [
      { type: 'coin', color: '#CD7F32' }, // bronze
      { type: 'coin', color: '#C0C0C0' }, // silver
      { type: 'gem', color: '#50C878', shape: 'tetrahedron' }, // emerald (green tetrahedron)
      { type: 'gem', color: '#50C878', shape: 'octahedron' }, // emerald (green octahedron)
      { type: 'gem', color: '#0F52BA', shape: 'tetrahedron' }, // sapphire (blue tetrahedron)
    ],
    cost: { bronze: 0, silver: 0, gold: 0 }, // Free
    minHeight: 105,
  },
  {
    id: 'bright-warrens',
    name: 'Bright Warrens',
    description: 'Silvery tunnels where precious metals gather in moonlit pools.',
    yields: [
      { type: 'coin', color: '#C0C0C0' }, // silver
      { type: 'gem', color: '#50C878', shape: 'dodecahedron' }, // emerald (green dodecahedron)
      { type: 'gem', color: '#0F52BA', shape: 'octahedron' }, // sapphire (blue octahedron)
      { type: 'gem', color: '#E0115F', shape: 'tetrahedron' }, // ruby (red tetrahedron)
    ],
    cost: { bronze: 50, silver: 10, gold: 0 },
    minHeight: 115,
  },
  {
    id: 'crystal-caves',
    name: 'Crystal Caves',
    description: 'Glittering caverns rich with gemstones and crystalline formations.',
    yields: [
      { type: 'coin', color: '#FFD700' }, // gold
      { type: 'gem', color: '#0F52BA', shape: 'dodecahedron' }, // sapphire (blue dodecahedron)
      { type: 'gem', color: '#E0115F', shape: 'dodecahedron' }, // ruby (red dodecahedron)
      { type: 'gem', color: '#E8F5F5', shape: 'octahedron' }, // diamond (clear octahedron)
    ],
    cost: { bronze: 0, silver: 50, gold: 10 },
    minHeight: 115,
  },
  {
    id: 'fire-fields',
    name: 'Fire Fields',
    description: 'Whispers of strange scrounging techniques by beings stranger still.',
    yields: [
      { type: 'coin', color: '#FFD700' }, // gold
      { type: 'gem', color: '#E0115F', shape: 'dodecahedron' }, // ruby (common in fire)
      { type: 'gem', color: '#9966CC', shape: 'octahedron' }, // amethyst
    ],
    cost: { bronze: 0, silver: 0, gold: 0 },
    comingSoon: true,
    minHeight: 115,
  },
] as const;

// ============================================================================
// Data Structures - Garden Items (for sidebar display)
// ============================================================================
const GARDEN_ITEM_TYPES = {
  coins: [
    { id: 'bronze', name: 'Bronze', color: '#CD7F32' },
    { id: 'silver', name: 'Silver', color: '#C0C0C0' },
    { id: 'gold', name: 'Gold', color: '#FFD700' },
  ],
} as const;

const PileDemoInner = ({
  onClose,
  level = 1,
  username,
}: {
  onClose: () => void;
  level?: number;
  username?: string;
}) => {
  // Debug mode - for testing garden features
  const [debugMode, setDebugMode] = useState(false);

  // Session-based username generation (for local dev and Vercel)
  // Only generate unique usernames when not authenticated via Reddit
  const [effectiveUsername] = useState(() => {
    // Check if we have a real Reddit username (not anonymous, not LocalDevUser, not undefined)
    const hasRealUsername = username && username !== 'LocalDevUser' && username !== 'anonymous';

    if (hasRealUsername) {
      // Reddit/Devvit mode - use username from Reddit API
      console.log(`[AUTH] Using Reddit username: ${username}`);
      setApiUsername(username);
      return username;
    }

    // Local dev or Vercel mode - generate or retrieve session-specific username
    const storedUsername = sessionStorage.getItem('sessionUsername');
    if (storedUsername) {
      console.log(`[SESSION] Using stored username: ${storedUsername}`);
      setApiUsername(storedUsername);
      return storedUsername;
    }

    // Generate random username like "Player_ABC123"
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newUsername = `Player_${randomId}`;
    sessionStorage.setItem('sessionUsername', newUsername);
    console.log(`[SESSION] Generated new username: ${newUsername}`);
    setApiUsername(newUsername);
    return newUsername;
  });

  // Debug gem conversion controls
  const [debugGemType, setDebugGemType] = useState<
    'diamond' | 'emerald' | 'ruby' | 'sapphire' | 'amethyst'
  >('diamond');
  const [debugGemShape, setDebugGemShape] = useState<'tetrahedron' | 'octahedron' | 'dodecahedron'>(
    'octahedron'
  );

  // Performance detection state
  const [performanceTier, setPerformanceTier] = useState<PerformanceTier | null>(null);
  const [performanceInfo, setPerformanceInfo] = useState<any>(null);
  const [manualPerformanceTier, setManualPerformanceTier] = useState<PerformanceTier | null>(null); // Use device detection by default

  // Followed users state
  const [followedUsers, setFollowedUsers] = useState<
    Array<{
      username: string;
      lastActive: string;
      level: number;
      itemCount: number;
      offer?: {
        gems: Array<{
          name: string;
          rarity: string;
          shape: 'tetrahedron' | 'octahedron' | 'dodecahedron';
          color: string;
        }>;
        totalValue: number;
      };
    }>
  >([]);
  const [followedUsersCursor, setFollowedUsersCursor] = useState<number | null>(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [traderSearchQuery, setTraderSearchQuery] = useState('');
  const [selectedGob, setSelectedGob] = useState<string | null>(null);

  // getCrystalColor and getGemIconStyle are now imported from utils/colorUtils.ts

  // Fetch active offers
  const fetchActiveOffers = async (cursor: number | null = 0) => {
    if (loadingUsers || (cursor !== 0 && !hasMoreUsers)) return;

    setLoadingUsers(true);
    try {
      const data = await apiGet<GetActiveOffersResponse>(
        `/api/offers?cursor=${cursor || 0}&limit=10`
      );
      if (data.type === 'getActiveOffers') {
        setFollowedUsers((prev) => (cursor === 0 ? data.offers : [...prev, ...data.offers]));
        setFollowedUsersCursor(data.nextCursor);
        setHasMoreUsers(data.hasMore);
      }
    } catch (error) {
      console.error('Error fetching active offers:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load initial active offers
  useEffect(() => {
    void fetchActiveOffers(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trade handler function
  const handleTrade = async (sellerUsername: string, totalValue: number) => {
    // 1. Confirm dialog
    const playerBronzeTotal =
      playerState.coins.bronze + playerState.coins.silver * 100 + playerState.coins.gold * 10000;

    const coins = {
      gold: Math.floor(totalValue / 10000),
      silver: Math.floor((totalValue % 10000) / 100),
      bronze: totalValue % 100,
    };

    const coinText = [
      coins.bronze > 0 ? `${coins.bronze} bronze` : '',
      coins.silver > 0 ? `${coins.silver} silver` : '',
      coins.gold > 0 ? `${coins.gold} gold` : '',
    ]
      .filter(Boolean)
      .join(', ');

    const confirmed = window.confirm(`Purchase gems from ${sellerUsername} for ${coinText}?`);
    if (!confirmed) return;

    // 2. Validate buyer has enough coins
    if (playerBronzeTotal < totalValue) {
      alert('Not enough coins!');
      return;
    }

    // 3. Execute trade
    try {
      const data = await apiPost<ExecuteTradeResponse>('/api/trade/execute', {
        sellerUsername,
      });

      if (data.success) {
        console.log('[TRADE] Trade successful:', data.transaction);

        // 4. Reload player state
        const loadData = await apiGet<LoadPlayerStateResponse>('/api/player-state/load');
        if (loadData.type === 'loadPlayerState' && loadData.playerState) {
          setPlayerState(loadData.playerState);
        }

        // 5. Refresh offers list
        await fetchActiveOffers(0);

        // 6. Show success toast
        const toastId = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prevToasts) => [
          ...prevToasts,
          {
            id: toastId,
            type: 'bought',
            timestamp: Date.now(),
            boughtCount: data.transaction?.gems.length || 0,
            boughtValue: data.transaction?.coinsSpent || 0,
          },
        ]);

        setTimeout(() => {
          setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId));
        }, 3000);
      } else {
        alert(data.message || 'Trade failed');
      }
    } catch (error) {
      console.error('[TRADE] Trade error:', error);
      alert('Trade failed - please try again');
    }
  };

  // Touch position tracker for tap detection
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  // Helper function for mobile-friendly button handlers
  const createMobileFriendlyHandlers = (action: () => void) => ({
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      action();
    },
    onTouchStart: (e: React.TouchEvent) => {
      if (e.touches[0]) {
        touchStartPos.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.stopPropagation();

      if (!touchStartPos.current) {
        // No touch start recorded, treat as tap
        e.preventDefault();
        action();
        return;
      }

      // Check if this was a tap (not a scroll)
      const touch = e.changedTouches[0];
      if (!touch) return;

      const touchEndY = touch.clientY;
      const touchEndX = touch.clientX;
      const deltaY = Math.abs(touchEndY - touchStartPos.current.y);
      const deltaX = Math.abs(touchEndX - touchStartPos.current.x);

      // If movement is less than 10px, it's a tap
      if (deltaY < 10 && deltaX < 10) {
        e.preventDefault(); // Prevent ghost click
        action();
      }
      // Otherwise it's a scroll, do nothing (allow scrolling)

      touchStartPos.current = null;
    },
  });

  // NOTE: Local createMobileFriendlyHandlers includes scroll detection logic
  // The imported version from utils/mobileHandlers.ts is simpler but doesn't detect scrolls
  // TODO: Consider unifying these implementations

  // Override mobileFriendlyButtonStyles with local requirements
  const localMobileFriendlyButtonStyles: React.CSSProperties = {
    ...mobileFriendlyButtonStyles,
    WebkitTapHighlightColor: 'rgba(255,255,255,0.2)',
    minWidth: 44, // iOS recommended minimum touch target
    minHeight: 44,
  };

  // Detect device performance on mount
  useEffect(() => {
    detectPerformance().then((perfInfo) => {
      setPerformanceTier(perfInfo.tier);
      setPerformanceInfo(perfInfo);
    });
  }, []);

  // Growth tick system - runs every second to update growing gems
  useEffect(() => {
    const MAX_GEM_SIZE = 0.2; // 200mm maximum size

    const intervalId = setInterval(() => {
      setPlayerState((prev) => {
        // Check if any gems are growing
        const hasGrowingGems = prev.gems.some((g) => g.isGrowing);
        if (!hasGrowingGems) return prev; // No changes if no growing gems

        // Update all growing gems
        const updatedGems = prev.gems.map((gem) => {
          if (!gem.isGrowing) return gem; // Skip non-growing gems

          // Check if gem has reached maximum size
          if (gem.size >= MAX_GEM_SIZE) {
            // Keep currentGrowth at 100 to show max progress bar
            return {
              ...gem,
              currentGrowth: 100,
            };
          }

          // Increase currentGrowth by growthRate
          let newGrowth = gem.currentGrowth + gem.growthRate;
          let newSize = gem.size;

          // Check if growth completed (>= 100)
          if (newGrowth >= 100) {
            // Reset growth and increase size by 1mm (0.001 units)
            newGrowth = newGrowth - 100; // Keep overflow for next cycle
            newSize = gem.size + 0.001;

            // Cap size at maximum
            if (newSize > MAX_GEM_SIZE) {
              newSize = MAX_GEM_SIZE;
              newGrowth = 100; // Set to 100 to show full progress bar
              console.log(
                `[GROWTH] 🏆 Gem ${gem.id} reached MAX SIZE! ${(MAX_GEM_SIZE * 1000).toFixed(0)}mm`
              );
            } else {
              console.log(
                `[GROWTH] 🌱 Gem ${gem.id} grew! Size: ${(gem.size * 1000).toFixed(1)}mm → ${(newSize * 1000).toFixed(1)}mm`
              );
            }
          }

          return {
            ...gem,
            currentGrowth: newGrowth,
            size: newSize,
          };
        });

        return {
          ...prev,
          gems: updatedGems,
        };
      });
    }, 1000); // Run every 1 second

    return () => clearInterval(intervalId);
  }, []);

  // Faucet configurations - support multiple faucets
  const [faucetConfigs, setFaucetConfigs] = useState<Record<string, FaucetConfig>>({
    'default': {
      ...DEFAULT_FAUCET_CONFIG,
      enabled: false, // Start disabled
      spawnRate: 120, // 2 objects per frame at 60fps (higher frequency)
      initialVelocity: [0, -2, 0], // Slower downward velocity
    },
    'coin-faucet': {
      ...GARDEN_FAUCET_CONFIGS['coin-faucet'],
      enabled: false, // Start disabled for debug testing
    },
    'gem-faucet': {
      ...GARDEN_FAUCET_CONFIGS['gem-faucet'],
      enabled: false, // Start disabled for debug testing
    },
    'growing-gem-faucet': {
      ...GARDEN_FAUCET_CONFIGS['growing-gem-faucet'],
      enabled: false, // Start disabled for debug testing
    },
  });
  const [touchConfig, setTouchConfig] = useState<TouchConfig>(DEFAULT_TOUCH_CONFIG);
  const [isDragging, setIsDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Collapsed by default
  const [gameTab, setGameTab] = useState<'scrounge' | 'garden' | 'hoard' | 'settings'>('scrounge'); // Game mode tabs
  const [activeScene, setActiveScene] = useState<'scrounge' | 'garden'>('scrounge'); // Track which 3D scene is active
  const [gardenAction, setGardenAction] = useState<'appraise' | 'grow' | 'my-offer'>('grow'); // Garden action tabs
  const [tradeAction, setTradeAction] = useState<'town' | 'bazaar'>('town'); // Trade action tabs
  const [sceneKey, setSceneKey] = useState(0); // Key to force scene refresh
  const [scroungeObjectsActive, setScroungeObjectsActive] = useState(true); // Control useFrame loops in scrounge objects
  const [gardenObjectsActive, setGardenObjectsActive] = useState(false); // Control useFrame loops in garden objects

  // CRITICAL: Synchronous transition blocker for master physics loop
  const isTransitioningRef = useRef(false);

  const [selectedLocation, setSelectedLocation] = useState<string>('rockfall'); // Selected scrounge location
  const [selectedInstances, setSelectedInstances] = useState<Set<string>>(new Set());
  const [draggedInstance, setDraggedInstance] = useState<string | null>(null);
  const [collectedItems, setCollectedItems] = useState<
    Array<{ name: string; materialType: string; emoji: string }>
  >([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false); // Toggle for device info and FPS
  const [explosions, setExplosions] = useState<
    Array<{ id: string; position: [number, number, number]; color: string }>
  >([]);
  const [collectingItems, setCollectingItems] = useState<
    Map<string, { startTime: number; meshId: string; instanceId: number }>
  >(new Map());

  // Toast notifications for collected items and growing/offering status
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      type:
        | 'coin'
        | 'gem'
        | 'growing'
        | 'offering'
        | 'insufficient_coins'
        | 'scrounge_location'
        | 'sold'
        | 'bought'
        | 'wallet';
      coinType?: string;
      gem?: Gem;
      timestamp: number;
      growingStatus?: 'started' | 'stopped'; // For 'growing' type toasts
      offeringStatus?: 'started' | 'stopped'; // For 'offering' type toasts
      message?: string; // For 'insufficient_coins', 'wallet' type toasts
      locationName?: string; // For 'scrounge_location' type toasts
      locationYields?: Array<{ type: 'coin' | 'gem'; color: string; shape?: string }>; // For 'scrounge_location' type toasts
      soldCount?: number; // For 'sold' type toasts - number of gems sold
      soldValue?: number; // For 'sold' type toasts - total bronze value
      boughtCount?: number; // For 'bought' type toasts - number of gems bought
      boughtValue?: number; // For 'bought' type toasts - total bronze value spent
      walletAction?: 'linked' | 'unlinked'; // For 'wallet' type toasts
    }>
  >([]);

  // Get dragged object details in garden mode
  const getDraggedObjectDetails = (): {
    type: 'coin' | 'gem';
    coinType?: string;
    gem?: Gem;
  } | null => {
    if (!draggedInstance || activeScene !== 'garden') {
      console.log('[DEBUG] No drag or not garden:', { draggedInstance, activeScene });
      return null;
    }

    console.log('[DEBUG] draggedInstance:', draggedInstance);
    const [meshIdStr, instanceIdStr] = draggedInstance.split(':');
    const meshIndex = parseInt(meshIdStr);
    const instanceId = parseInt(instanceIdStr);
    console.log('[DEBUG] Parsed:', {
      meshIndex,
      instanceId,
      totalGardenTypes: GARDEN_OBJECT_TYPES.length,
    });

    // In garden mode, meshIndex directly maps to GARDEN_OBJECT_TYPES
    const objectType = GARDEN_OBJECT_TYPES[meshIndex];

    if (!objectType) {
      console.log('[DEBUG] No objectType found at index', meshIndex);
      return null;
    }

    console.log('[DEBUG] Found objectType:', {
      name: objectType.name,
      materialType: objectType.materialType,
    });

    // Check if it's a coin
    if (objectType.materialType === 'coin') {
      let coinType = 'bronze';
      if (objectType.name.includes('gold')) {
        coinType = 'gold';
      } else if (objectType.name.includes('silver')) {
        coinType = 'silver';
      }
      console.log('[DEBUG] Returning coin:', { coinType });
      return { type: 'coin', coinType };
    }

    // Check if it's a gem
    if (objectType.materialType === 'gem') {
      // Parse the gem type and shape from the object name
      // Format: garden_{type}_{shape}
      const nameWithoutPrefix = objectType.name.replace('garden_', '');
      const nameParts = nameWithoutPrefix.split('_');
      const gemType = nameParts[0] as 'diamond' | 'emerald' | 'ruby' | 'sapphire' | 'amethyst';
      const gemShape = nameParts[1] as 'tetrahedron' | 'octahedron' | 'dodecahedron';

      // Find the specific gem from the grouped gems
      // IMPORTANT: Must match the grouping logic in GARDEN_OBJECT_TYPES
      // Sort by ID to ensure stable order
      const sortedGems = [...playerState.gems].sort((a, b) => a.id.localeCompare(b.id));

      // Group by type and shape (includes both inventory and growing gems)
      const key = `${gemType}_${gemShape}`;
      const gemsByTypeAndShape = sortedGems.reduce(
        (acc, gem) => {
          const k = `${gem.type}_${gem.shape}`;
          if (!acc[k]) {
            acc[k] = [];
          }
          acc[k].push(gem);
          return acc;
        },
        {} as Record<string, Gem[]>
      );

      const gems = gemsByTypeAndShape[key];
      console.log('[DEBUG] Gem lookup by key:', {
        key,
        gemsForKey: gems?.length,
        instanceId,
        foundGem: !!gems?.[instanceId],
      });
      if (gems && gems[instanceId]) {
        console.log('[DEBUG] Returning gem:', gems[instanceId]);
        return { type: 'gem', gem: gems[instanceId] };
      }
    }

    console.log('[DEBUG] Fell through to return null');
    return null;
  };

  // Player state - tracks collected items
  // ============================================================================
  // PRODUCTION: Clean initial state with no coins or gems
  // ============================================================================
  const [playerState, setPlayerState] = useState<PlayerState>({
    coins: {
      gold: 0,
      silver: 0,
      bronze: 0,
    },
    gems: [],
  });

  // ============================================================================
  // TEST DATA DISABLED - Uncomment below to test with starting items
  // ============================================================================
  /*
  const [playerState, setPlayerState] = useState<PlayerState>({
    coins: {
      gold: 25,
      silver: 50,
      bronze: 100,
    },
    gems: [
      // Test gems for immediate testing (marked with _DEBUG to track them)
      { ...createGem('emerald', 'common', 'octahedron'), id: 'DEBUG_emerald_1' },
      { ...createGem('sapphire', 'uncommon', 'tetrahedron'), id: 'DEBUG_sapphire_1' },
      { ...createGem('ruby', 'rare', 'dodecahedron'), id: 'DEBUG_ruby_1' },
      { ...createGem('diamond', 'epic', 'octahedron'), id: 'DEBUG_diamond_1' },
      { ...createGem('amethyst', 'legendary', 'octahedron'), id: 'DEBUG_amethyst_1' },
      { ...createGem('emerald', 'common', 'tetrahedron'), id: 'DEBUG_emerald_2' },
      { ...createGem('sapphire', 'uncommon', 'tetrahedron'), id: 'DEBUG_sapphire_2' },
      { ...createGem('ruby', 'rare', 'dodecahedron'), id: 'DEBUG_ruby_2' },
      { ...createGem('diamond', 'epic', 'octahedron'), id: 'DEBUG_diamond_2' },
      { ...createGem('emerald', 'common', 'octahedron'), id: 'DEBUG_emerald_3' },
    ],
  });
  */

  // ============================================================================
  // Player State Persistence - Load on mount, save on changes
  // ============================================================================

  // Load player state from server on mount
  useEffect(() => {
    const loadPlayerState = async () => {
      try {
        console.log('[LOAD] Fetching player state from server...');
        const data = await apiGet<LoadPlayerStateResponse>('/api/player-state/load');
        if (data.type === 'loadPlayerState' && data.playerState) {
          console.log('[LOAD] Player state loaded successfully:', {
            coins: data.playerState.coins,
            gemCount: data.playerState.gems.length,
            growingGems: data.playerState.gems.filter((g: Gem) => g.isGrowing).length,
            offeringGems: data.playerState.gems.filter((g: Gem) => g.isOffering).length,
          });
          setPlayerState(data.playerState);
        } else {
          console.log('[LOAD] No saved player state found, starting fresh');
        }
      } catch (error) {
        console.error('[LOAD] Error loading player state:', error);
      }
    };

    loadPlayerState();
  }, []); // Run only on mount

  // Save player state to server whenever it changes (debounced)
  useEffect(() => {
    // Don't save on initial mount (when state is empty)
    if (
      playerState.coins.gold === 0 &&
      playerState.coins.silver === 0 &&
      playerState.coins.bronze === 0 &&
      playerState.gems.length === 0
    ) {
      return;
    }

    const saveTimeout = setTimeout(async () => {
      try {
        console.log('[SAVE] Saving player state to server...', {
          coins: playerState.coins,
          gemCount: playerState.gems.length,
          growingGems: playerState.gems.filter((g) => g.isGrowing).length,
          offeringGems: playerState.gems.filter((g) => g.isOffering).length,
        });

        const data = await apiPost<SavePlayerStateResponse>('/api/player-state/save', {
          playerState,
        });

        if (data.type === 'savePlayerState' && data.success) {
          console.log('[SAVE] Player state saved successfully');
        }
      } catch (error) {
        console.error('[SAVE] Error saving player state:', error);
      }
    }, 1000); // Debounce: wait 1 second after last change before saving

    return () => clearTimeout(saveTimeout);
  }, [playerState]); // Run whenever playerState changes

  // Auto-sync player's offer when offering gems change
  useEffect(() => {
    const offeringGems = playerState.gems.filter((g) => g.isOffering);

    // Debounce offer updates to avoid spamming the server
    const offerUpdateTimeout = setTimeout(() => {
      if (offeringGems.length > 0) {
        // Update offer on server
        apiPost<UpdateOfferResponse>('/api/offers/update', { gems: offeringGems }).catch(
          (error) => {
            console.error('[OFFER SYNC] Failed to update offer:', error);
          }
        );
      } else {
        // Remove offer if no gems
        apiDelete<UpdateOfferResponse>('/api/offers/remove').catch((error) => {
          console.error('[OFFER SYNC] Failed to remove offer:', error);
        });
      }
    }, 2000); // Wait 2 seconds after last change

    return () => clearTimeout(offerUpdateTimeout);
  }, [
    // Only trigger when the list of offering gem IDs changes, not on every gem property change
    playerState.gems
      .filter((g) => g.isOffering)
      .map((g) => g.id)
      .join(','),
    effectiveUsername,
  ]);

  // Track count of objects in drag zone
  const [dragZoneCount, setDragZoneCount] = useState(0);
  // Track which instances are in drag zone (for debug highlighting)
  const [dragZoneInstances, setDragZoneInstances] = useState<Set<string>>(new Set());

  // Get level configuration based on active scene
  // In scrounge mode: use location-specific config
  // In garden mode: use standard level config
  const baseLevelConfig = useMemo(() => {
    return activeScene === 'scrounge'
      ? LOCATION_CONFIGS[selectedLocation] || LOCATION_CONFIGS['rockfall']!
      : LEVEL_CONFIGS[level] || LEVEL_CONFIGS[1]!;
  }, [activeScene, selectedLocation, level]);

  // Use manual override if set, otherwise use detected tier
  const activeTier = manualPerformanceTier || performanceTier;

  // Always use full object counts - only physics is affected by performance tier
  const levelConfig = baseLevelConfig;

  // Generate object types based on level (always at full count)
  const OBJECT_TYPES = useMemo(() => generateObjectTypes(levelConfig), [levelConfig]);
  const TOTAL_OBJECTS = useMemo(
    () => OBJECT_TYPES.reduce((sum, type) => sum + type.count, 0),
    [OBJECT_TYPES]
  );

  // Flag to enable/disable garden faucet (for troubleshooting)
  const GARDEN_FAUCET_ENABLED = true;

  // Garden object types - gems and coins based on player's collected items
  // Spawn positions defined at top of file (easy to tweak):
  // - Coins: COIN_SPAWN_X=0.9, COIN_SPAWN_Z=-0.85 (spawnHeight='far-bottom')
  // - Gems:  GEM_SPAWN_X=0.3, GEM_SPAWN_Z=-0.3 (spawnHeight='bottom')

  // Create a stable key that only tracks gem IDs (not their properties)
  // This prevents reinitialization when gem properties like isGrowing change
  const gemIdsKey = useMemo(
    () =>
      playerState.gems
        .map((g) => g.id)
        .sort()
        .join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerState.gems.length, ...playerState.gems.map((g) => g.id)]
  );

  const GARDEN_OBJECT_TYPES = useMemo((): ObjectTypeConfig[] => {
    const objects: ObjectTypeConfig[] = [
      // Coins - count matches player's collected coins
      {
        name: 'garden_gold_coins',
        count: playerState.coins.gold,
        geometry: <cylinderGeometry args={[0.04, 0.04, 0.008, 16]} />,
        collider: 'hull',
        baseSize: 0.04,
        color: '#FFD700', // Gold
        scaleRange: [0.8, 1.2],
        materialType: 'coin',
        spawnHeight: 'far-bottom', // Uses COIN_SPAWN_X, COIN_SPAWN_Z
        faucetId: 'coin-faucet',
      },
      {
        name: 'garden_silver_coins',
        count: playerState.coins.silver,
        geometry: <cylinderGeometry args={[0.04, 0.04, 0.008, 16]} />,
        collider: 'hull',
        baseSize: 0.04,
        color: '#C0C0C0', // Silver
        scaleRange: [0.8, 1.2],
        materialType: 'coin',
        spawnHeight: 'far-bottom', // Uses COIN_SPAWN_X, COIN_SPAWN_Z
        faucetId: 'coin-faucet',
      },
      {
        name: 'garden_bronze_coins',
        count: playerState.coins.bronze,
        geometry: <cylinderGeometry args={[0.04, 0.04, 0.008, 16]} />,
        collider: 'hull',
        baseSize: 0.04,
        color: '#CD7F32', // Bronze
        scaleRange: [0.8, 1.2],
        materialType: 'coin',
        spawnHeight: 'far-bottom', // Uses COIN_SPAWN_X, COIN_SPAWN_Z
        faucetId: 'coin-faucet',
      },
    ];

    // Group gems by type AND shape
    // In "Grow" mode: include both inventory and growing gems (filter out offering gems)
    // In "My Offer" mode: include both inventory and offering gems (filter out growing gems)
    // In other modes: only include inventory gems (filter out both growing and offering gems)
    const sortedGems = [...playerState.gems]
      .filter((gem) => {
        if (gardenAction === 'grow') {
          // In Grow mode: show inventory and growing gems, hide offering gems
          return !gem.isOffering;
        } else if (gardenAction === 'my-offer') {
          // In My Offer mode: show inventory and offering gems, hide growing gems
          return !gem.isGrowing;
        } else {
          // In other modes: only show inventory gems
          return !gem.isGrowing && !gem.isOffering;
        }
      })
      .sort((a, b) => a.id.localeCompare(b.id));

    // Group gems by both type AND shape to render efficiently
    const gemsByTypeAndShape = sortedGems.reduce(
      (acc, gem) => {
        const key = `${gem.type}_${gem.shape}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(gem);
        return acc;
      },
      {} as Record<string, Gem[]>
    );

    // Add gem objects for each type-shape combination
    // Use instanceSpawnZones to indicate which zone each gem should spawn in
    Object.entries(gemsByTypeAndShape).forEach(([key, gems]) => {
      if (gems.length > 0) {
        // Use the first gem's properties as representative
        const gem = gems[0];
        const color = gem.color;
        const shape = gem.shape;

        // Determine geometry based on shape (matches scrounge sizes)
        let geometry: JSX.Element;
        let baseSize: number;
        switch (shape) {
          case 'tetrahedron':
            geometry = <tetrahedronGeometry args={[0.063]} />;
            baseSize = 0.063;
            break;
          case 'dodecahedron':
            geometry = <dodecahedronGeometry args={[0.0525]} />;
            baseSize = 0.0525;
            break;
          case 'octahedron':
          default:
            geometry = <octahedronGeometry args={[0.06]} />;
            baseSize = 0.06;
            break;
        }

        // Determine which faucet to use based on whether ANY gem in this group is growing
        const hasGrowingGems = gems.some((g) => g.isGrowing);
        const hasInventoryGems = gems.some((g) => !g.isGrowing);

        // Use 'gem-faucet' if there are inventory gems, otherwise 'growing-gem-faucet'
        const faucetId = hasInventoryGems ? 'gem-faucet' : 'growing-gem-faucet';

        objects.push({
          name: `garden_${key}`,
          count: gems.length,
          geometry,
          collider: 'hull',
          baseSize,
          color,
          scaleRange: [0.6, 1.0],
          materialType: 'gem',
          spawnHeight: 'bottom', // Default spawn height (overridden by liveInstanceSpawnZones prop)
          faucetId,
          instanceScales: gems.map((gem) => gem.size / baseSize), // Scale = actual size / geometry base size
          // Note: instanceSpawnZones removed - we use liveInstanceSpawnZones prop instead for reactive updates
        });
      }
    });

    console.log(
      '[DEBUG] GARDEN_OBJECT_TYPES computed:',
      objects.map((o) => ({ name: o.name, count: o.count, materialType: o.materialType }))
    );

    // Log gem IDs being rendered in garden
    const gemObjects = objects.filter((o) => o.materialType === 'gem');
    gemObjects.forEach((obj) => {
      const nameWithoutPrefix = obj.name.replace('garden_', '');
      const [gemType, gemShape] = nameWithoutPrefix.split('_');
      const gemsForThisType = sortedGems.filter((g) => g.type === gemType && g.shape === gemShape);
      console.log(
        `[GARDEN RENDER] 🏡 Rendering ${gemsForThisType.length} ${obj.name} gems:`,
        gemsForThisType.map((g) => ({
          id: g.id,
          isGrowing: g.isGrowing,
          isOffering: g.isOffering,
          source: g.id.startsWith('DEBUG_') ? 'TEST' : 'SCROUNGE',
        }))
      );
    });

    return objects;
    // Recalculate when:
    // - Coins change
    // - Gems are added/removed (gemIdsKey changes)
    // - Garden action changes (to show/hide growing gems and trigger respawn)
    // NOT when isGrowing changes (handled by liveInstanceSpawnZones)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    playerState.coins.gold,
    playerState.coins.silver,
    playerState.coins.bronze,
    gemIdsKey,
    gardenAction,
  ]);

  // Create refs for each object type (scrounge mode)
  const objectApiRefs = useRef<React.RefObject<RapierRigidBody[]>[]>([]);
  const objectMeshRefs = useRef<React.RefObject<THREE.InstancedMesh | null>[]>([]);

  // Ensure we have the correct number of refs for all object types
  useEffect(() => {
    const neededLength = OBJECT_TYPES.length;
    const currentLength = objectApiRefs.current.length;

    if (currentLength < neededLength) {
      // Add missing refs
      for (let i = currentLength; i < neededLength; i++) {
        objectApiRefs.current.push({ current: [] });
        objectMeshRefs.current.push({ current: null });
      }
    } else if (currentLength > neededLength) {
      // Remove extra refs
      objectApiRefs.current.length = neededLength;
      objectMeshRefs.current.length = neededLength;
    }
  }, [OBJECT_TYPES]);

  // Create refs for garden object types
  const gardenApiRefs = useRef<React.RefObject<RapierRigidBody[]>[]>([]);
  const gardenMeshRefs = useRef<React.RefObject<THREE.InstancedMesh | null>[]>([]);

  // Ensure we have the correct number of refs for garden objects
  useEffect(() => {
    const neededLength = GARDEN_OBJECT_TYPES.length;
    const currentLength = gardenApiRefs.current.length;

    if (currentLength < neededLength) {
      // Add missing refs
      for (let i = currentLength; i < neededLength; i++) {
        gardenApiRefs.current.push({ current: [] });
        gardenMeshRefs.current.push({ current: null });
      }
    } else if (currentLength > neededLength) {
      // Remove extra refs
      gardenApiRefs.current.length = neededLength;
      gardenMeshRefs.current.length = neededLength;
    }
  }, [GARDEN_OBJECT_TYPES]);

  // Helper function to show scrounge location toast
  const showScroungeLocationToast = (locationId?: string) => {
    const locId = locationId || selectedLocation;
    const location = SCROUNGE_LOCATIONS.find((loc) => loc.id === locId);
    if (!location) return;

    const toastId = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        type: 'scrounge_location',
        locationName: location.name,
        locationYields: location.yields,
        timestamp: Date.now(),
      },
    ]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 3000);
  };

  // Show scrounge location toast on initial load
  useEffect(() => {
    // Show toast after a brief delay to ensure everything is loaded
    const timer = setTimeout(() => {
      showScroungeLocationToast();
    }, 500);

    return () => clearTimeout(timer);
  }, []); // Empty deps array means this runs once on mount

  // Handle scrounge tab click - refresh scene when coming from garden
  const handleScroungeClick = () => {
    const wasInGarden = activeScene === 'garden';
    console.log('[MODE SWITCH] Switching to Scrounge, wasInGarden:', wasInGarden);

    // CRITICAL: Stop dragging and clear all interaction state FIRST
    setIsDragging(false);
    setDraggedInstance(null);
    setSelectedInstances(new Set());
    setDragZoneInstances(new Set());

    // CRITICAL: Disable garden objects FIRST to stop all useFrame loops immediately
    setGardenObjectsActive(false);
    // Enable scrounge objects
    setScroungeObjectsActive(true);

    if (wasInGarden) {
      // Log garden refs status before cleanup
      console.log('[MODE SWITCH] Garden refs before cleanup:', {
        gardenRefsCount: gardenApiRefs.current.length,
        gardenRefsWithBodies: gardenApiRefs.current.filter(
          (ref) => ref.current && ref.current.length > 0
        ).length,
      });

      // Switching from garden, refresh the scene
      // Clear physics refs to prevent race conditions with old bodies
      objectApiRefs.current.forEach((ref) => {
        if (ref.current) {
          ref.current = [];
        }
      });

      // CRITICAL FIX: Also clear garden refs when switching away
      gardenApiRefs.current.forEach((ref) => {
        if (ref.current) {
          ref.current = [];
        }
      });
      console.log('[MODE SWITCH] Cleared both objectApiRefs and gardenApiRefs');

      // React 18 batches these updates into a single render
      setSceneKey((prev) => prev + 1);
    }

    setActiveScene('scrounge');
    setGameTab('scrounge');

    console.log('[MODE SWITCH] Switched to Scrounge mode, sceneKey will increment');

    // Show scrounge location toast when switching from garden
    if (wasInGarden) {
      showScroungeLocationToast();
    }
  };

  // Handle garden tab click
  const handleGardenClick = () => {
    const wasInScrounge = activeScene === 'scrounge';
    console.log('[MODE SWITCH] Switching to Garden, wasInScrounge:', wasInScrounge);

    // CRITICAL: Stop dragging and clear all interaction state FIRST
    setIsDragging(false);
    setDraggedInstance(null);
    setSelectedInstances(new Set());
    setDragZoneCount(0);
    setDragZoneInstances(new Set());

    // CRITICAL: Disable scrounge objects FIRST to stop all useFrame loops immediately
    setScroungeObjectsActive(false);
    // Enable garden objects
    setGardenObjectsActive(true);

    if (wasInScrounge) {
      // Log scrounge refs status before cleanup
      console.log('[MODE SWITCH] Scrounge refs before cleanup:', {
        objectRefsCount: objectApiRefs.current.length,
        objectRefsWithBodies: objectApiRefs.current.filter(
          (ref) => ref.current && ref.current.length > 0
        ).length,
      });

      // Clear scrounge physics refs when switching to garden
      objectApiRefs.current.forEach((ref) => {
        if (ref.current) {
          ref.current = [];
        }
      });
      console.log('[MODE SWITCH] Cleared objectApiRefs when switching to Garden');
    }

    setActiveScene('garden');
    setGameTab('garden');

    console.log('[MODE SWITCH] Switched to Garden mode');
  };

  // Handle garden action switches (Grow <-> My Offer)
  const handleGrowClick = () => {
    if (gardenAction === 'grow') return; // Already on grow

    console.log('[GARDEN ACTION] Switching to Grow - full remount');

    // Clear interaction state FIRST (like scene switches)
    setIsDragging(false);
    setDraggedInstance(null);
    setSelectedInstances(new Set());
    setDragZoneCount(0);
    setDragZoneInstances(new Set());

    // Clear garden refs to prevent race conditions with old bodies
    gardenApiRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current = [];
      }
    });
    gardenMeshRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current = null;
      }
    });
    console.log('[GARDEN ACTION] Cleared garden refs');

    // Increment sceneKey to force full remount (like scene switches)
    setSceneKey((prev) => prev + 1);

    // Change garden action
    setGardenAction('grow');

    console.log('[GARDEN ACTION] Switched to Grow, components will remount');
  };

  const handleOfferClick = () => {
    if (gardenAction === 'my-offer') return; // Already on my-offer

    console.log('[GARDEN ACTION] Switching to My Offer - full remount');

    // Clear interaction state FIRST (like scene switches)
    setIsDragging(false);
    setDraggedInstance(null);
    setSelectedInstances(new Set());
    setDragZoneCount(0);
    setDragZoneInstances(new Set());

    // Clear garden refs to prevent race conditions with old bodies
    gardenApiRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current = [];
      }
    });
    gardenMeshRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current = null;
      }
    });
    console.log('[GARDEN ACTION] Cleared garden refs');

    // Increment sceneKey to force full remount (like scene switches)
    setSceneKey((prev) => prev + 1);

    // Change garden action
    setGardenAction('my-offer');

    console.log('[GARDEN ACTION] Switched to My Offer, components will remount');
  };

  // Handle collecting an item
  const handleCollectItem = (meshId: string, instanceId: number) => {
    const meshIndex = parseInt(meshId);
    const objectType = OBJECT_TYPES[meshIndex];

    if (!objectType) return;

    // Only collect special items (gems and coins)
    if (!objectType.materialType || objectType.materialType === 'rock') return;

    // Get the rigid body position for the explosion
    const apiRef = objectApiRefs.current[meshIndex];
    if (!apiRef?.current || instanceId >= apiRef.current.length) return;

    const body = apiRef.current[instanceId];
    if (!body) return;

    const instanceKey = `${meshId}:${instanceId}`;

    // Set body to kinematic so it's not affected by physics during collection
    body.setBodyType(2, true);
    body.setLinvel({ x: 0, y: 0, z: 0 }, true);
    body.setAngvel({ x: 0, y: 0, z: 0 }, true);

    // Start the scale animation (using a ref to get current clock time will be handled in useFrame)
    setCollectingItems((prev) =>
      new Map(prev).set(instanceKey, {
        startTime: Date.now() / 1000, // Use Date.now for consistency
        meshId,
        instanceId,
      })
    );

    const bodyPos = body.translation();
    const explosionPosition: [number, number, number] = [bodyPos.x, bodyPos.y, bodyPos.z];

    // Create explosion (always golden color)
    const explosionId = `${meshId}-${instanceId}-${Date.now()}`;
    setExplosions((prev) => [
      ...prev,
      {
        id: explosionId,
        position: explosionPosition,
        color: '#FFD700',
      },
    ]);

    // Determine emoji based on material type and name
    let emoji = '💎';
    if (objectType.materialType === 'coin') {
      // All coins use the coin emoji (will be styled differently in UI)
      emoji = '🪙';
    } else if (objectType.materialType === 'gem') {
      emoji = '💎';
    }

    // Add to collected items
    setCollectedItems((prev) => [
      ...prev,
      {
        name: objectType.name,
        materialType: objectType.materialType || 'unknown',
        emoji,
      },
    ]);

    // Update player state with collected item
    setPlayerState((prev) => {
      const newState = { ...prev };

      if (objectType.materialType === 'coin') {
        // Determine coin type
        let coinType = 'bronze';
        if (objectType.name.includes('gold')) {
          newState.coins.gold += 1;
          coinType = 'gold';
        } else if (objectType.name.includes('silver')) {
          newState.coins.silver += 1;
          coinType = 'silver';
        } else if (objectType.name.includes('bronze')) {
          newState.coins.bronze += 1;
          coinType = 'bronze';
        }

        // Show toast for coin collection
        const toastId = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prev) => [
          ...prev,
          {
            id: toastId,
            type: 'coin',
            coinType,
            timestamp: Date.now(),
          },
        ]);

        // Auto-remove toast after 1 second
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 1000);
      } else if (objectType.materialType === 'gem') {
        // Create a unique gem with random rarity and specific type/shape based on collected object
        let gemType: 'diamond' | 'emerald' | 'ruby' | 'sapphire' | 'amethyst' = 'diamond';
        let gemShape: 'tetrahedron' | 'octahedron' | 'dodecahedron' = 'octahedron';

        // Determine gem type and shape from object name
        if (objectType.name.includes('diamond')) {
          gemType = 'diamond';
          gemShape = 'octahedron'; // Diamonds are octahedron shaped
        } else if (objectType.name.includes('emerald_tetra')) {
          gemType = 'emerald';
          gemShape = 'tetrahedron'; // Emerald tetrahedrons
        } else if (objectType.name.includes('emerald')) {
          gemType = 'emerald';
          gemShape = 'octahedron'; // Emerald octahedrons
        } else if (objectType.name.includes('ruby')) {
          gemType = 'ruby';
          gemShape = 'dodecahedron'; // Rubies are dodecahedron shaped
        } else if (objectType.name.includes('sapphire')) {
          gemType = 'sapphire';
          gemShape = 'tetrahedron'; // Sapphires are tetrahedron shaped
        } else if (objectType.name.includes('amethyst')) {
          gemType = 'amethyst';
          gemShape = 'octahedron'; // Amethysts are octahedron shaped
        }

        // Create unique gem with random rarity and determined type/shape
        const newGem = createGem(gemType, undefined, gemShape);
        // Mark gem as collected from scrounge (for debugging)
        console.log('[GEM COLLECTION] 🔶 Collected gem from SCROUNGE:', {
          gemId: newGem.id,
          type: newGem.type,
          shape: newGem.shape,
          rarity: newGem.rarity,
          source: 'SCROUNGE',
          meshId,
          instanceId,
        });
        newState.gems = [...prev.gems, newGem];

        // Show toast for gem collection
        const toastId = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prev) => [
          ...prev,
          {
            id: toastId,
            type: 'gem',
            gem: newGem,
            timestamp: Date.now(),
          },
        ]);

        // Auto-remove toast after 1 second
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toastId));
        }, 1000);
      }

      return newState;
    });

    // Remove item after animation completes (0.5 seconds)
    setTimeout(() => {
      // Move item far away
      if (body) {
        body.setTranslation({ x: 0, y: -1000, z: 0 }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }

      // Remove from collecting items
      setCollectingItems((prev) => {
        const newMap = new Map(prev);
        newMap.delete(instanceKey);
        return newMap;
      });
    }, 500);
  };

  // Remove completed explosion
  const removeExplosion = (id: string) => {
    setExplosions((prev) => prev.filter((exp) => exp.id !== id));
  };

  // Handle dropping items in garden mode
  const handleGardenDrop = (meshId: string, instanceId: number) => {
    // Only process in Grow or My Offer modes
    if (gardenAction !== 'grow' && gardenAction !== 'my-offer') return;

    const instanceKey = `${meshId}:${instanceId}`;
    console.log('[GARDEN DROP] Checking drop location:', instanceKey, {
      meshId,
      instanceId,
      gardenAction,
      activeScene,
      gardenRefsCount: gardenApiRefs.current.length,
    });

    // Get the body and check its position directly
    const meshIndex = parseInt(meshId);
    const apiRef = gardenApiRefs.current[meshIndex];

    // Enhanced null checks with detailed logging
    if (!apiRef) {
      console.error('[GARDEN DROP] API ref not found for meshIndex:', meshIndex, {
        totalGardenRefs: gardenApiRefs.current.length,
        availableIndices: gardenApiRefs.current.map((_, i) => i),
      });
      return;
    }

    if (!apiRef.current) {
      console.error('[GARDEN DROP] API ref.current is null for meshIndex:', meshIndex);
      return;
    }

    if (instanceId >= apiRef.current.length) {
      console.error('[GARDEN DROP] Instance ID out of bounds:', {
        instanceId,
        availableBodies: apiRef.current.length,
      });
      return;
    }

    const body = apiRef.current[instanceId];
    if (!body) {
      console.error('[GARDEN DROP] Body is null at index:', instanceId);
      return;
    }

    // Check if body is valid and not sleeping (can cause issues)
    try {
      if (body.isSleeping && body.isSleeping()) {
        console.warn('[GARDEN DROP] Body is sleeping, waking it up');
        body.wakeUp();
      }
    } catch (error) {
      console.error('[GARDEN DROP] Error checking body sleep state:', error);
      return;
    }

    let pos;
    try {
      pos = body.translation();
      console.log('[GARDEN DROP] Body position:', { x: pos.x, y: pos.y, z: pos.z });
    } catch (error) {
      console.error('[GARDEN DROP] Error getting body translation:', error);
      return;
    }

    const inDragZone = isInDragZoneWithFloorCheck(pos.x, pos.y, pos.z);
    console.log('[GARDEN DROP] In drag zone:', inDragZone);

    // Get the object details
    const details = getDraggedObjectDetails();
    if (!details || details.type !== 'gem' || !details.gem) {
      console.log('[GARDEN DROP] Not a gem, ignoring');
      return;
    }

    const gem = details.gem;
    console.log('[GARDEN DROP] 💎 Processing gem:', {
      gemId: gem.id,
      type: gem.type,
      shape: gem.shape,
      isGrowing: gem.isGrowing,
      isOffering: gem.isOffering,
      source: gem.id.startsWith('DEBUG_') ? 'TEST' : 'SCROUNGE',
      instanceKey,
    });

    // Handle based on garden action
    if (gardenAction === 'grow') {
      // Toggle isGrowing flag based on whether gem is in drag zone
      setPlayerState((prev) => {
        const targetGrowingState = inDragZone;

        // If the gem is already in the desired state, no change needed
        if (gem.isGrowing === targetGrowingState) {
          console.log(
            '[GARDEN DROP] Gem already in correct state:',
            targetGrowingState ? 'growing' : 'inventory'
          );
          return prev;
        }

        console.log(
          '[GARDEN DROP] Toggling gem state:',
          gem.id,
          'isGrowing:',
          gem.isGrowing,
          '->',
          targetGrowingState
        );

        // Show toast notification for growing status change
        const toastId = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prevToasts) => [
          ...prevToasts,
          {
            id: toastId,
            type: 'growing',
            gem: gem,
            timestamp: Date.now(),
            growingStatus: targetGrowingState ? 'started' : 'stopped',
          },
        ]);

        // Auto-remove toast after 1 second
        setTimeout(() => {
          setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId));
        }, 1000);

        // Update the gem's isGrowing flag
        return {
          ...prev,
          gems: prev.gems.map((g) =>
            g.id === gem.id ? { ...g, isGrowing: targetGrowingState } : g
          ),
        };
      });
    } else if (gardenAction === 'my-offer') {
      // Toggle isOffering flag based on whether gem is in drag zone
      setPlayerState((prev) => {
        const targetOfferingState = inDragZone;

        // If the gem is already in the desired state, no change needed
        if (gem.isOffering === targetOfferingState) {
          console.log(
            '[GARDEN DROP] Gem already in correct state:',
            targetOfferingState ? 'offering' : 'inventory'
          );
          return prev;
        }

        console.log(
          '[GARDEN DROP] Toggling gem state:',
          gem.id,
          'isOffering:',
          gem.isOffering,
          '->',
          targetOfferingState
        );

        // Show toast notification for offering status change
        const toastId = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prevToasts) => [
          ...prevToasts,
          {
            id: toastId,
            type: 'offering',
            gem: gem,
            timestamp: Date.now(),
            offeringStatus: targetOfferingState ? 'started' : 'stopped',
          },
        ]);

        // Auto-remove toast after 1 second
        setTimeout(() => {
          setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId));
        }, 1000);

        // Update the gem's isOffering flag
        return {
          ...prev,
          gems: prev.gems.map((g) =>
            g.id === gem.id ? { ...g, isOffering: targetOfferingState } : g
          ),
        };
      });
    }
  };

  // Debug: Convert all gems to selected type and shape
  const convertAllGemsToType = () => {
    setPlayerState((prev) => ({
      ...prev,
      gems: prev.gems.map((gem) => createGem(debugGemType, gem.rarity, debugGemShape)),
    }));
  };

  // Reset scene to initial state
  const resetScene = () => {
    // Clear collected items, explosions, and collecting animations
    setCollectedItems([]);
    setExplosions([]);
    setCollectingItems(new Map());

    // Don't try to reset physics bodies if in garden mode (objects not rendered)
    if (activeScene === 'garden') return;

    // Use spawn positions defined at top of file
    objectApiRefs.current.forEach((apiRef, index) => {
      if (apiRef.current) {
        const objectType = OBJECT_TYPES[index];
        if (!objectType) return;

        apiRef.current.forEach((body) => {
          if (body) {
            // Determine spawn position based on spawnHeight setting
            let x: number, y: number, z: number;
            if (objectType.spawnHeight === 'far-bottom') {
              // Coins - diamond-shaped zone, elongated along X and Z
              let xNorm, zNorm;
              do {
                xNorm = Math.random() * 2 - 1;
                zNorm = Math.random() * 2 - 1;
              } while (Math.abs(xNorm) / 1.5 + Math.abs(zNorm) / 1.0 > 1);
              x = COIN_SPAWN_X + xNorm * COIN_SPAWN_RADIUS;
              y = Math.random() * 0.8 - 0.3;
              z = COIN_SPAWN_Z + zNorm * COIN_SPAWN_RADIUS;
            } else if (objectType.spawnHeight === 'bottom') {
              // Gems - diamond-shaped zone, elongated along X and Z
              let xNorm, zNorm;
              do {
                xNorm = Math.random() * 2 - 1;
                zNorm = Math.random() * 2 - 1;
              } while (Math.abs(xNorm) / 1.0 + Math.abs(zNorm) / 1.5 > 1);
              x = GEM_SPAWN_X + xNorm * GEM_SPAWN_RADIUS;
              y = Math.random() * 0.8 - 0.3;
              z = GEM_SPAWN_Z + zNorm * GEM_SPAWN_RADIUS;
            } else {
              // Normal spawn (throughout the pile)
              x = Math.random() - 0.5;
              y = Math.random() * 2;
              z = Math.random() - 0.5;
            }

            body.setTranslation({ x, y, z }, true);
            body.setLinvel({ x: 0, y: 0, z: 0 }, true);
            body.setAngvel({ x: 0, y: 0, z: 0 }, true);
          }
        });
      }
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a1510' }}>
      {/* Performance Info Component */}
      <PerformanceInfo
        performanceInfo={performanceInfo}
        showDebugInfo={showDebugInfo}
        manualPerformanceTier={manualPerformanceTier}
        onManualTierChange={setManualPerformanceTier}
        activeTier={activeTier}
      />

      {/* Toast Notifications - Slide from top */}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'none',
            width: '90%',
            maxWidth: 400,
          }}
        >
          {toasts.map((toast, index) => {
            // Determine background color for growing/offering toasts
            let background = 'rgba(0, 0, 0, 0.9)';
            let border =
              toast.type === 'gem'
                ? `2px solid ${toast.gem?.color || '#FFD700'}`
                : `2px solid ${getCoinColor(toast.coinType || 'bronze')}`;

            if (toast.type === 'growing') {
              background =
                toast.growingStatus === 'started'
                  ? 'rgba(0, 150, 0, 0.9)' // Green background for "Now growing"
                  : 'rgba(180, 0, 0, 0.9)'; // Red background for "Stopped growing"
              border = `2px solid ${toast.gem?.color || '#FFD700'}`;
            } else if (toast.type === 'offering') {
              background =
                toast.offeringStatus === 'started'
                  ? 'rgba(0, 100, 200, 0.9)' // Blue background for "Now offering"
                  : 'rgba(180, 0, 0, 0.9)'; // Red background for "Stopped offering"
              border = `2px solid ${toast.gem?.color || '#FFD700'}`;
            } else if (toast.type === 'insufficient_coins') {
              background = 'rgba(180, 0, 0, 0.9)'; // Red background for error
              border = '2px solid #ff6b6b';
            } else if (toast.type === 'sold') {
              background = 'rgba(0, 150, 0, 0.9)'; // Green background for successful sale
              border = '2px solid #4CAF50';
            } else if (toast.type === 'bought') {
              background = 'rgba(0, 120, 215, 0.9)'; // Blue background for successful purchase
              border = '2px solid #2196F3';
            } else if (toast.type === 'scrounge_location') {
              background = 'rgba(139, 111, 71, 0.95)'; // Brown background for scrounge location
              border = '2px solid #d4a574';
            } else if (toast.type === 'wallet') {
              background =
                toast.walletAction === 'linked'
                  ? 'rgba(76, 175, 80, 0.9)' // Green background for wallet linked
                  : 'rgba(100, 100, 100, 0.9)'; // Gray background for wallet unlinked
              border =
                toast.walletAction === 'linked'
                  ? '2px solid #4CAF50' // Green border for linked
                  : '2px solid #999'; // Gray border for unlinked
            }

            return (
              <div
                key={toast.id}
                style={{
                  background,
                  border,
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(10px)',
                  animation: 'slideDown 0.3s ease-out',
                  marginTop: index === 0 ? 20 : 0,
                }}
              >
                {toast.type === 'gem' && toast.gem && (
                  <>
                    <GemIcon shape={toast.gem.shape} size={24} color={toast.gem.color} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        <span style={{ color: getRarityColor(toast.gem.rarity) }}>
                          {toast.gem.rarity.charAt(0).toUpperCase() + toast.gem.rarity.slice(1)}
                        </span>{' '}
                        <span style={{ color: 'white' }}>{GEM_TYPE_NAMES[toast.gem.type]}</span>
                      </span>
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                      >
                        {toast.gem.growthRate}x growth • {(toast.gem.size * 1000).toFixed(0)}mm
                      </span>
                    </div>
                  </>
                )}
                {toast.type === 'coin' && toast.coinType && (
                  <>
                    <CoinIcon color={getCoinColor(toast.coinType)} size={24} />
                    <span
                      style={{
                        color: getCoinColor(toast.coinType),
                        fontSize: 14,
                        fontWeight: 'bold',
                        flex: 1,
                      }}
                    >
                      {toast.coinType.charAt(0).toUpperCase() + toast.coinType.slice(1)} Coin
                    </span>
                  </>
                )}
                {toast.type === 'growing' && toast.gem && (
                  <>
                    <GemIcon shape={toast.gem.shape} size={24} color={toast.gem.color} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        <span style={{ color: 'white' }}>
                          {toast.growingStatus === 'started' ? 'Now growing' : 'Stopped growing'}
                        </span>{' '}
                        <span style={{ color: getRarityColor(toast.gem.rarity) }}>
                          {toast.gem.rarity.charAt(0).toUpperCase() + toast.gem.rarity.slice(1)}
                        </span>{' '}
                        <span style={{ color: 'white' }}>{GEM_TYPE_NAMES[toast.gem.type]}</span>
                      </span>
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                      >
                        {toast.gem.growthRate}x growth • {(toast.gem.size * 1000).toFixed(0)}mm
                      </span>
                    </div>
                  </>
                )}
                {toast.type === 'offering' && toast.gem && (
                  <>
                    <GemIcon shape={toast.gem.shape} size={24} color={toast.gem.color} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        <span style={{ color: 'white' }}>
                          {toast.offeringStatus === 'started' ? 'Now offering' : 'Stopped offering'}
                        </span>{' '}
                        <span style={{ color: getRarityColor(toast.gem.rarity) }}>
                          {toast.gem.rarity.charAt(0).toUpperCase() + toast.gem.rarity.slice(1)}
                        </span>{' '}
                        <span style={{ color: 'white' }}>{GEM_TYPE_NAMES[toast.gem.type]}</span>
                      </span>
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                      >
                        {toast.gem.growthRate}x growth • {(toast.gem.size * 1000).toFixed(0)}mm
                      </span>
                    </div>
                  </>
                )}
                {toast.type === 'insufficient_coins' && (
                  <>
                    <div
                      style={{
                        fontSize: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ⚠️
                    </div>
                    <span
                      style={{
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 'bold',
                        flex: 1,
                      }}
                    >
                      {toast.message || 'Not enough coins'}
                    </span>
                  </>
                )}
                {toast.type === 'sold' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>💰</span>
                      <span
                        style={{
                          color: 'white',
                          fontSize: 14,
                          fontWeight: 'bold',
                        }}
                      >
                        Sold {toast.soldCount} {toast.soldCount === 1 ? 'gem' : 'gems'} for{' '}
                        <CoinValueDisplay
                          bronzeValue={toast.soldValue || 0}
                          size={14}
                          reverse={true}
                        />
                      </span>
                    </div>
                  </div>
                )}
                {toast.type === 'bought' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>💎</span>
                      <span
                        style={{
                          color: 'white',
                          fontSize: 14,
                          fontWeight: 'bold',
                        }}
                      >
                        Bought {toast.boughtCount} {toast.boughtCount === 1 ? 'gem' : 'gems'} for{' '}
                        <CoinValueDisplay
                          bronzeValue={toast.boughtValue || 0}
                          size={14}
                          reverse={true}
                        />
                      </span>
                    </div>
                  </div>
                )}
                {toast.type === 'scrounge_location' && toast.locationName && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      flex: 1,
                    }}
                  >
                    {/* Location Name */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16 }}>⛏️</span>
                      <span
                        style={{
                          color: 'white',
                          fontSize: 14,
                          fontWeight: 'bold',
                        }}
                      >
                        Now scrounging at {toast.locationName}
                      </span>
                    </div>

                    {/* Yield Icons */}
                    {toast.locationYields && toast.locationYields.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        {toast.locationYields.map((yieldItem, idx) => (
                          <div key={idx}>
                            {yieldItem.type === 'coin' ? (
                              <CoinIcon color={yieldItem.color} size={12} />
                            ) : (
                              <GemIcon
                                shape={(yieldItem.shape || 'octahedron') as any}
                                size={12}
                                color={yieldItem.color}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Instructions */}
                    <div
                      style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: 10,
                        fontStyle: 'italic',
                        lineHeight: 1.3,
                      }}
                    >
                      Swipe across screen to scrounge. Tap or drag found objects to pick them up
                    </div>
                  </div>
                )}
                {toast.type === 'wallet' && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      flex: 1,
                    }}
                  >
                    <span style={{ fontSize: 24 }}>
                      {toast.walletAction === 'linked' ? '🔗' : '🔓'}
                    </span>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          color: 'white',
                          fontSize: 14,
                          fontWeight: 'bold',
                        }}
                      >
                        {toast.walletAction === 'linked' ? 'Wallet Linked' : 'Wallet Unlinked'}
                      </span>
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: 11,
                        }}
                      >
                        {toast.message}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Dragged Object Details - Garden Mode */}
      {activeScene === 'garden' &&
        draggedInstance &&
        (() => {
          console.log(
            '[DEBUG] Rendering dragged object UI, activeScene:',
            activeScene,
            'draggedInstance:',
            draggedInstance
          );
          const details = getDraggedObjectDetails();
          console.log('[DEBUG] getDraggedObjectDetails returned:', details);
          if (!details) return null;

          return (
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 2000,
                pointerEvents: 'none',
                width: '90%',
                maxWidth: 400,
              }}
            >
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  border:
                    details.type === 'gem'
                      ? `2px solid ${details.gem?.color || '#FFD700'}`
                      : `2px solid ${getCoinColor(details.coinType || 'bronze')}`,
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                {details.type === 'gem' && details.gem && (
                  <>
                    <GemIcon shape={details.gem.shape} size={24} color={details.gem.color} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      >
                        <span style={{ color: getRarityColor(details.gem.rarity) }}>
                          {details.gem.rarity.charAt(0).toUpperCase() + details.gem.rarity.slice(1)}
                        </span>{' '}
                        <span style={{ color: 'white' }}>{GEM_TYPE_NAMES[details.gem.type]}</span>
                      </span>
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: 10,
                          fontFamily: 'monospace',
                        }}
                      >
                        {details.gem.growthRate}x growth • {(details.gem.size * 1000).toFixed(0)}mm
                      </span>
                    </div>
                  </>
                )}
                {details.type === 'coin' && details.coinType && (
                  <>
                    <CoinIcon color={getCoinColor(details.coinType)} size={24} />
                    <span
                      style={{
                        color: getCoinColor(details.coinType),
                        fontSize: 14,
                        fontWeight: 'bold',
                        flex: 1,
                      }}
                    >
                      {details.coinType.charAt(0).toUpperCase() + details.coinType.slice(1)} Coin
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })()}

      {/* Sidebar Toggle Button */}
      <button
        {...createMobileFriendlyHandlers(() => setSidebarOpen(!sidebarOpen))}
        style={{
          position: 'absolute',
          bottom: 20,
          left: sidebarOpen ? 200 : 20,
          zIndex: 10001,
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: 'none',
          padding: '16px 20px',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 24,
          fontWeight: 'bold',
          transition: 'left 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          ...localMobileFriendlyButtonStyles,
        }}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Collapsible Sidebar */}
      <div
        data-sidebar="true"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: sidebarOpen ? 0 : -180,
          width: 180,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 1000,
          transition: 'left 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: sidebarOpen ? '2px 0 12px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <div
          style={{
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 15,
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Tab Content Area */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: 10,
              gap: 10,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Scrounge Tab */}
            {gameTab === 'scrounge' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 10,
                    fontWeight: 'bold',
                    paddingBottom: 8,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    flexShrink: 0,
                  }}
                >
                  ⛏️ Scrounge Locations
                </div>

                {/* Coins Indicator */}
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    justifyContent: 'space-around',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    flexShrink: 0,
                  }}
                >
                  <CoinBalance
                    coins={playerState.coins}
                    size={14}
                    fontSize={11}
                    fontFamily="monospace"
                    gap={10}
                    showZero
                  />
                </div>

                {/* Helper Text */}
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontSize: 7,
                    fontStyle: 'italic',
                    textAlign: 'center',
                    paddingBottom: 4,
                    flexShrink: 0,
                  }}
                >
                  Tap the same location to retry
                </div>

                {/* Scrollable Locations List */}
                <div
                  className="hide-scrollbar"
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    paddingRight: 4,
                    WebkitOverflowScrolling: 'touch',
                    minHeight: 0,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                  }}
                >
                  {SCROUNGE_LOCATIONS.map((location) => {
                    // Check if player can afford this location (or debug mode is on)
                    const canAfford =
                      debugMode ||
                      (playerState.coins.bronze >= location.cost.bronze &&
                        playerState.coins.silver >= location.cost.silver &&
                        playerState.coins.gold >= location.cost.gold);
                    const isDisabled = location.comingSoon || !canAfford;

                    return (
                      <button
                        key={location.id}
                        disabled={isDisabled}
                        {...createMobileFriendlyHandlers(() => {
                          // Check if location is coming soon
                          if (location.comingSoon) return;

                          // Check if player can't afford this location
                          if (!canAfford) {
                            // Show toast notification for insufficient coins
                            const toastId = `toast-${Date.now()}-${Math.random()}`;
                            setToasts((prev) => [
                              ...prev,
                              {
                                id: toastId,
                                type: 'insufficient_coins',
                                message: 'Not enough coins',
                                timestamp: Date.now(),
                              },
                            ]);

                            // Auto-remove toast after 2 seconds
                            setTimeout(() => {
                              setToasts((prev) => prev.filter((t) => t.id !== toastId));
                            }, 2000);
                            return;
                          }

                          // If switching to a different location, pay the cost (unless debug mode)
                          if (selectedLocation !== location.id) {
                            if (!debugMode) {
                              setPlayerState((prev) => ({
                                ...prev,
                                coins: {
                                  bronze: prev.coins.bronze - location.cost.bronze,
                                  silver: prev.coins.silver - location.cost.silver,
                                  gold: prev.coins.gold - location.cost.gold,
                                },
                              }));
                            }

                            // Show toast notification for new location
                            showScroungeLocationToast(location.id);
                          }

                          setSelectedLocation(location.id);
                          setSceneKey((prev) => prev + 1); // Refresh scene with new location
                        })}
                        style={{
                          ...localMobileFriendlyButtonStyles,
                          background:
                            selectedLocation === location.id
                              ? '#8b6f47'
                              : 'rgba(255, 255, 255, 0.1)',
                          border:
                            selectedLocation === location.id
                              ? '2px solid #d4a574'
                              : '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: 8,
                          padding: '14px 12px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          opacity: isDisabled ? 0.5 : 1,
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: 8,
                          minHeight: location.minHeight,
                        }}
                      >
                        <span
                          style={{
                            color:
                              selectedLocation === location.id
                                ? '#ffffff'
                                : 'rgba(255, 255, 255, 0.6)',
                            fontSize: 10,
                            fontWeight: 'bold',
                            lineHeight: '12px',
                          }}
                        >
                          {location.name}
                        </span>
                        <span
                          style={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: 7,
                            fontStyle: 'italic',
                            lineHeight: '10px',
                          }}
                        >
                          {location.description}
                        </span>
                        {location.comingSoon ? (
                          <span
                            style={{
                              color: '#ffffff',
                              fontSize: 10,
                              fontStyle: 'italic',
                              marginTop: 4,
                              alignSelf: 'center',
                            }}
                          >
                            Coming soon
                          </span>
                        ) : (
                          <>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                marginTop: 2,
                              }}
                            >
                              <span
                                style={{
                                  color: 'rgba(255, 255, 255, 0.4)',
                                  fontSize: 6,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                Yields:
                              </span>
                              {location.yields.map((item, idx) =>
                                item.type === 'gem' && 'shape' in item ? (
                                  <GemIcon
                                    key={idx}
                                    shape={item.shape as import('./types/game').GemShape}
                                    size={10}
                                    color={item.color}
                                  />
                                ) : item.type === 'coin' ? (
                                  <CoinIcon key={idx} color={item.color} size={10} />
                                ) : null
                              )}
                            </div>
                            {/* Cost Display */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  fontSize: 7,
                                  fontWeight: 'bold',
                                }}
                              >
                                Cost:
                              </span>
                              <CoinCost
                                cost={location.cost as Coins}
                                playerCoins={playerState.coins}
                                size={8}
                                fontSize={7}
                              />
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* My Garden Tab */}
            {gameTab === 'garden' && (
              <div
                className="hide-scrollbar"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 10,
                    fontWeight: 'bold',
                    paddingBottom: 8,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CombinedGemsIcon size={16} />
                  <span>My Garden</span>
                </div>

                {/* Coins Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: 8,
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Coins
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      justifyContent: 'space-around',
                      alignItems: 'center',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                  >
                    <CoinBalance
                      coins={playerState.coins}
                      size={14}
                      fontSize={11}
                      fontFamily="monospace"
                      gap={10}
                      showZero
                    />
                  </div>
                </div>

                {/* Gems Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 8,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Gems
                    </span>
                    <span
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: 8,
                        fontFamily: 'monospace',
                      }}
                    >
                      {playerState.gems.filter((g) => !g.isGrowing && !g.isOffering).length}
                    </span>
                  </div>

                  <GemList
                    gems={playerState.gems}
                    filter={(g) => !g.isGrowing && !g.isOffering}
                    emptyMessage="No gems yet"
                  />
                </div>

                {/* Growing Gems Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 8,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Growing Gems
                    </span>
                    <span
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: 8,
                        fontFamily: 'monospace',
                      }}
                    >
                      {playerState.gems.filter((g) => g.isGrowing).length}
                    </span>
                  </div>

                  <GemList
                    gems={playerState.gems}
                    filter={(g) => g.isGrowing}
                    emptyMessage="No gems growing"
                  />
                </div>

                {/* Offering Gems Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 8,
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Offering Gems
                    </span>
                    <span
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: 8,
                        fontFamily: 'monospace',
                      }}
                    >
                      {playerState.gems.filter((g) => g.isOffering).length}
                    </span>
                  </div>

                  <GemList
                    gems={playerState.gems}
                    filter={(g) => g.isOffering}
                    emptyMessage="No gems being offered"
                  />
                </div>

                {/* Debug Controls for Garden */}
                {debugMode && (
                  <>
                    {/* Faucet Controls */}
                    <div
                      style={{
                        marginTop: 12,
                        padding: 10,
                        background: 'rgba(255, 100, 100, 0.1)',
                        border: '1px solid rgba(255, 100, 100, 0.3)',
                        borderRadius: 6,
                      }}
                    >
                      <div
                        style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: 8,
                          fontWeight: 'bold',
                          marginBottom: 8,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        🔧 Debug: Garden Faucets
                      </div>

                      {/* Coin Faucet Toggle */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: 8,
                          }}
                        >
                          Coin Faucet 🪙
                        </span>
                        <button
                          {...createMobileFriendlyHandlers(() => {
                            setFaucetConfigs((prev) => {
                              const coinConfig =
                                prev['coin-faucet'] || GARDEN_FAUCET_CONFIGS['coin-faucet'];
                              return {
                                ...prev,
                                'coin-faucet': {
                                  ...coinConfig,
                                  enabled: !coinConfig?.enabled,
                                },
                              };
                            });
                          })}
                          style={{
                            background: faucetConfigs['coin-faucet']?.enabled ? '#4caf50' : '#666',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 8,
                            fontWeight: 'bold',
                            ...mobileFriendlyButtonStyles,
                          }}
                        >
                          {faucetConfigs['coin-faucet']?.enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {/* Gem Faucet Toggle */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: 8,
                          }}
                        >
                          Gem Faucet 💎
                        </span>
                        <button
                          {...createMobileFriendlyHandlers(() => {
                            setFaucetConfigs((prev) => {
                              const gemConfig =
                                prev['gem-faucet'] || GARDEN_FAUCET_CONFIGS['gem-faucet'];
                              return {
                                ...prev,
                                'gem-faucet': {
                                  ...gemConfig,
                                  enabled: !gemConfig?.enabled,
                                },
                              };
                            });
                          })}
                          style={{
                            background: faucetConfigs['gem-faucet']?.enabled ? '#4caf50' : '#666',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 8,
                            fontWeight: 'bold',
                            ...mobileFriendlyButtonStyles,
                          }}
                        >
                          {faucetConfigs['gem-faucet']?.enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {/* Growing Gem Faucet Toggle */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: 8,
                          }}
                        >
                          Growing Gem Faucet 🌱
                        </span>
                        <button
                          {...createMobileFriendlyHandlers(() => {
                            setFaucetConfigs((prev) => {
                              const growingGemConfig =
                                prev['growing-gem-faucet'] ||
                                GARDEN_FAUCET_CONFIGS['growing-gem-faucet'];
                              return {
                                ...prev,
                                'growing-gem-faucet': {
                                  ...growingGemConfig,
                                  enabled: !growingGemConfig?.enabled,
                                },
                              };
                            });
                          })}
                          style={{
                            background: faucetConfigs['growing-gem-faucet']?.enabled
                              ? '#4caf50'
                              : '#666',
                            color: 'white',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 8,
                            fontWeight: 'bold',
                            ...mobileFriendlyButtonStyles,
                          }}
                        >
                          {faucetConfigs['growing-gem-faucet']?.enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Gem Conversion Controls */}
                    <div
                      style={{
                        marginTop: 8,
                        padding: 10,
                        background: 'rgba(100, 100, 255, 0.1)',
                        border: '1px solid rgba(100, 100, 255, 0.3)',
                        borderRadius: 6,
                      }}
                    >
                      <div
                        style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: 8,
                          fontWeight: 'bold',
                          marginBottom: 8,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        💎 Debug: Convert All Gems
                      </div>

                      {/* Gem Type Selection */}
                      <div
                        style={{
                          marginBottom: 8,
                        }}
                      >
                        <label
                          style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: 7,
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          Gem Type:
                        </label>
                        <select
                          value={debugGemType}
                          onChange={(e) => setDebugGemType(e.target.value as any)}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 4,
                            padding: '6px 8px',
                            fontSize: 8,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="diamond" style={{ background: '#1a1510' }}>
                            💎 Diamond (Clear)
                          </option>
                          <option value="emerald" style={{ background: '#1a1510' }}>
                            💚 Emerald (Green)
                          </option>
                          <option value="ruby" style={{ background: '#1a1510' }}>
                            ❤️ Ruby (Red)
                          </option>
                          <option value="sapphire" style={{ background: '#1a1510' }}>
                            💙 Sapphire (Blue)
                          </option>
                          <option value="amethyst" style={{ background: '#1a1510' }}>
                            💜 Amethyst (Purple)
                          </option>
                        </select>
                      </div>

                      {/* Gem Shape Selection */}
                      <div
                        style={{
                          marginBottom: 8,
                        }}
                      >
                        <label
                          style={{
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: 7,
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          Gem Shape:
                        </label>
                        <select
                          value={debugGemShape}
                          onChange={(e) => setDebugGemShape(e.target.value as any)}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: 4,
                            padding: '6px 8px',
                            fontSize: 8,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="tetrahedron" style={{ background: '#1a1510' }}>
                            △ Tetrahedron (Pyramid)
                          </option>
                          <option value="octahedron" style={{ background: '#1a1510' }}>
                            ◆ Octahedron (Diamond)
                          </option>
                          <option value="dodecahedron" style={{ background: '#1a1510' }}>
                            ⬟ Dodecahedron (Pentagon)
                          </option>
                        </select>
                      </div>

                      {/* Convert Button */}
                      <button
                        {...createMobileFriendlyHandlers(convertAllGemsToType)}
                        style={{
                          width: '100%',
                          background: '#6666ff',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 8,
                          fontWeight: 'bold',
                          ...mobileFriendlyButtonStyles,
                        }}
                      >
                        Convert All Gems
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Trade Tab */}
            {gameTab === 'hoard' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
                className="hide-scrollbar"
                onScroll={(e) => {
                  const target = e.target as HTMLDivElement;
                  const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                  if (bottom && hasMoreUsers && !loadingUsers && tradeAction === 'town') {
                    fetchActiveOffers(followedUsersCursor);
                  }
                }}
              >
                <style>{`
                      .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                      }
                    `}</style>

                {/* Town Subtab - P2P Trading */}
                {tradeAction === 'town' && (
                  <>

                {/* Your Offer Section */}
                {(() => {
                  const offeringGems = playerState.gems.filter((g) => g.isOffering);
                  const totalValue = calculateTotalGemValue(offeringGems);
                  const twoXValue = totalValue * 2;
                  const displayGems = offeringGems.slice(0, 5);
                  const hasMore = offeringGems.length > 5;

                  return (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 8,
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          color: 'rgba(255, 255, 255, 0.8)',
                          fontSize: 9,
                          fontWeight: 'bold',
                        }}
                      >
                        Your Offer:
                      </div>

                      {/* Gem Icons Row */}
                      {offeringGems.length > 0 ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                          }}
                        >
                          {displayGems.map((gem) => (
                            <div
                              key={gem.id}
                              style={{
                                width: 16,
                                height: 16,
                                background: gem.color,
                                border: `1px solid ${getRarityColor(gem.rarity)}`,
                                boxShadow: `0 0 4px ${gem.color}40`,
                                flexShrink: 0,
                                ...getGemIconStyle(gem.shape),
                              }}
                            />
                          ))}
                          {hasMore && (
                            <span
                              style={{
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: 10,
                                fontWeight: 'bold',
                              }}
                            >
                              ...
                            </span>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{
                            color: 'rgba(255, 255, 255, 0.4)',
                            fontSize: 8,
                            fontStyle: 'italic',
                          }}
                        >
                          No gems offered
                        </div>
                      )}

                      {/* Total Value (2x) */}
                      {offeringGems.length > 0 && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            paddingTop: 4,
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <span
                            style={{
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontSize: 7,
                            }}
                          >
                            Total Value (2x):
                          </span>
                          <CoinValueDisplay bronzeValue={twoXValue} size={8} reverse={true} />
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 10,
                    fontWeight: 'bold',
                    paddingBottom: 8,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  📜 Other Gobs
                </div>

                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="🔍 Search"
                  value={traderSearchQuery}
                  onChange={(e) => setTraderSearchQuery(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: 'white',
                    fontSize: 9,
                    outline: 'none',
                    width: '100%',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212, 165, 116, 0.5)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                />

                {followedUsers
                  .filter((user) =>
                    user.username.toLowerCase().includes(traderSearchQuery.toLowerCase())
                  )
                  .map((user, index) => {
                    const playerBronzeTotal =
                      playerState.coins.bronze +
                      playerState.coins.silver * 100 +
                      playerState.coins.gold * 10000;
                    const canAfford = user.offer
                      ? playerBronzeTotal >= user.offer.totalValue
                      : false;
                    const isCurrentUser = user.username === effectiveUsername;

                    return (
                      <div
                        key={`${user.username}-${index}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: 8,
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          gap: 8,
                        }}
                      >
                        {/* Username */}
                        <div
                          style={{
                            color: '#d4a574',
                            fontSize: 10,
                            fontWeight: 'bold',
                            userSelect: 'text',
                            WebkitUserSelect: 'text',
                          }}
                        >
                          {user.username.length > 15
                            ? user.username.slice(0, 15) + '...'
                            : user.username}
                          {isCurrentUser && (
                            <span
                              style={{
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontSize: 7,
                                marginLeft: 4,
                                fontWeight: 'normal',
                              }}
                            >
                              (You)
                            </span>
                          )}
                        </div>

                        {/* Offer Section */}
                        {user.offer ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                            }}
                          >
                            {/* Offer Label */}
                            <div
                              style={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: 8,
                                fontWeight: 'bold',
                              }}
                            >
                              Their Offer:
                            </div>

                            {/* Gem Icons Row */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                flexWrap: 'wrap',
                              }}
                            >
                              {user.offer.gems.slice(0, 5).map((gem, gemIdx) => (
                                <div
                                  key={gemIdx}
                                  style={{
                                    width: 16,
                                    height: 16,
                                    background: gem.color,
                                    border: `1px solid ${gem.color}`,
                                    boxShadow: `0 0 4px ${gem.color}40`,
                                    flexShrink: 0,
                                    ...getGemIconStyle(gem.shape),
                                  }}
                                />
                              ))}
                              {user.offer.gems.length > 5 && (
                                <span
                                  style={{
                                    color: 'rgba(255, 255, 255, 0.5)',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                  }}
                                >
                                  ...
                                </span>
                              )}
                            </div>

                            {/* Total Value (2x) */}
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                paddingTop: 4,
                                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              <span
                                style={{
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  fontSize: 7,
                                }}
                              >
                                Total Value (2x):
                              </span>
                              <CoinValueDisplay
                                bronzeValue={user.offer.totalValue}
                                size={8}
                                reverse={true}
                              />
                            </div>

                            {/* Purchase Button */}
                            {!isCurrentUser && (
                              <button
                                {...createMobileFriendlyHandlers(() => {
                                  handleTrade(user.username, user.offer!.totalValue);
                                })}
                                disabled={!canAfford}
                                style={{
                                  ...mobileFriendlyButtonStyles,
                                  background: canAfford ? '#4CAF50' : '#666',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '8px 12px',
                                  fontSize: 9,
                                  fontWeight: 'bold',
                                  cursor: canAfford ? 'pointer' : 'not-allowed',
                                  opacity: canAfford ? 1 : 0.5,
                                  marginTop: 4,
                                }}
                              >
                                {canAfford ? 'Purchase' : 'Insufficient Coins'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              color: 'rgba(255, 255, 255, 0.4)',
                              fontSize: 8,
                              fontStyle: 'italic',
                            }}
                          >
                            No offer available
                          </div>
                        )}
                      </div>
                    );
                  })}

                {/* Loading Indicator */}
                {loadingUsers && (
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: 8,
                      textAlign: 'center',
                      padding: '10px',
                    }}
                  >
                    Loading more...
                  </div>
                )}

                {/* No More Users */}
                {!hasMoreUsers && followedUsers.length > 0 && (
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.3)',
                      fontSize: 7,
                      textAlign: 'center',
                      padding: '10px',
                      fontStyle: 'italic',
                    }}
                  >
                    No more gobs to show
                  </div>
                )}

                {/* Empty State */}
                {followedUsers.length === 0 && !loadingUsers && (
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.4)',
                      fontSize: 9,
                      textAlign: 'center',
                      padding: '20px',
                    }}
                  >
                    No other gobs yet
                  </div>
                )}
                  </>
                )}

                {/* Bazaar Subtab - Coming Soon */}
                {tradeAction === 'bazaar' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 15,
                      padding: '40px 20px',
                      flex: 1,
                    }}
                  >
                    <span style={{ fontSize: 48 }}>🏪</span>
                    <div
                      style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: 14,
                        fontWeight: 'bold',
                        textAlign: 'center',
                      }}
                    >
                      Bazaar
                    </div>
                    <div
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: 10,
                        textAlign: 'center',
                        lineHeight: 1.5,
                        maxWidth: 250,
                      }}
                    >
                      The Bazaar marketplace is coming soon! Trade gems with USDC using the x402
                      payment protocol.
                    </div>
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 10,
                      }}
                    >
                      <div
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: 8,
                          textAlign: 'center',
                          lineHeight: 1.4,
                        }}
                      >
                        💡 Link your Solana wallet in the Profile tab to prepare for Bazaar trading
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {gameTab === 'settings' && (
              <div
                className="hide-scrollbar"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 15,
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 10,
                    fontWeight: 'bold',
                    paddingBottom: 8,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                >
                  🧌 Profile
                </div>

                {/* Player Name */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: 10,
                    borderRadius: 6,
                  }}
                >
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: 7,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Username
                  </span>
                  <span
                    style={{
                      color: '#d4a574',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}
                  >
                    {effectiveUsername}
                  </span>
                </div>

                {/* Wallet Connection */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: 10,
                    borderRadius: 6,
                  }}
                >
                  <span
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: 7,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Solana Wallet
                  </span>
                  <WalletButton
                    apiClient={{ linkWallet, getLinkedWallet, unlinkWallet }}
                    onWalletLinked={(address) => {
                      console.log('Wallet linked:', address);
                      const toastId = `toast-${Date.now()}-${Math.random()}`;
                      setToasts((prev) => [
                        ...prev,
                        {
                          id: toastId,
                          message: `Wallet ${address.slice(0, 4)}...${address.slice(-4)} linked to account`,
                          type: 'wallet',
                          walletAction: 'linked',
                          timestamp: Date.now(),
                        },
                      ]);
                      setTimeout(() => {
                        setToasts((prev) => prev.filter((t) => t.id !== toastId));
                      }, 3000);
                    }}
                    onWalletUnlinked={() => {
                      console.log('Wallet unlinked');
                      const toastId = `toast-${Date.now()}-${Math.random()}`;
                      setToasts((prev) => [
                        ...prev,
                        {
                          id: toastId,
                          message: 'Wallet disconnected from account',
                          type: 'wallet',
                          walletAction: 'unlinked',
                          timestamp: Date.now(),
                        },
                      ]);
                      setTimeout(() => {
                        setToasts((prev) => prev.filter((t) => t.id !== toastId));
                      }, 3000);
                    }}
                  />
                </div>

                {/* Debug Mode Toggle - Hidden */}
                {false && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      background: 'rgba(255, 100, 100, 0.1)',
                      border: '1px solid rgba(255, 100, 100, 0.3)',
                      padding: 10,
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.85)',
                          fontSize: 9,
                        }}
                      >
                        Debug Mode
                      </span>
                      <button
                        {...createMobileFriendlyHandlers(() => setDebugMode(!debugMode))}
                        style={{
                          background: debugMode ? '#ff6b6b' : '#666',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 10,
                          fontWeight: 'bold',
                          ...mobileFriendlyButtonStyles,
                        }}
                      >
                        {debugMode ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: 7,
                        lineHeight: 1.3,
                      }}
                    >
                      Enable debug controls for testing garden faucets
                    </div>
                  </div>
                )}

                {/* Debug Info Toggle - Hidden */}
                {false && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: 10,
                      borderRadius: 6,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          color: 'rgba(255, 255, 255, 0.85)',
                          fontSize: 9,
                        }}
                      >
                        Show Debug Info
                      </span>
                      <button
                        {...createMobileFriendlyHandlers(() => setShowDebugInfo(!showDebugInfo))}
                        style={{
                          background: showDebugInfo ? '#4caf50' : '#666',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: 10,
                          fontWeight: 'bold',
                          ...mobileFriendlyButtonStyles,
                        }}
                      >
                        {showDebugInfo ? 'ON' : 'OFF'}
                      </button>
                    </div>
                    <div
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: 7,
                        lineHeight: 1.3,
                      }}
                    >
                      Display FPS counter and device performance info in top-right corner
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Garden Actions - Only visible in garden tab */}
          {gameTab === 'garden' && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '8px 10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <button
                {...createMobileFriendlyHandlers(() => {
                  handleGrowClick();
                })}
                style={{
                  ...mobileFriendlyButtonStyles,
                  flex: 1,
                  background: gardenAction === 'grow' ? '#3a8c52' : 'rgba(255, 255, 255, 0.15)',
                  border: gardenAction === 'grow' ? '2px solid #5fb870' : '2px solid transparent',
                  borderRadius: 6,
                  padding: '8px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 16 }}>🌱</span>
                <span
                  style={{
                    color: 'white',
                    fontSize: 7,
                    fontWeight: 'bold',
                  }}
                >
                  Grow
                </span>
              </button>

              <button
                {...createMobileFriendlyHandlers(() => {
                  handleOfferClick();
                })}
                style={{
                  ...mobileFriendlyButtonStyles,
                  flex: 1,
                  background: gardenAction === 'my-offer' ? '#4a7c9a' : 'rgba(255, 255, 255, 0.15)',
                  border:
                    gardenAction === 'my-offer' ? '2px solid #6fa9bf' : '2px solid transparent',
                  borderRadius: 6,
                  padding: '8px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 16 }}>📜</span>
                <span
                  style={{
                    color: 'white',
                    fontSize: 7,
                    fontWeight: 'bold',
                  }}
                >
                  My Offer
                </span>
              </button>
            </div>
          )}

          {/* Trade Actions - Only visible in trade tab */}
          {gameTab === 'hoard' && (
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '8px 10px',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              <button
                {...createMobileFriendlyHandlers(() => {
                  setTradeAction('town');
                })}
                style={{
                  ...mobileFriendlyButtonStyles,
                  flex: 1,
                  background: tradeAction === 'town' ? '#7c4a6f' : 'rgba(255, 255, 255, 0.15)',
                  border: tradeAction === 'town' ? '2px solid #bf6fb3' : '2px solid transparent',
                  borderRadius: 6,
                  padding: '8px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 16 }}>🏘️</span>
                <span
                  style={{
                    color: 'white',
                    fontSize: 7,
                    fontWeight: 'bold',
                  }}
                >
                  Town
                </span>
              </button>

              <button
                {...createMobileFriendlyHandlers(() => {
                  setTradeAction('bazaar');
                })}
                style={{
                  ...mobileFriendlyButtonStyles,
                  flex: 1,
                  background: tradeAction === 'bazaar' ? '#8b6f47' : 'rgba(255, 255, 255, 0.15)',
                  border: tradeAction === 'bazaar' ? '2px solid #d4a574' : '2px solid transparent',
                  borderRadius: 6,
                  padding: '8px 4px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 16 }}>🏪</span>
                <span
                  style={{
                    color: 'white',
                    fontSize: 7,
                    fontWeight: 'bold',
                  }}
                >
                  Bazaar
                </span>
              </button>
            </div>
          )}

          {/* Game Mode Tabs - 2x2 Grid at bottom */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginTop: 'auto',
            }}
          >
            <button
              {...createMobileFriendlyHandlers(handleScroungeClick)}
              style={{
                background: gameTab === 'scrounge' ? '#8b6f47' : 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: gameTab === 'scrounge' ? '2px solid #d4a574' : '2px solid transparent',
                padding: '12px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 24,
                fontWeight: 'bold',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                ...mobileFriendlyButtonStyles,
              }}
              title="Scrounge"
            >
              <span>⛏️</span>
              <span style={{ fontSize: 8 }}>Scrounge</span>
            </button>
            <button
              {...createMobileFriendlyHandlers(handleGardenClick)}
              style={{
                background: gameTab === 'garden' ? '#4a7c59' : 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: gameTab === 'garden' ? '2px solid #6fbf73' : '2px solid transparent',
                padding: '12px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 24,
                fontWeight: 'bold',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                ...mobileFriendlyButtonStyles,
              }}
              title="My Garden"
            >
              <CombinedGemsIcon size={20} />
              <span style={{ fontSize: 8 }}>My Garden</span>
            </button>
            <button
              {...createMobileFriendlyHandlers(() => setGameTab('hoard'))}
              style={{
                background: gameTab === 'hoard' ? '#7c4a6f' : 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: gameTab === 'hoard' ? '2px solid #bf6fb3' : '2px solid transparent',
                padding: '12px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 24,
                fontWeight: 'bold',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                ...mobileFriendlyButtonStyles,
              }}
              title="Trade"
            >
              <span>📜</span>
              <span style={{ fontSize: 8 }}>Trade</span>
            </button>
            <button
              {...createMobileFriendlyHandlers(() => setGameTab('settings'))}
              style={{
                background: gameTab === 'settings' ? '#5a5a5a' : 'rgba(255, 255, 255, 0.15)',
                color: 'white',
                border: gameTab === 'settings' ? '2px solid #909090' : '2px solid transparent',
                padding: '12px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 24,
                fontWeight: 'bold',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                ...mobileFriendlyButtonStyles,
              }}
              title="Profile"
            >
              <span>🧌</span>
              <span style={{ fontSize: 8 }}>Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gem Value Display - Shows total value of offered gems in My Offer mode */}
      {activeScene === 'garden' &&
        gardenAction === 'my-offer' &&
        (() => {
          const offeringGems = playerState.gems.filter((g) => g.isOffering);
          const totalValueInBronze = calculateTotalGemValue(offeringGems);
          const coins = convertToCoins(totalValueInBronze);

          const twoXValue = totalValueInBronze * 2;
          const twoXCoins = convertToCoins(twoXValue);
          const twoXString = formatValueAsCoins(twoXValue);

          return (
            <div
              style={{
                position: 'fixed',
                top: 20,
                right: 20,
                background: 'rgba(0, 100, 200, 0.95)',
                border: '2px solid #4a9eff',
                borderRadius: 10,
                padding: '10px 12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                width: 145,
              }}
            >
              {/* Header and coins in same column */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: 9,
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    textAlign: 'center',
                  }}
                >
                  You Receive
                </div>

                {/* Coin denominations display - Horizontal row */}
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '6px 8px',
                    borderRadius: 6,
                  }}
                >
                  <CoinBalance
                    coins={coins}
                    size={12}
                    fontSize={10}
                    fontFamily="monospace"
                    showEmpty
                    showZero
                  />
                </div>
              </div>

              {/* SELL NOW button */}
              <button
                {...createMobileFriendlyHandlers(() => {
                  // Sell all offering gems
                  const offeringGems = playerState.gems.filter((g) => g.isOffering);
                  const totalValueInBronze = calculateTotalGemValue(offeringGems);

                  if (offeringGems.length === 0) {
                    console.log('[SELL] No gems to sell');
                    return;
                  }

                  console.log('[SELL] Selling gems:', {
                    count: offeringGems.length,
                    totalValue: totalValueInBronze,
                    gems: offeringGems.map((g) => `${g.rarity} ${g.type}`),
                  });

                  // Clear garden refs to prevent race conditions
                  gardenApiRefs.current.forEach((ref) => {
                    if (ref.current) ref.current = [];
                  });
                  gardenMeshRefs.current.forEach((ref) => {
                    if (ref.current) ref.current = null;
                  });

                  // Remove offering gems and add coins to player
                  setPlayerState((prev) => {
                    // Calculate total bronze value
                    const newTotalBronze =
                      prev.coins.bronze +
                      prev.coins.silver * 100 +
                      prev.coins.gold * 10000 +
                      totalValueInBronze;

                    // Convert back to coin denominations
                    const newCoins = convertToCoins(newTotalBronze);

                    // Remove offering gems
                    const remainingGems = prev.gems.filter((g) => !g.isOffering);

                    console.log('[SELL] Transaction complete:', {
                      sold: offeringGems.length,
                      remaining: remainingGems.length,
                      oldCoins: prev.coins,
                      newCoins: newCoins,
                    });

                    return {
                      ...prev,
                      coins: newCoins,
                      gems: remainingGems,
                    };
                  });

                  // Show toast notification
                  const toastId = `toast-${Date.now()}-${Math.random()}`;
                  setToasts((prevToasts) => [
                    ...prevToasts,
                    {
                      id: toastId,
                      type: 'sold',
                      timestamp: Date.now(),
                      soldCount: offeringGems.length,
                      soldValue: totalValueInBronze,
                    },
                  ]);

                  // Auto-remove toast after 3 seconds
                  setTimeout(() => {
                    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId));
                  }, 3000);

                  // Increment sceneKey to force full remount (prevents physics crash)
                  setSceneKey((prev) => prev + 1);

                  console.log('[SELL] Scene reset triggered to prevent physics crash');
                })}
                style={{
                  background: '#4CAF50',
                  color: 'white',
                  border: '2px solid #66BB6A',
                  borderRadius: 6,
                  padding: '8px 12px',
                  fontSize: 10,
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  ...mobileFriendlyButtonStyles,
                }}
              >
                Sell Now
              </button>

              {/* Wait for 2x text - Two lines */}
              <div
                style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: 7,
                  fontFamily: 'monospace',
                  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                  paddingTop: 5,
                  lineHeight: 1.4,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <span>or wait for other Gobs to</span>
                <span>purchase for 2x value</span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  (
                  <CoinValueDisplay
                    bronzeValue={twoXValue}
                    size={8}
                    reverse={true}
                    showZero={true}
                  />
                  )
                </span>
              </div>
            </div>
          );
        })()}

      <Canvas
        camera={{
          position: [-1, 1.5, 1],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
        }}
        shadows={true}
      >
        {/* Background color - changes based on environment */}
        {activeScene === 'garden' ? (
          <>
            <color attach="background" args={['#4a6a8a']} />
            <fog attach="fog" args={['#4a6a8a', 8, 20]} />
          </>
        ) : selectedLocation === 'crystal-caves' ? (
          <>
            <color attach="background" args={['#2a1a3a']} />
            <fog attach="fog" args={['#2a1a3a', 5, 15]} />
          </>
        ) : selectedLocation === 'bright-warrens' ? (
          <>
            <color attach="background" args={['#1a2030']} />
            <fog attach="fog" args={['#1a2030', 5, 15]} />
          </>
        ) : (
          <>
            <color attach="background" args={['#0d0a08']} />
            <fog attach="fog" args={['#0d0a08', 5, 15]} />
          </>
        )}

        {/* FPS Counter - Only show when debug info enabled */}
        {showDebugInfo && <Stats />}

        {/* Camera Controls */}
        <OrbitControls target={[0, 0.5, 0]} enabled={false} />

        {/* Lighting - changes based on environment */}
        {activeScene === 'garden' ? (
          <>
            {/* Crystal Garden Lighting - bright, ethereal, cool-toned */}
            <ambientLight intensity={1.5} color="#ffffff" />

            {/* Main overhead light - bright white to simulate crystal reflections */}
            <directionalLight
              position={[0, 5, 0]}
              intensity={2.5}
              color="#ffffff"
              castShadow={true}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />

            {/* Sparkling crystal lights - Always enabled */}
            <pointLight position={[-2, 2, -2]} intensity={1.2} color="#88ccff" distance={15} />
            <pointLight position={[2, 1.5, 2]} intensity={1.0} color="#cc88ff" distance={13} />
            <pointLight position={[-1, 1, 2]} intensity={0.9} color="#ff88cc" distance={12} />
            <pointLight position={[0, 0.5, 0]} intensity={0.8} color="#aaffff" distance={8} />
            <pointLight position={[1.5, 2.5, -1]} intensity={0.7} color="#ffaaff" distance={9} />
          </>
        ) : selectedLocation === 'crystal-caves' ? (
          <>
            {/* Crystal Caverns Lighting - mysterious, purple-dominant with magical glow */}
            <ambientLight intensity={0.6} color="#9966cc" />

            {/* Main overhead light - purple-tinted to simulate crystal glow */}
            <directionalLight
              position={[0, 5, 0]}
              intensity={1.8}
              color="#cc99ff"
              castShadow={true}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />

            {/* Purple crystal lights - creating a mystical cavern atmosphere */}
            <pointLight position={[-2, 2, -2]} intensity={1.5} color="#9966ff" distance={12} />
            <pointLight position={[2, 1.5, 2]} intensity={1.3} color="#cc66ff" distance={11} />
            <pointLight position={[-1, 1, 2]} intensity={1.2} color="#aa55ff" distance={10} />
            <pointLight position={[1.5, 2.5, -1]} intensity={1.0} color="#dd88ff" distance={9} />
            <pointLight position={[0, 0.5, 0]} intensity={0.9} color="#8855dd" distance={8} />
            {/* Additional purple accent lights for depth */}
            <pointLight position={[-2.5, 1, 1]} intensity={0.8} color="#bb77ff" distance={7} />
            <pointLight position={[2, 0.8, -1.5]} intensity={0.7} color="#aa66ee" distance={6} />
          </>
        ) : selectedLocation === 'bright-warrens' ? (
          <>
            {/* Bright Warrens Lighting - bright, silvery, cool-toned */}
            <ambientLight intensity={0.7} color="#e8f0ff" />

            {/* Main overhead light - bright silvery light */}
            <directionalLight
              position={[0, 5, 0]}
              intensity={2.0}
              color="#ffffff"
              castShadow={true}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />

            {/* Silvery accent lights - cool blue-white tones */}
            <pointLight position={[-3, 2, -2]} intensity={0.8} color="#c8d8ff" distance={8} />
            <pointLight position={[3, 1.5, 2]} intensity={0.7} color="#d8e8ff" distance={6} />
            <pointLight position={[0, 0.5, 0]} intensity={0.5} color="#b8d0ff" distance={5} />
          </>
        ) : (
          <>
            {/* Cave Lighting - warm, dim, firelit (Rockfall and others) */}
            <ambientLight intensity={0.4} color="#d4a574" />

            {/* Main overhead light - animated to simulate firelight */}
            <AnimatedFireLight enableShadows={true} />

            {/* Rim lights for depth - Always enabled */}
            <pointLight position={[-3, 2, -2]} intensity={0.3} color="#ff9f5a" distance={8} />
            <pointLight position={[3, 1.5, 2]} intensity={0.25} color="#d4a574" distance={6} />
            <pointLight position={[0, 0.2, 0]} intensity={0.15} color="#8b6f47" distance={4} />
          </>
        )}

        {/* Physics World - Adaptive settings based on device performance tier */}
        <Physics
          gravity={[0, -9.81, 0]}
          timeStep={
            activeTier === 'high'
              ? 1 / 60 // High: 60 fps physics, maximum accuracy
              : activeTier === 'medium'
                ? 1 / 45 // Medium: 45 fps physics, balanced
                : 1 / 30 // Low: 30 fps physics, performance mode
          }
          interpolate={activeTier === 'high' || activeTier === 'medium'}
          maxVelocityIterations={
            activeTier === 'high'
              ? 8 // High: Maximum solver accuracy
              : activeTier === 'medium'
                ? 4 // Medium: Balanced
                : 2 // Low: Minimal iterations for performance
          }
          maxStabilizationIterations={
            activeTier === 'high'
              ? 4 // High: Maximum stability
              : activeTier === 'medium'
                ? 2 // Medium: Balanced
                : 1 // Low: Minimal stabilization
          }
        >
          {/* Shadow receiving plane */}
          <ShadowPlane isGarden={activeScene === 'garden'} />

          {/* Floor collider (invisible) */}
          <FloorCollider isGarden={activeScene === 'garden'} />

          {/* Drag zone - visible in Grow and My Offer modes */}
          {activeScene === 'garden' && (gardenAction === 'grow' || gardenAction === 'my-offer') && (
            <DragZone action={gardenAction} />
          )}

          {/* Master Physics Loop - Consolidated physics access for safety */}
          <MasterPhysicsLoop
            gardenApiRefs={gardenApiRefs.current}
            gardenMeshRefs={gardenMeshRefs.current}
            gardenObjectTypes={GARDEN_OBJECT_TYPES}
            scroungeApiRefs={objectApiRefs.current}
            scroungeMeshRefs={objectMeshRefs.current}
            scroungeObjectTypes={OBJECT_TYPES}
            activeScene={activeScene}
            gardenAction={gardenAction}
            isTransitioningRef={isTransitioningRef}
            onCountChange={setDragZoneCount}
            onInstancesChange={setDragZoneInstances}
            collectingItems={collectingItems}
          />

          {/* Debug axes - shows X, Y, Z coordinate system on floor (only in debug mode) */}
          {showDebugInfo && <DebugAxes />}

          {/* Faucet position indicators */}
          {activeScene === 'garden' ? (
            <>
              {/* Show garden faucet indicators when in garden mode */}
              <FaucetIndicator
                config={faucetConfigs['coin-faucet'] || GARDEN_FAUCET_CONFIGS['coin-faucet']}
              />
              <FaucetIndicator
                config={faucetConfigs['gem-faucet'] || GARDEN_FAUCET_CONFIGS['gem-faucet']}
              />
              <FaucetIndicator
                config={
                  faucetConfigs['growing-gem-faucet'] || GARDEN_FAUCET_CONFIGS['growing-gem-faucet']
                }
              />
            </>
          ) : (
            /* Show default faucet indicator in scrounge mode */
            <FaucetIndicator config={faucetConfigs['default'] || DEFAULT_FAUCET_CONFIG} />
          )}

          {/* Falling objects - render all types (hide when in garden mode) */}
          {activeScene !== 'garden' &&
            OBJECT_TYPES.map((objectType, index) => (
              <FallingObjects
                key={`${objectType.name}-${sceneKey}`}
                objectType={objectType}
                faucetConfig={faucetConfigs['default'] || DEFAULT_FAUCET_CONFIG}
                apiRef={objectApiRefs.current[index]}
                meshRef={objectMeshRefs.current[index]}
                uniformScale={false} // Use non-uniform scale for rock-like shapes
                meshId={index.toString()}
                selectedInstances={selectedInstances}
                highlightConfig={touchConfig.select}
                draggedInstance={draggedInstance}
                collectingItems={collectingItems}
                performanceTier={activeTier}
                isActive={scroungeObjectsActive}
                isTransitioningRef={isTransitioningRef}
              />
            ))}

          {/* Garden objects - render only in garden mode with separate faucets */}
          {activeScene === 'garden' &&
            GARDEN_FAUCET_ENABLED &&
            GARDEN_OBJECT_TYPES.filter((objectType) => objectType.materialType === 'coin') // Only render coins with faucet
              .map((objectType, index) => {
                // Get the faucet config for this object type, or use a disabled default
                const faucetConfig = (objectType.faucetId &&
                  faucetConfigs[objectType.faucetId]) || {
                  ...(faucetConfigs['default'] || DEFAULT_FAUCET_CONFIG),
                  enabled: false,
                };

                return (
                  <FallingObjects
                    key={`${objectType.name}-${sceneKey}`}
                    objectType={objectType}
                    faucetConfig={faucetConfig}
                    apiRef={gardenApiRefs.current[index]}
                    meshRef={gardenMeshRefs.current[index]}
                    uniformScale={false}
                    meshId={`garden-${index}`}
                    selectedInstances={selectedInstances}
                    highlightConfig={touchConfig.select}
                    draggedInstance={draggedInstance}
                    collectingItems={new Map()} // No collection animations in garden
                    performanceTier={activeTier}
                    isActive={gardenObjectsActive}
                    isTransitioningRef={isTransitioningRef}
                  />
                );
              })}

          {/* Gems - render with gem faucet */}
          {activeScene === 'garden' &&
            GARDEN_OBJECT_TYPES.filter((objectType) => objectType.materialType === 'gem').map(
              (objectType, index) => {
                // Get the faucet config for gems, or use a disabled default
                const faucetConfig = (objectType.faucetId &&
                  faucetConfigs[objectType.faucetId]) || {
                  ...(faucetConfigs['default'] || DEFAULT_FAUCET_CONFIG),
                  enabled: false,
                };

                // Compute live spawn zones based on current isGrowing/isOffering state
                // This must match the grouping logic in GARDEN_OBJECT_TYPES
                const nameWithoutPrefix = objectType.name.replace('garden_', '');
                const nameParts = nameWithoutPrefix.split('_');
                const gemType = nameParts[0] as
                  | 'diamond'
                  | 'emerald'
                  | 'ruby'
                  | 'sapphire'
                  | 'amethyst';
                const gemShape = nameParts[1] as 'tetrahedron' | 'octahedron' | 'dodecahedron';

                // Get current gems for this type+shape (must match GARDEN_OBJECT_TYPES grouping)
                const sortedGems = [...playerState.gems].sort((a, b) => a.id.localeCompare(b.id));

                // Filter based on current mode (must match GARDEN_OBJECT_TYPES filter logic)
                const filteredGems = sortedGems.filter((gem) => {
                  if (gardenAction === 'grow') {
                    return !gem.isOffering;
                  } else if (gardenAction === 'my-offer') {
                    return !gem.isGrowing;
                  } else {
                    return !gem.isGrowing && !gem.isOffering;
                  }
                });

                const gemsForThisType = filteredGems.filter(
                  (g) => g.type === gemType && g.shape === gemShape
                );

                // Determine spawn zone based on mode
                const liveSpawnZones = gemsForThisType.map((gem) => {
                  if (gardenAction === 'grow' && gem.isGrowing) {
                    return 'grow-zone' as const;
                  } else if (gardenAction === 'my-offer' && gem.isOffering) {
                    return 'grow-zone' as const; // Offering gems use same zone as growing
                  } else {
                    return 'bottom' as const;
                  }
                });

                return (
                  <FallingObjects
                    key={`${objectType.name}-${sceneKey}`}
                    objectType={objectType}
                    faucetConfig={faucetConfig}
                    apiRef={
                      gardenApiRefs.current[
                        GARDEN_OBJECT_TYPES.filter((t) => t.materialType === 'coin').length + index
                      ]
                    }
                    meshRef={
                      gardenMeshRefs.current[
                        GARDEN_OBJECT_TYPES.filter((t) => t.materialType === 'coin').length + index
                      ]
                    }
                    uniformScale={false}
                    meshId={`garden-gem-${index}`}
                    selectedInstances={selectedInstances}
                    highlightConfig={touchConfig.select}
                    draggedInstance={draggedInstance}
                    collectingItems={new Map()} // No collection animations in garden
                    performanceTier={activeTier}
                    liveInstanceSpawnZones={liveSpawnZones}
                    isActive={gardenObjectsActive}
                    isTransitioningRef={isTransitioningRef}
                  />
                );
              }
            )}

          {/* Particle explosions for collected items */}
          {explosions.map((explosion) => (
            <ParticleExplosion
              key={explosion.id}
              position={explosion.position}
              color={explosion.color}
              onComplete={() => removeExplosion(explosion.id)}
            />
          ))}

          {/* Interactive pointer force field - switches between scrounge and garden objects */}
          {activeScene === 'garden' ? (
            <PointerForceField
              key={`garden-${gardenAction}`} // Force remount when garden action changes
              objectApis={gardenApiRefs.current}
              onDraggingChange={setIsDragging}
              config={touchConfig}
              selectedInstances={selectedInstances}
              setSelectedInstances={setSelectedInstances}
              onDraggedObjectChange={setDraggedInstance}
              onCollectItem={handleGardenDrop}
              activeScene={activeScene}
              isTransitioningRef={isTransitioningRef}
            />
          ) : (
            <PointerForceField
              key="scrounge" // Static key for scrounge
              objectApis={objectApiRefs.current}
              onDraggingChange={setIsDragging}
              config={touchConfig}
              selectedInstances={selectedInstances}
              setSelectedInstances={setSelectedInstances}
              onDraggedObjectChange={setDraggedInstance}
              onCollectItem={handleCollectItem}
              activeScene={activeScene}
              isTransitioningRef={isTransitioningRef}
            />
          )}
        </Physics>
      </Canvas>
    </div>
  );
};

// Wrap with WalletProvider
export const PileDemo = (props: {
  onClose: () => void;
  level?: number;
  username?: string;
}) => {
  return (
    <WalletProvider>
      <PileDemoInner {...props} />
    </WalletProvider>
  );
};
