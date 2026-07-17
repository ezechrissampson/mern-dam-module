export default function EmptyState({ icon = 'bi-inbox', title = 'Nothing here yet', message, action }) {
  return (
    <div className="text-center py-5">
      <i className={`bi ${icon} text-dam-secondary`} style={{ fontSize: '2.5rem' }} />
      <h5 className="mt-3">{title}</h5>
      {message && <p className="text-dam-secondary mb-3">{message}</p>}
      {action}
    </div>
  );
}
