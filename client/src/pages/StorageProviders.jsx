import { useEffect, useState } from 'react';
import dashboardApi from '../api/dashboardApi.js';

export default function StorageProviders() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardApi.stats().then((r) => setStats(r.data));
  }, []);

  return (
    <div>
      <h3 className="mb-1">Storage Providers</h3>
      <p className="text-dam-secondary mb-3">This module's storage layer is provider-agnostic — swap providers via the STORAGE_PROVIDER environment variable with no application code changes.</p>

      <div className="row g-3">
        {(stats?.storageProvider.registered || ['cloudinary', 'local']).map((name) => {
          const active = stats?.storageProvider.active === name;
          return (
            <div className="col-md-4" key={name}>
              <div className={`dam-surface p-4 ${active ? 'border-success' : ''}`} style={active ? { borderWidth: 2 } : undefined}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="text-capitalize mb-0">{name}</h6>
                  {active && <span className="badge bg-success">Active</span>}
                </div>
                {active ? (
                  <>
                    <div className="d-flex justify-content-between small">
                      <span className="text-dam-secondary">Health</span>
                      <span className={`badge ${stats.storageProvider.health?.status === 'healthy' ? 'bg-success' : 'bg-danger'}`}>
                        {stats.storageProvider.health?.status}
                      </span>
                    </div>
                    {stats.storageProvider.health?.latencyMs !== undefined && (
                      <div className="d-flex justify-content-between small">
                        <span className="text-dam-secondary">Latency</span>
                        <span>{stats.storageProvider.health.latencyMs}ms</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-dam-secondary small mb-0">Not currently active. Set STORAGE_PROVIDER={name} to switch.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
