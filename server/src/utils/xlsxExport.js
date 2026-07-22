import ExcelJS from 'exceljs';

/**
 * Builds a downloadable .xlsx workbook of media metadata, used by the
 * "Export Metadata" bulk operation.
 *
 * Uses exceljs rather than SheetJS (the "xlsx" npm package): the xlsx
 * package published to npm is no longer maintained there (the project
 * redirects installs to buy a separate CDN-hosted build) and older
 * versions carry known prototype-pollution advisories, which is a poor
 * fit for a module whose job is to safely handle files from users.
 * exceljs is actively maintained, has no such history, and its
 * streaming writer keeps memory flat even for large exports.
 */
export async function buildMetadataWorkbook(rows) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DAM Module';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Media Metadata');

  sheet.columns = [
    { header: 'ID', key: 'id', width: 26 },
    { header: 'Display Name', key: 'displayName', width: 32 },
    { header: 'Description', key: 'description', width: 40 },
    { header: 'Alt Text', key: 'altText', width: 28 },
    { header: 'Caption', key: 'caption', width: 28 },
    { header: 'Tags', key: 'tags', width: 24 },
    { header: 'MIME Type', key: 'mimeType', width: 30 },
    { header: 'Size (bytes)', key: 'bytes', width: 14 },
    { header: 'URL', key: 'url', width: 55 },
    { header: 'Created At', key: 'createdAt', width: 22 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }; // dam-primary-light

  rows.forEach((row) => {
    sheet.addRow({
      id: String(row.id ?? ''),
      displayName: row.displayName ?? '',
      description: row.description ?? '',
      altText: row.altText ?? '',
      caption: row.caption ?? '',
      tags: Array.isArray(row.tags) ? row.tags.join(', ') : (row.tags ?? ''),
      mimeType: row.mimeType ?? '',
      bytes: row.bytes ?? 0,
      url: row.url ?? '',
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : '',
    });
  });

  sheet.autoFilter = { from: 'A1', to: 'J1' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  return workbook.xlsx.writeBuffer();
}

export default buildMetadataWorkbook;
