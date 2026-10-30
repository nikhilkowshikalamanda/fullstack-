// Administrator credential check. ACADEMIC USE ONLY: one admin account taken from .env.
// The plain password is hashed with bcrypt at startup and only the hash is kept in memory.
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { config } from './config.js';

const adminHash = config.adminPassword.length >= 8 ? bcrypt.hashSync(config.adminPassword, 10) : null;
const sha = (s) => crypto.createHash('sha256').update(s).digest();

export const adminConfigured = () => adminHash !== null;

export async function verifyAdmin(username, password) {
  if (!adminHash) return false;
  // Compare hashes of the usernames so the comparison time does not leak information.
  const userOk = crypto.timingSafeEqual(sha(username), sha(config.adminUsername));
  const passOk = await bcrypt.compare(password, adminHash); // always run, even if username is wrong
  return userOk && passOk;
}
