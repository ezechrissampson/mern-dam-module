import { body, param } from 'express-validator';

export const folderIdParam = [param('id').isMongoId().withMessage('Invalid folder id.')];

export const createFolderBody = [
  body('name').isString().trim().isLength({ min: 1, max: 255 }),
  body('parentId').optional({ nullable: true }).isMongoId(),
  body('description').optional().isString().trim().isLength({ max: 1000 }),
  body('color').optional().isString().trim(),
  body('icon').optional().isString().trim(),
];

export const renameFolderBody = [body('name').isString().trim().isLength({ min: 1, max: 255 })];

export const moveFolderBody = [body('parentId').optional({ nullable: true }).isMongoId()];
