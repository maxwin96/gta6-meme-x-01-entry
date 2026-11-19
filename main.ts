// gta6-meme-x-01 entry point (Node 22, standard library only).
//
// The entry itself is the X post named by POST.json: the house fetches
// that post (its first picture and its text) and hands it to the judge.
// All this program does is hand POST.json over — it reads the file from
// the repository root and writes an identical copy to the output
// directory, where the gate picks it up.
//
// When run outside the grading container, the two directories can be
// pointed elsewhere with environment variables:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const sourceDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const fileName = 'POST.json';

async function handOverPost() {
  const sourcePath = join(sourceDir, fileName);
  const targetPath = join(targetDir, fileName);

  let post;
  try {
    post = await readFile(sourcePath, 'utf8');
  } catch (cause) {
    console.error(`Could not read ${sourcePath}: ${(cause as Error).message}`);
    process.exit(1);
  }

  // The gate expects a JSON object naming the post; refuse to hand over
  // a file that is not even shaped like one.
  try {
    JSON.parse(post);
  } catch {
    console.error(`${sourcePath} is not valid JSON, refusing to copy it.`);
    process.exit(1);
  }

  await mkdir(targetDir, { recursive: true });
  try {
    await writeFile(targetPath, post, 'utf8');
  } catch (cause) {
    console.error(`Could not write ${targetPath}: ${(cause as Error).message}`);
    process.exit(1);
  }
  console.log(`Wrote ${targetPath}`);
}

await handOverPost();
