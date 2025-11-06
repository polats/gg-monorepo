export function CollectedItems({
  collectedItems,
}: {
  collectedItems: Array<{ name: string; emoji: string }>;
}) {
  if (collectedItems.length === 0) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 80,
      right: 20,
      zIndex: 1001,
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '12px',
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 60,
    }}>
      <div style={{
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.6)',
        textAlign: 'center',
        marginBottom: 4,
      }}>
        Collected
      </div>
      {collectedItems.slice(-5).reverse().map((item, index) => (
        <div
          key={`${item.name}-${collectedItems.length - index}`}
          style={{
            fontSize: 24,
            textAlign: 'center',
            animation: index === 0 ? 'bounce 0.5s ease' : 'none',
          }}
        >
          {item.emoji}
        </div>
      ))}
    </div>
  );
}
