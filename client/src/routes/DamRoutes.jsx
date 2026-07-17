import { Routes, Route } from 'react-router-dom';
import AppLayout from '../components/common/AppLayout.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import MediaLibrary from '../pages/MediaLibrary.jsx';
import MediaDetails from '../pages/MediaDetails.jsx';
import Folders from '../pages/Folders.jsx';
import UploadManager from '../pages/UploadManager.jsx';
import Favorites from '../pages/Favorites.jsx';
import BulkOperations from '../pages/BulkOperations.jsx';
import ActivityLog from '../pages/ActivityLog.jsx';
import RecycleBin from '../pages/RecycleBin.jsx';
import StorageProviders from '../pages/StorageProviders.jsx';
import CloudinarySettings from '../pages/CloudinarySettings.jsx';
import NotFound from '../pages/status/NotFound.jsx';
import Forbidden from '../pages/status/Forbidden.jsx';
import Offline from '../pages/status/Offline.jsx';
import Maintenance from '../pages/status/Maintenance.jsx';

/**
 * DamRoutes — the full route table for this module.
 *
 * STANDALONE: rendered as-is by App.jsx for local development/demo.
 *
 * MOUNTED INTEGRATION: nest these <Route> elements under your host
 * application's own authenticated layout route instead of <AppLayout>,
 * e.g.:
 *   <Route path="/admin" element={<YourAppShell />}>
 *     <Route path="media-manager/*" element={<DamRoutes embedded />} />
 *   </Route>
 * See README > Integration Guide.
 */
export default function DamRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="library" element={<MediaLibrary />} />
        <Route path="media/:id" element={<MediaDetails />} />
        <Route path="folders" element={<Folders />} />
        <Route path="upload" element={<UploadManager />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="bulk" element={<BulkOperations />} />
        <Route path="activity" element={<ActivityLog />} />
        <Route path="recycle-bin" element={<RecycleBin />} />
        <Route path="storage-providers" element={<StorageProviders />} />
        <Route path="cloudinary-settings" element={<CloudinarySettings />} />
        <Route path="403" element={<Forbidden />} />
        <Route path="offline" element={<Offline />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
