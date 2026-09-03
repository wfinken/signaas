/**
 * The running tally of signatures served, kept in D1.
 *
 * The counter is a vanity metric, so it is never allowed to cost anyone a
 * signature: the increment runs after the response is sent, every failure is
 * logged and swallowed, and a missing table is created on first use so a fresh
 * database needs no migration step before it starts counting.
 */

const COUNTER = "signatures";

const CREATE =
  "CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0)";
const BUMP =
  "INSERT INTO counters (name, value) VALUES (?1, 1) ON CONFLICT(name) DO UPDATE SET value = value + 1";
const READ = "SELECT value FROM counters WHERE name = ?1";

function missingTable(error: unknown): boolean {
  return error instanceof Error && /no such table/i.test(error.message);
}

/** Adds one to the tally. Resolves either way; the caller never waits on it. */
export async function countSignature(db: D1Database): Promise<void> {
  try {
    await db.prepare(BUMP).bind(COUNTER).run();
  } catch (error) {
    if (!missingTable(error)) {
      console.warn("signaas: could not count a signature", error);
      return;
    }
    try {
      await db.prepare(CREATE).run();
      await db.prepare(BUMP).bind(COUNTER).run();
    } catch (retry) {
      console.warn("signaas: could not create the counters table", retry);
    }
  }
}

/**
 * How many signatures have been served, or null when nothing is counting:
 * no database bound, or the database unreachable.
 */
export async function signaturesServed(db: D1Database | undefined): Promise<number | null> {
  if (!db) return null;
  try {
    const row = await db.prepare(READ).bind(COUNTER).first<{ value: number }>();
    return row?.value ?? 0;
  } catch (error) {
    // A bound database with no table yet has simply served nothing so far.
    if (missingTable(error)) return 0;
    console.warn("signaas: could not read the signature tally", error);
    return null;
  }
}
