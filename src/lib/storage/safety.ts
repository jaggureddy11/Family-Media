import { StorageProvider } from "./types";

export const ALLOWED_TEST_PREFIX = "e2e-tmp/";

/**
 * Validates that a storage key is strictly within the dedicated test prefix.
 * Throws an error if any attempt is made to touch keys outside ALLOWED_TEST_PREFIX.
 */
export function assertSafeTestKey(key: string): void {
  if (!key || typeof key !== "string" || !key.startsWith(ALLOWED_TEST_PREFIX)) {
    throw new Error(
      `SAFETY VIOLATION: Refusing to operate on key "${key}". Tests and cleanup helpers may only touch keys under "${ALLOWED_TEST_PREFIX}".`
    );
  }
}

/**
 * Validates that a prefix strictly begins with ALLOWED_TEST_PREFIX and is not empty or root.
 */
export function assertSafeTestPrefix(prefix: string): void {
  if (
    !prefix ||
    typeof prefix !== "string" ||
    !prefix.startsWith(ALLOWED_TEST_PREFIX) ||
    prefix.trim() === ALLOWED_TEST_PREFIX ||
    prefix.trim() === ""
  ) {
    throw new Error(
      `SAFETY VIOLATION: Refusing to operate on prefix "${prefix}". Tests and cleanup helpers must specify a scoped sub-prefix (e.g. "${ALLOWED_TEST_PREFIX}<runId>/").`
    );
  }
}

/**
 * Safely lists and deletes only objects within a strictly scoped test prefix (e.g. e2e-tmp/<runId>/).
 * Refuses root prefixes, empty prefixes, or any keys outside e2e-tmp/.
 */
export async function safeDeleteTestPrefix(
  provider: StorageProvider,
  scopedPrefix: string
): Promise<{ deletedCount: number; keys: string[] }> {
  assertSafeTestPrefix(scopedPrefix);

  const objects = await provider.list(scopedPrefix);
  const deletedKeys: string[] = [];

  for (const obj of objects) {
    assertSafeTestKey(obj.key);
    await provider.delete(obj.key);
    deletedKeys.push(obj.key);
  }

  // Verify prefix is clean
  const remaining = await provider.list(scopedPrefix);
  if (remaining.length > 0) {
    throw new Error(
      `Failed to fully clean scoped test prefix "${scopedPrefix}". ${remaining.length} objects remain.`
    );
  }

  return {
    deletedCount: deletedKeys.length,
    keys: deletedKeys,
  };
}

/**
 * Safely deletes a single test object key, strictly checking that it is within e2e-tmp/.
 */
export async function safeDeleteTestObject(
  provider: StorageProvider,
  key: string
): Promise<void> {
  assertSafeTestKey(key);
  await provider.delete(key);
}
