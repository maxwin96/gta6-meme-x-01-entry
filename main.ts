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

import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join } from 'node:path';

const sourceDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const targetDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const fileName = 'POST.json';

async function handOverPost() {
  const sourcePath = join(sourceDir, fileName);
  const targetPath = join(targetDir, fileName);

  // Fail early with a specific message if the source file is missing
  // or unreadable, instead of a generic read error further down.
  try {
    await access(sourcePath, constants.R_OK);
  } catch (cause) {
    console.error(
      `Source file ${sourcePath} is missing or unreadable: ${(cause as Error).message}`,
    );
    process.exit(1);
  }

  let post;
  try {
    post = await readFile(sourcePath, 'utf8');
  } catch (cause) {
    console.error(`Could not read ${sourcePath}: ${(cause as Error).message}`);
    process.exit(1);
  }

  // The gate expects a JSON object naming the post; refuse to hand over
  // a file that is not even shaped like one, and validate that the
  // named post is a real X/Twitter post URL — a wrong or missing url
  // would otherwise be copied silently and fail only at the judge.
  let parsed;
  try {
    parsed = JSON.parse(post);
  } catch {
    console.error(`${sourcePath} is not valid JSON, refusing to copy it.`);
    process.exit(1);
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    Array.isArray(parsed) ||
    typeof parsed.url !== 'string' ||
    !(
      parsed.url.startsWith('https://x.com/') ||
      parsed.url.startsWith('https://twitter.com/')
    )
  ) {
    console.error(
      `${sourcePath} must be a JSON object with a "url" string starting with "https://x.com/" or "https://twitter.com/", got: ${JSON.stringify(parsed)}`,
    );
    process.exit(1);
  }

  await mkdir(targetDir, { recursive: true });
  // Write atomically: write to a temp file in the same directory and
  // rename it over the target, so the gate never sees a half-written
  // POST.json if this process dies mid-write.
  const tempPath = `${targetPath}.tmp`;
  try {
    await writeFile(tempPath, post, 'utf8');
    await rename(tempPath, targetPath);
  } catch (cause) {
    console.error(`Could not write ${targetPath}: ${(cause as Error).message}`);
    process.exit(1);
  }
  console.log(`Wrote ${targetPath}`);
}

await handOverPost();
