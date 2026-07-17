/** Maps asset category / extension to a Bootstrap Icons class for non-image files. */
export const CATEGORY_ICON = {
  image: 'bi-file-earmark-image',
  document: 'bi-file-earmark-text',
  video: 'bi-file-earmark-play',
  audio: 'bi-file-earmark-music',
  archive: 'bi-file-earmark-zip',
  other: 'bi-file-earmark',
};

export const EXTENSION_ICON = {
  '.pdf': 'bi-file-earmark-pdf',
  '.doc': 'bi-file-earmark-word',
  '.docx': 'bi-file-earmark-word',
  '.xls': 'bi-file-earmark-excel',
  '.xlsx': 'bi-file-earmark-excel',
  '.ppt': 'bi-file-earmark-ppt',
  '.pptx': 'bi-file-earmark-ppt',
  '.csv': 'bi-filetype-csv',
  '.json': 'bi-filetype-json',
  '.zip': 'bi-file-earmark-zip',
  '.svg': 'bi-filetype-svg',
  '.txt': 'bi-file-earmark-text',
};

export function iconFor(media) {
  return EXTENSION_ICON[media.extension] || CATEGORY_ICON[media.category] || 'bi-file-earmark';
}
