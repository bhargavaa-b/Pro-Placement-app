import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only initialize remote Supabase browser client if valid env vars are explicitly configured
export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

export async function syncCandidateToSupabase(
  profile: UserProfile
): Promise<void> {
  if (!profile.email || !supabase) return;
  const normalizedEmail = profile.email.trim().toLowerCase();

  try {
    await supabase.from('candidates').upsert(
      {
        email: normalizedEmail,
        name: profile.name.trim().slice(0, 100),
        university: (profile.university || 'Engineering Institution')
          .trim()
          .slice(0, 160),
        graduation_year: (profile.graduationYear || '').trim().slice(0, 16),
        streak_days: profile.streakDays || 0,
        streak_shield_active: Boolean(profile.streakShieldActive),
        high_game_score: profile.highGameScore || 0,
        solved_dsa_ids: profile.solvedDSAIds || [],
        solved_aptitude_ids: profile.solvedAptitudeIds || [],
        bookmarked_dsa_ids: profile.bookmarkedDSAIds || [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );
  } catch {
    // Non-blocking
  }
}

export async function loadCandidateFromSupabase(
  email: string
): Promise<Partial<UserProfile> | null> {
  if (!email || !supabase) return null;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !data) return null;

    return {
      name: data.name,
      email: data.email,
      university: data.university || 'Engineering Institution',
      graduationYear: data.graduation_year || '',
      streakDays: typeof data.streak_days === 'number' ? data.streak_days : 0,
      streakShieldActive: Boolean(data.streak_shield_active),
      highGameScore:
        typeof data.high_game_score === 'number' ? data.high_game_score : 0,
      solvedDSAIds: Array.isArray(data.solved_dsa_ids)
        ? data.solved_dsa_ids
        : [],
      solvedAptitudeIds: Array.isArray(data.solved_aptitude_ids)
        ? data.solved_aptitude_ids
        : [],
      bookmarkedDSAIds: Array.isArray(data.bookmarked_dsa_ids)
        ? data.bookmarked_dsa_ids
        : [],
    };
  } catch {
    return null;
  }
}
