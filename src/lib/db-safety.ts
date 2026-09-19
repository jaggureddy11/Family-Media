/**
 * Database Safety & Guardrail Helpers
 *
 * Enforces strict safety rules for both automated test runs and real database operations:
 * 1. Test Isolation: Automated tests (TEST_MODE=true) cannot touch real production/Neon DATABASE_URL.
 * 2. Real DB Protection: deleteMany without a WHERE clause is strictly forbidden on real databases.
 * 3. Scoped E2E Operations: Verification scripts touching real DB must tag records with "e2e-" and delete only those.
 * 4. DDL Protection: Table drop or truncate commands are forbidden in scripts/tests.
 */

export const E2E_TAG_PREFIX = "e2e-";

/**
 * Validates that automated test runs do not target a real remote database.
 * Throws a fatal error if real DATABASE_URL is configured while TEST_MODE is true.
 */
export function assertTestDatabaseSafety(env: NodeJS.ProcessEnv = process.env): void {
  const isTestMode = env.TEST_MODE === "true";
  const dbUrl = env.DATABASE_URL;

  if (isTestMode && dbUrl) {
    const isLocalOrMock =
      dbUrl.includes("localhost:5432") ||
      dbUrl.includes("mock") ||
      dbUrl.includes("dummy") ||
      env.USE_MOCK_DB === "true";

    // If TEST_MODE is true and not using mock/local DB, reject targeting real remote DB
    if (!isLocalOrMock && !env.ALLOW_REAL_DB_IN_TEST) {
      throw new Error(
        "DATABASE SAFETY VIOLATION: Real remote DATABASE_URL cannot be used while TEST_MODE is true! Automated tests must run with USE_MOCK_DB=true (or against local/mock DB) to ensure real database tables are never touched."
      );
    }
  }
}

/**
 * Ensures deleteMany on real database models cannot be called without a where clause.
 */
export function assertSafeDeleteMany(model: string, where: any): void {
  if (!where || typeof where !== "object" || Object.keys(where).length === 0) {
    throw new Error(
      `DATABASE SAFETY VIOLATION: Refusing deleteMany on model "${model}" without a where clause! Unconditional bulk deletion is strictly forbidden.`
    );
  }
}

/**
 * Validates that a string or filter tag strictly begins with "e2e-" for real DB test records.
 */
export function assertScopedE2ETag(value: string): void {
  if (!value || typeof value !== "string" || !value.startsWith(E2E_TAG_PREFIX)) {
    throw new Error(
      `DATABASE SAFETY VIOLATION: Value "${value}" must start with "${E2E_TAG_PREFIX}" to operate on real database records in tests/scripts.`
    );
  }
}

/**
 * Checks SQL commands for forbidden DROP or TRUNCATE operations.
 */
export function assertNoTableDropOrTruncate(sql: string): void {
  if (!sql || typeof sql !== "string") return;
  const upper = sql.toUpperCase();
  if (
    upper.includes("DROP TABLE") ||
    upper.includes("TRUNCATE") ||
    upper.includes("DROP SCHEMA") ||
    upper.includes("DROP DATABASE")
  ) {
    throw new Error(
      `DATABASE SAFETY VIOLATION: Destructive DDL command "${sql.trim().slice(0, 40)}..." is strictly forbidden!`
    );
  }
}
