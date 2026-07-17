import { body } from 'express-validator';

export const uploadBody = [
  body('folderId').optional({ nullable: true }).isMongoId(),
  body('visibility').optional().isIn(['public', 'private', 'protected']),
  body('displayName').optional().isString().trim().isLength({ max: 255 }),
  body('altText').optional().isString().trim().isLength({ max: 500 }),
  body('caption').optional().isString().trim().isLength({ max: 1000 }),
  body('description').optional().isString().trim().isLength({ max: 2000 }),
  body('allowDuplicate').optional().isBoolean().toBoolean(),
];
