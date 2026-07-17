export default function SkeletonGrid({ count = 12 }) {
  return (
    <div className="dam-media-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="dam-skeleton" style={{ width: '100%', aspectRatio: '1/1' }} />
          <div className="dam-skeleton mt-2" style={{ height: 12, width: '80%' }} />
        </div>
      ))}
    </div>
  );
}
