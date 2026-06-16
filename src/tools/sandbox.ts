import path from "node:path";

/** The directory that tool paths are resolved against and confined to. */
export function repoRoot(): string {
  return process.cwd();
}

/**
 * Resolve a user-supplied path against the repo root, rejecting any path that
 * escapes it. Shared by every filesystem tool to keep the sandbox consistent.
 */
export function resolveRepoPath(userPath: string): string {
  const root = path.resolve(repoRoot());
  const resolved = path.resolve(root, userPath);

  const rel = path.relative(root, resolved);
  // `rel === ".."` or a leading "../" segment means the path escaped the root.
  // Guard against a sibling like "..foo" being misread as an escape.
  const isOutside =
    rel === ".." || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel);
  if (isOutside) {
    throw new Error(`Path escapes repo root: ${userPath}`);
  }

  return resolved;
}
