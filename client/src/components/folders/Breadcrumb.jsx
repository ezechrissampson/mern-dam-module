export default function Breadcrumb({ items = [], onNavigate }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb mb-3">
        <li className="breadcrumb-item" style={{ cursor: 'pointer' }} onClick={() => onNavigate(null)}>
          <i className="bi bi-house" />
        </li>
        {items.map((item, idx) => (
          <li key={item._id} className={`breadcrumb-item ${idx === items.length - 1 ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => onNavigate(item)}>
            {item.name}
          </li>
        ))}
      </ol>
    </nav>
  );
}
