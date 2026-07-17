export default function StatCard({ icon, label, value, sub, variant }) {
  return (
    <div className="dam-stat-card d-flex align-items-start gap-3">
      <div className="dam-stat-icon" style={variant ? { background: `var(--dam-${variant})`, color: '#fff' } : undefined}>
        <i className={`bi ${icon}`} />
      </div>
      <div>
        <div className="text-dam-secondary small">{label}</div>
        <div className="fs-4 fw-bold">{value}</div>
        {sub && <div className="text-dam-secondary small">{sub}</div>}
      </div>
    </div>
  );
}
