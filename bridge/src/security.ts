import path from "node:path";

export function assertInsideDirectory(rootDir: string, targetPath: string): string {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(targetPath);

  if (resolvedTarget !== resolvedRoot && !resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Path outside allowed directory: ${resolvedTarget}`);
  }

  return resolvedTarget;
}

export function isLocalhostOrigin(origin?: string): boolean {
  if (!origin) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    return ["127.0.0.1", "localhost"].includes(parsed.hostname);
  } catch {
    return false;
  }
}
