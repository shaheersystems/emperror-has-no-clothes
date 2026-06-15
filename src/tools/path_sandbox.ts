import path from "node:path";

export function repoRoot(): string {
  return process.cwd();
}

export function resolveRepoPath(userPath: string): string {
  const root = path.resolve(repoRoot());
  const resolved = path.resolve(root, userPath);

  const rel = path.relative(root, resolved);
  // `rel === ".."` or a leading "../" segment means the path escaped the root.
  // Guard against a sibling like "..foo" being misread as an escape.
  const isOutside = rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel);
  if (isOutside) {
    throw new Error(`Path escapes repo root: ${userPath}`);
  }

  return resolved;
}

