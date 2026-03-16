/**
 * Persona limit enforcement per customer.
 * Max personas = sum of active_clones across all study rooms (sessions linked via studyrooms).
 * chat_sessions are never purged; we count only sessions belonging to study rooms.
 *
 * Early access: hardcoded 50. Future: lookup from subscription_tiers or waitlist.
 */
import { supabase } from "./supabase";

const DEFAULT_LIMIT = 50;

/**
 * Get the persona limit for a user. Tier-based lookup goes here.
 */
export async function getPersonaLimitForUser(userId: string): Promise<number> {
  // Future: lookup from waitlist.persona_limit, subscription_tiers, etc.
  // const { data } = await supabase.from('waitlist').select('persona_limit').eq('user_id', userId).single();
  // return data?.persona_limit ?? DEFAULT_LIMIT;
  return DEFAULT_LIMIT;
}

/**
 * Count total active personas across all study rooms for a user.
 * Only counts sessions linked to studyrooms (chat_sessions are never purged).
 */
export async function countActivePersonasForUser(userId: string): Promise<number> {
  const { data: studyrooms, error: srError } = await supabase
    .from("studyrooms")
    .select("session_id")
    .eq("user_id", userId)
    .not("session_id", "is", null);

  if (srError || !studyrooms?.length) return 0;

  const sessionIds = studyrooms.map((r) => r.session_id).filter(Boolean) as string[];

  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("active_clones")
    .in("id", sessionIds);

  if (error) return 0;

  const total = (sessions || []).reduce((sum, s) => {
    const arr = s.active_clones;
    const len = Array.isArray(arr) ? arr.length : 0;
    return sum + len;
  }, 0);

  return total;
}

export interface WouldExceedResult {
  ok: boolean;
  total: number;
  limit: number;
  message?: string;
}

/**
 * Check if setting a session to newCount personas would exceed the user's limit.
 * Excludes the current session's count from the total before adding newCount.
 * Only counts sessions linked to study rooms.
 */
export async function wouldExceedPersonaLimit(
  userId: string,
  sessionId: string,
  newCount: number
): Promise<WouldExceedResult> {
  const [limit, studyrooms] = await Promise.all([
    getPersonaLimitForUser(userId),
    supabase
      .from("studyrooms")
      .select("session_id")
      .eq("user_id", userId)
      .not("session_id", "is", null),
  ]);

  if (studyrooms.error || !studyrooms.data?.length) {
    return { ok: true, total: newCount, limit }; // No study rooms yet, allow
  }

  const sessionIds = studyrooms.data.map((r) => r.session_id).filter(Boolean) as string[];

  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("id, active_clones")
    .in("id", sessionIds);

  if (error) {
    return { ok: true, total: 0, limit }; // Fail open on DB error
  }

  let otherSessionsTotal = 0;
  let currentSessionCount = 0;

  for (const s of sessions || []) {
    const arr = s.active_clones;
    const len = Array.isArray(arr) ? arr.length : 0;
    if (s.id === sessionId) {
      currentSessionCount = len;
    } else {
      otherSessionsTotal += len;
    }
  }

  const newTotal = otherSessionsTotal + newCount;

  if (newTotal > limit) {
    return {
      ok: false,
      total: newTotal,
      limit,
      message: `Persona limit exceeded. You have ${limit} personas across all study rooms. Current: ${otherSessionsTotal + currentSessionCount}, requested: ${newCount}. Release some personas first.`,
    };
  }

  return { ok: true, total: newTotal, limit };
}
