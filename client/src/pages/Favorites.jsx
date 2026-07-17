import { useEffect, useState } from 'react';
import mediaApi from '../api/mediaApi.js';
import MediaCard from '../components/media/MediaCard.jsx';
import MediaDetailsDrawer from '../components/media/MediaDetailsDrawer.jsx';
import SkeletonGrid from '../components/common/SkeletonGrid.jsx';
import EmptyState from '../components/common/EmptyState.jsx';

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMedia, setActiveMedia] = useState(null);

  const load = () => {
    setLoading(true);
    mediaApi
      .listFavorites({})
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div>
      <h3 className="mb-1">Favorites</h3>
      <p className="text-dam-secondary mb-3">Assets you've starred for quick access</p>

      {loading && <SkeletonGrid />}

      {!loading && items.length === 0 && <EmptyState icon="bi-star" title="No favorites yet" message="Star assets from the Media Library to see them here." />}

      {!loading && items.length > 0 && (
        <div className="dam-media-grid">
          {items.map((media) => (
            <MediaCard key={media._id} media={media} selected={false} onToggleSelect={() => {}} onOpenDetails={setActiveMedia} onDelete={() => {}} onChanged={load} />
          ))}
        </div>
      )}

      {activeMedia && <MediaDetailsDrawer media={activeMedia} onClose={() => setActiveMedia(null)} onChanged={load} />}
    </div>
  );
}
