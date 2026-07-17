import { body, param, query } from 'express-validator';

export const mediaIdParam = [param('id').isMongoId().withMessage('Invalid media id.')];

export const listMediaQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sort').optional().isString(),
  query('q').optional().isString().trim().escape(),
];

export const updateMetadataBody = [
  body('displayName').optional().isString().trim().isLength({ max: 255 }),
  body('description').optional().isString().trim().isLength({ max: 2000 }),
  body('altText').optional().isString().trim().isLength({ max: 500 }),
  body('caption').optional().isString().trim().isLength({ max: 1000 }),
  body('seoTitle').optional().isString().trim().isLength({ max: 255 }),
  body('copyright').optional().isString().trim().isLength({ max: 255 }),
  body('license').optional().isString().trim().isLength({ max: 255 }),
  body('photographer').optional().isString().trim().isLength({ max: 255 }),
  body('visibility').optional().isIn(['public', 'private', 'protected']),
  body('categories').optional().isArray({ max: 20 }),
];

export const assignTagsBody = [body('tags').isArray({ min: 0, max: 30 }), body('tags.*').isString().trim().isLength({ max: 50 })];

export const moveMediaBody = [body('folderId').optional({ nullable: true }).isMongoId()];

export const recordUsageBody = [
  body('contentType').isString().trim().notEmpty(),
  body('contentId').isString().trim().notEmpty(),
  body('fieldName').optional().isString().trim(),
  body('contentLabel').optional().isString().trim(),
  body('contentUrl').optional().isURL({ require_tld: false }),
];

export const bulkIdsBody = [body('ids').isArray({ min: 1, max: 500 }), body('ids.*').isMongoId()];
