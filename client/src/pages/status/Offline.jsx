export default function Offline() {
  return (
    <div className="text-center py-5">
      <i className="bi bi-wifi-off text-dam-secondary" style={{ fontSize: '3rem' }} />
      <h2 className="mt-3">You're offline</h2>
      <p className="text-dam-secondary">Check your internet connection. Changes will sync once you're back online.</p>
    </div>
  );
}
