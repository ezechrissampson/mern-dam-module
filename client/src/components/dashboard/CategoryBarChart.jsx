/**
 * Lightweight, dependency-free horizontal bar chart for the storage
 * breakdown widget. No charting library needed for this simple case,
 * keeping the module's dependency footprint minimal — swap in
 * recharts/chart.js here if the host app already depends on one.
 */
export default function CategoryBarChart({ labels = [], values = [] }) {
  const max = Math.max(1, ...values);
  const colors = ['#16A34A', '#2563EB', '#F59E0B', '#DC2626'];

  return (
    <div className="vstack gap-3">
      {labels.map((label, i) => (
        <div key={label}>
          <div className="d-flex justify-content-between small mb-1">
            <span>{label}</span>
            <span className="text-dam-secondary">{values[i]}</span>
          </div>
          <div className="progress" style={{ height: 10 }}>
            <div
              className="progress-bar"
              style={{ width: `${(values[i] / max) * 100}%`, backgroundColor: colors[i % colors.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
