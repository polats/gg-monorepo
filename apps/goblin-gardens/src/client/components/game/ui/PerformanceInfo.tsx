import type { PerformanceTier } from '../../../utils/performanceDetection';

export function PerformanceInfo({
  performanceInfo,
  showDebugInfo,
  manualPerformanceTier,
  onManualTierChange,
  activeTier,
}: {
  performanceInfo: {
    tier: PerformanceTier;
    gpuTier: number;
    cpuCores: number;
    deviceMemory: number;
    isMobile: boolean;
  } | null;
  showDebugInfo: boolean;
  manualPerformanceTier: PerformanceTier | null;
  onManualTierChange: (tier: PerformanceTier | null) => void;
  activeTier: PerformanceTier | null;
}) {
  if (!performanceInfo || !showDebugInfo) return null;

  const detectedTier = performanceInfo.tier;
  const tier = activeTier || detectedTier;

  // Physics settings based on tier
  const physicsSettings = {
    low: {
      timeStep: '1/30',
      velocityIter: 2,
      stabilizationIter: 1,
      interpolation: 'No',
      sleepThreshold: 0.5,
    },
    medium: {
      timeStep: '1/45',
      velocityIter: 4,
      stabilizationIter: 2,
      interpolation: 'Yes',
      sleepThreshold: 0.1,
    },
    high: {
      timeStep: '1/60',
      velocityIter: 8,
      stabilizationIter: 4,
      interpolation: 'Yes',
      sleepThreshold: 'Default',
    },
  };

  // Rendering settings - Always HIGH for all tiers
  const renderSettings = {
    shadows: 'Enabled',
    objectCount: '100%',
    lighting: 'Advanced',
  };

  const physics = physicsSettings[tier];
  const render = renderSettings;

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1001,
        background: 'rgba(0, 0, 0, 0.85)',
        padding: '10px 14px',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        minWidth: 180,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: 6,
          textAlign: 'center',
          fontWeight: 'bold',
          letterSpacing: '0.5px',
        }}
      >
        DEVICE INFO
      </div>

      {/* Performance Tier Badge */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '4px 8px',
          borderRadius: 4,
          marginBottom: 8,
          background: tier === 'high' ? '#4caf50' : tier === 'medium' ? '#ff9800' : '#f44336',
          color: 'white',
        }}
      >
        {tier.toUpperCase()}
      </div>

      {/* Device Stats */}
      <div
        style={{
          fontSize: 9,
          color: 'rgba(255, 255, 255, 0.85)',
          fontFamily: 'monospace',
          lineHeight: 1.4,
        }}
      >
        <div style={{ marginBottom: 3 }}>
          <span style={{ opacity: 0.6 }}>GPU:</span> Tier {performanceInfo.gpuTier}
        </div>
        <div style={{ marginBottom: 3 }}>
          <span style={{ opacity: 0.6 }}>CPU:</span> {performanceInfo.cpuCores} cores
        </div>
        <div style={{ marginBottom: 3 }}>
          <span style={{ opacity: 0.6 }}>RAM:</span> {performanceInfo.deviceMemory}GB
        </div>
        {performanceInfo.isMobile && (
          <div
            style={{
              marginTop: 6,
              marginBottom: 6,
              padding: '2px 6px',
              background: 'rgba(33, 150, 243, 0.2)',
              borderRadius: 3,
              textAlign: 'center',
              color: '#64b5f6',
            }}
          >
            📱 Mobile
          </div>
        )}
      </div>

      {/* Manual Override Section */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <div
          style={{
            fontSize: 8,
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: 6,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}
        >
          MANUAL OVERRIDE
        </div>
        <div
          style={{
            fontSize: 7,
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: 6,
            lineHeight: 1.3,
          }}
        >
          Detected:{' '}
          <span
            style={{
              color:
                detectedTier === 'high'
                  ? '#4caf50'
                  : detectedTier === 'medium'
                    ? '#ff9800'
                    : '#f44336',
              fontWeight: 'bold',
            }}
          >
            {detectedTier.toUpperCase()}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            marginBottom: 6,
          }}
        >
          <button
            onClick={() => onManualTierChange('low')}
            style={{
              background: manualPerformanceTier === 'low' ? '#f44336' : 'rgba(244, 67, 54, 0.2)',
              color: 'white',
              border:
                manualPerformanceTier === 'low'
                  ? '2px solid #f44336'
                  : '1px solid rgba(244, 67, 54, 0.5)',
              padding: '10px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              transition: 'all 0.2s',
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            LOW
          </button>
          <button
            onClick={() => onManualTierChange('medium')}
            style={{
              background: manualPerformanceTier === 'medium' ? '#ff9800' : 'rgba(255, 152, 0, 0.2)',
              color: 'white',
              border:
                manualPerformanceTier === 'medium'
                  ? '2px solid #ff9800'
                  : '1px solid rgba(255, 152, 0, 0.5)',
              padding: '10px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              transition: 'all 0.2s',
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            MEDIUM
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
          }}
        >
          <button
            onClick={() => onManualTierChange('high')}
            style={{
              background: manualPerformanceTier === 'high' ? '#4caf50' : 'rgba(76, 175, 80, 0.2)',
              color: 'white',
              border:
                manualPerformanceTier === 'high'
                  ? '2px solid #4caf50'
                  : '1px solid rgba(76, 175, 80, 0.5)',
              padding: '10px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              transition: 'all 0.2s',
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            HIGH
          </button>
          <button
            onClick={() => onManualTierChange(null)}
            style={{
              background:
                manualPerformanceTier === null
                  ? 'rgba(255, 255, 255, 0.3)'
                  : 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border:
                manualPerformanceTier === null
                  ? '2px solid rgba(255, 255, 255, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.3)',
              padding: '10px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 10,
              fontWeight: 'bold',
              transition: 'all 0.2s',
              minHeight: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            AUTO
          </button>
        </div>
      </div>

      {/* Physics Settings Section */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <div
          style={{
            fontSize: 8,
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: 5,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}
        >
          PHYSICS SETTINGS
        </div>
        <div
          style={{
            fontSize: 8,
            color: 'rgba(255, 255, 255, 0.85)',
            fontFamily: 'monospace',
            lineHeight: 1.5,
          }}
        >
          <div style={{ marginBottom: 2 }}>
            <span style={{ opacity: 0.6 }}>Time Step:</span> {physics.timeStep}
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ opacity: 0.6 }}>Velocity Iter:</span> {physics.velocityIter}
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ opacity: 0.6 }}>Stabil. Iter:</span> {physics.stabilizationIter}
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ opacity: 0.6 }}>Interpolation:</span> {physics.interpolation}
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ opacity: 0.6 }}>Sleep Thresh:</span> {physics.sleepThreshold}
          </div>
        </div>
      </div>

      {/* Rendering Settings Section */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        }}
      >
        <div
          style={{
            fontSize: 8,
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: 5,
            fontWeight: 'bold',
            letterSpacing: '0.5px',
          }}
        >
          RENDERING SETTINGS
          <span
            style={{
              color: '#4caf50',
              fontSize: 7,
              marginLeft: 4,
            }}
          >
            (ALWAYS HIGH)
          </span>
        </div>
        <div
          style={{
            fontSize: 8,
            color: 'rgba(255, 255, 255, 0.85)',
            fontFamily: 'monospace',
            lineHeight: 1.5,
          }}
        >
          <div style={{ marginBottom: 2 }}>
            <span style={{ opacity: 0.6 }}>Shadows:</span> {render.shadows}
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ opacity: 0.6 }}>Object Count:</span> {render.objectCount}
          </div>
          <div style={{ marginBottom: 2 }}>
            <span style={{ opacity: 0.6 }}>Lighting:</span> {render.lighting}
          </div>
        </div>
      </div>
    </div>
  );
}
