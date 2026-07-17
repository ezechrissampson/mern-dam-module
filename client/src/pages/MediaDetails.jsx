import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mediaApi from '../api/mediaApi.js';
import MediaDetailsDrawer from '../components/media/MediaDetailsDrawer.jsx';
import Loading from './status/Loading.jsx';

/**
 * Deep-linkable details route (e.g. shared link to a specific asset).
 * Reuses the same drawer component used inline from the Media Library,
 * closing navigates back to the library.
 */
export default function MediaDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);

  const load = () => mediaApi.get(id).then((r) => setMedia(r.data));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!media) return <Loading />;

  return <MediaDetailsDrawer media={media} onClose={() => navigate('/library')} onChanged={load} />;
}
