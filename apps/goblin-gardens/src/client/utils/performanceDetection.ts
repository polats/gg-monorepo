import { getGPUTier } from 'detect-gpu';

/**
 * Performance tier classification for adaptive rendering
 */
export type PerformanceTier = 'high' | 'medium' | 'low';

/**
 * Performance detection result with detailed metrics
 */
export interface PerformanceInfo {
  tier: PerformanceTier;
  gpuTier: number;
  cpuCores: number;
  deviceMemory: number;
  isMobile: boolean;
  gpuName?: string;
}

/**
 * Detects device performance capabilities and returns a performance tier
 *
 * Classification strategy:
 * - HIGH: Modern phones (iPhone 14+), newer iPads, desktop GPUs with excellent performance
 *   - GPU Tier 3 (60+ fps) - Only tier 3 qualifies for high
 *   - OR 8+ CPU cores with tier 3 GPU
 *   - OR 16+ GB RAM with tier 3 GPU
 *
 * - MEDIUM: High-end devices with tier 2 GPU that have BOTH strong CPU AND RAM
 *   - GPU Tier 2 AND 6+ CPU cores AND more than 8GB RAM (all three required)
 *
 * - LOW: Most devices including older phones, Intel Iris graphics, budget devices
 *   - GPU Tier 0-2 with typical specs
 *   - Includes: iPhone 13, Intel Iris, tier 2 GPU with 4 cores + 8GB RAM
 *   - Any device that doesn't meet HIGH or MEDIUM criteria
 *
 * This approach uses performance characteristics rather than specific device models,
 * ensuring devices with similar specs are treated similarly (e.g., iPhone 13 and
 * Intel Macs with Iris graphics both fall into the low tier based on their performance).
 */
export async function detectPerformance(): Promise<PerformanceInfo> {
  // Get GPU tier using detect-gpu
  const gpuData = await getGPUTier();

  // Get CPU core count (fallback to 4 if not available)
  const cpuCores = navigator.hardwareConcurrency || 4;

  // Get device memory in GB (fallback to 4 if not available)
  // @ts-expect-error - deviceMemory is not in all TypeScript definitions but exists in modern browsers
  const deviceMemory: number = navigator.deviceMemory || 4;

  const isMobile = gpuData.isMobile || false;
  const gpuTier = gpuData.tier;
  const gpuName = gpuData.gpu;

  // Calculate performance tier based on multiple signals
  let tier: PerformanceTier = 'low';

  // HIGH TIER: Only devices with excellent GPU performance (tier 3)
  if (
    gpuTier >= 3 || // 60+ fps GPU performance - ONLY tier 3 qualifies for high
    (cpuCores >= 8 && gpuTier >= 3) || // 8+ cores with tier 3 GPU
    (deviceMemory >= 16 && gpuTier >= 3) // 16+ GB RAM with tier 3 GPU
  ) {
    tier = 'high';
  }
  // MEDIUM TIER: Devices with tier 2 GPU AND strong CPU AND RAM (both required)
  else if (
    gpuTier >= 2 && cpuCores >= 6 && deviceMemory > 8 // Tier 2 GPU with 6+ cores AND more than 8GB RAM
  ) {
    tier = 'medium';
  }
  // LOW TIER: Everything else including GPU tier 0-2 with typical specs
  // This includes iPhone 13, Intel Iris graphics, tier 2 with 4 cores + 8GB RAM, and most budget devices

  return {
    tier,
    gpuTier,
    cpuCores,
    deviceMemory,
    isMobile,
    gpuName,
  };
}

/**
 * Get a multiplier for object counts based on performance tier
 * This can be used to scale down the number of objects on lower-end devices
 */
export function getPerformanceMultiplier(tier: PerformanceTier): number {
  switch (tier) {
    case 'high':
      return 1.0; // Full object count
    case 'medium':
      return 0.6; // 60% of objects
    case 'low':
      return 0.3; // 30% of objects
    default:
      return 1.0;
  }
}

/**
 * Apply performance-based scaling to an object count
 */
export function scaleObjectCount(count: number, tier: PerformanceTier): number {
  const multiplier = getPerformanceMultiplier(tier);
  return Math.max(1, Math.floor(count * multiplier));
}
