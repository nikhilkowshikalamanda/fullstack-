// Safe photo uploads.
//  - Only JPEG, PNG, WebP, GIF. Maximum size from .env (default 5 MB). One file per request.
//  - The client's file name is IGNORED. We generate a random name and pick the extension
//    from the checked MIME type.
//  - After saving, we also check the file's first bytes ("magic bytes") match an image format.
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { HttpError } from './errors.js';

const MIME_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (req, file, cb) => cb(null, crypto.randomUUID() + MIME_EXT[file.mimetype]),
});

function buildUploader(field) {
  return multer({
    storage,
    limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1, fields: 20, fieldSize: 20 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!MIME_EXT[file.mimetype]) return cb(new HttpError(400, 'Only JPG, PNG, WebP or GIF images are allowed.'));
      cb(null, true);
    },
  }).single(field);
}

async function hasImageSignature(filePath, mimetype) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(12);
    await handle.read(buf, 0, 12, 0);
    if (mimetype === 'image/jpeg') return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
    if (mimetype === 'image/png') return buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (mimetype === 'image/gif') return buf.subarray(0, 4).toString('latin1') === 'GIF8';
    if (mimetype === 'image/webp') return buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP';
    return false;
  } finally {
    await handle.close();
  }
}

// Express middleware: parses the multipart form, saves the photo, verifies it.
export function handleUpload(field) {
  const uploader = buildUploader(field);
  return (req, res, next) => {
    uploader(req, res, async (err) => {
      if (err) return next(err);
      if (!req.file) return next();
      try {
        if (!(await hasImageSignature(req.file.path, req.file.mimetype))) {
          await discardUpload(req);
          return next(new HttpError(400, 'The uploaded file is not a valid image.'));
        }
        next();
      } catch (e) {
        next(e);
      }
    });
  };
}

// Relative path stored in the JSON file, e.g. "uploads/3f2c...jpg"
export const relativePath = (file) => `uploads/${path.basename(file.filename)}`;

// Delete the file saved for this request (used when validation fails afterwards).
export async function discardUpload(req) {
  if (req.file) await fs.rm(req.file.path, { force: true }).catch(() => {});
}

// Delete an old stored photo by its relative path (basename only - never trust stored paths blindly).
export async function deleteStoredPhoto(rel) {
  if (!rel) return;
  await fs.rm(path.join(config.uploadDir, path.basename(rel)), { force: true }).catch(() => {});
}
