export default function CloudinarySettings() {
  return (
    <div>
      <h3 className="mb-1">Cloudinary Settings</h3>
      <p className="text-dam-secondary mb-3">Configuration reference for the active Cloudinary adapter. Credentials are managed via environment variables and never exposed to the client.</p>

      <div className="dam-surface p-4">
        <table className="table table-sm mb-0">
          <tbody>
            <tr>
              <td className="text-dam-secondary">Cloud Name</td>
              <td className="font-monospace">CLOUDINARY_CLOUD_NAME</td>
            </tr>
            <tr>
              <td className="text-dam-secondary">API Key</td>
              <td className="font-monospace">CLOUDINARY_API_KEY (server-side only)</td>
            </tr>
            <tr>
              <td className="text-dam-secondary">API Secret</td>
              <td className="font-monospace">CLOUDINARY_API_SECRET (server-side only)</td>
            </tr>
            <tr>
              <td className="text-dam-secondary">Root Folder</td>
              <td className="font-monospace">CLOUDINARY_ROOT_FOLDER</td>
            </tr>
            <tr>
              <td className="text-dam-secondary">Secure Delivery</td>
              <td className="font-monospace">CLOUDINARY_SECURE=true</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-dam-secondary small mt-3">
        See the README's "Cloudinary Configuration" section for the full setup walkthrough, including transformation presets and folder mapping conventions.
      </p>
    </div>
  );
}
