// JSON file "database".
// Safety features for a single-instance academic demo:
//  1. All writes go through ONE queue, so two requests can never write at the same time.
//  2. We write to a temporary file and then rename it, so a crash cannot leave half a file.
//  3. Read/write failures become clean 500 errors instead of crashing the server.
// For production use a real database (PostgreSQL, MongoDB, ...).
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { buildSeedData } from './seedData.js';
import { HttpError } from './errors.js';

let queue = Promise.resolve();

export async function initDb() {
  await fs.mkdir(path.dirname(config.dataFile), { recursive: true });
  await fs.mkdir(config.uploadDir, { recursive: true });
  try {
    await fs.access(config.dataFile);
  } catch {
    await writeAtomic(buildSeedData());
    console.log('Created data/db.json with sample civic issues.');
  }
}

export async function readDb() {
  try {
    return JSON.parse(await fs.readFile(config.dataFile, 'utf8'));
  } catch (err) {
    console.error('DB read failed:', err);
    throw new HttpError(500, 'The data store could not be read. Please try again.');
  }
}

async function writeAtomic(data) {
  const tmp = `${config.dataFile}.${process.pid}.tmp`;
  try {
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, config.dataFile);
  } catch (err) {
    console.error('DB write failed:', err);
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw new HttpError(500, 'Your change could not be saved. Please try again.');
  }
}

// updateDb(fn): reads the data, lets fn(data) change it, then saves it.
// If fn throws (e.g. "not found"), nothing is saved. Returns whatever fn returns.
export function updateDb(mutator) {
  const run = queue.then(async () => {
    const data = await readDb();
    const result = await mutator(data);
    await writeAtomic(data);
    return result;
  });
  queue = run.catch(() => {}); // keep the queue alive after a failure
  return run;
}
