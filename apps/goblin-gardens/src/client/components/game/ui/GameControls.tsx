import type { TouchConfig, FaucetConfig } from '../../../types/game';

const mobileFriendlyButtonStyles = {
  WebkitTapHighlightColor: 'transparent',
  userSelect: 'none' as const,
  WebkitUserSelect: 'none' as const,
  WebkitTouchCallout: 'none' as const,
};

export function GameControls({
  sidebarOpen,
  controlsVisible,
  touchConfig,
  faucetConfig,
  onControlsToggle,
  onTouchModeChange,
  onReset,
  onFaucetToggle,
  onClose,
  createMobileFriendlyHandlers,
}: {
  sidebarOpen: boolean;
  controlsVisible: boolean;
  touchConfig: TouchConfig;
  faucetConfig: FaucetConfig;
  onControlsToggle: () => void;
  onTouchModeChange: (mode: 'push' | 'pickup' | 'select') => void;
  onReset: () => void;
  onFaucetToggle: () => void;
  onClose: () => void;
  createMobileFriendlyHandlers: (action: () => void) => any;
}) {
  return (
    <>
      {/* Controls Toggle Button - Only show when sidebar is closed */}
      {!sidebarOpen && (
        <button
          {...createMobileFriendlyHandlers(onControlsToggle)}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 10002,
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 24,
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            ...mobileFriendlyButtonStyles,
          }}
          title={controlsVisible ? 'Hide Controls' : 'Show Controls'}
        >
          {controlsVisible ? '👁️' : '👁️‍🗨️'}
        </button>
      )}

      {/* Top Right Controls - Only show when sidebar is closed and controls are visible */}
      {!sidebarOpen && controlsVisible && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 70,
            zIndex: 1001,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          {/* Touch Mode Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 5,
              background: 'rgba(0, 0, 0, 0.8)',
              padding: 8,
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <button
              {...createMobileFriendlyHandlers(() => onTouchModeChange('push'))}
              style={{
                background: touchConfig.mode === 'push' ? '#4caf50' : 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: touchConfig.mode === 'push' ? '2px solid #4caf50' : '2px solid transparent',
                padding: '10px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 22,
                fontWeight: 'bold',
                ...mobileFriendlyButtonStyles,
              }}
              title="Push Mode"
            >
              👉
            </button>
            <button
              {...createMobileFriendlyHandlers(() => onTouchModeChange('pickup'))}
              style={{
                background: touchConfig.mode === 'pickup' ? '#ff9800' : 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border:
                  touchConfig.mode === 'pickup' ? '2px solid #ff9800' : '2px solid transparent',
                padding: '10px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 22,
                fontWeight: 'bold',
                ...mobileFriendlyButtonStyles,
              }}
              title="Pickup Mode"
            >
              ✋
            </button>
            <button
              {...createMobileFriendlyHandlers(() => onTouchModeChange('select'))}
              style={{
                background: touchConfig.mode === 'select' ? '#00bcd4' : 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border:
                  touchConfig.mode === 'select' ? '2px solid #00bcd4' : '2px solid transparent',
                padding: '10px 14px',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 22,
                fontWeight: 'bold',
                ...mobileFriendlyButtonStyles,
              }}
              title="Select Mode"
            >
              ☝️
            </button>
          </div>

          {/* Reset Button */}
          <button
            {...createMobileFriendlyHandlers(onReset)}
            style={{
              background: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              border: 'none',
              padding: '10px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 22,
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              ...mobileFriendlyButtonStyles,
            }}
            title="Reset Scene"
          >
            🔄
          </button>

          {/* Faucet Toggle Button */}
          <button
            {...createMobileFriendlyHandlers(onFaucetToggle)}
            style={{
              background: faucetConfig.enabled ? '#4caf50' : 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: faucetConfig.enabled
                ? '2px solid #4caf50'
                : '2px solid rgba(255, 255, 255, 0.3)',
              padding: '10px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 22,
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              ...mobileFriendlyButtonStyles,
            }}
            title={faucetConfig.enabled ? 'Faucet: ON' : 'Faucet: OFF'}
          >
            🚰
          </button>
        </div>
      )}

      {/* Close Demo Button - Only show when sidebar is open */}
      {sidebarOpen && (
        <button
          {...createMobileFriendlyHandlers(onClose)}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 10001,
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 24,
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            ...mobileFriendlyButtonStyles,
          }}
          title="Close Demo"
        >
          ❌
        </button>
      )}
    </>
  );
}
