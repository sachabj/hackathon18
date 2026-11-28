// Boutique de récompenses. Prix, solde et bons sont gérés par la base (supabase/migrations/017_rewards.sql).
import { dbMessage } from "./i18n";
import { announce } from "./arrows";
import { getSupabase } from "./supabase/client";

export type RewardCategory = "local" | "app" | "raffle";

export const REWARD_CATEGORIES: Record<RewardCategory, { label: string; bg: string; text: string }> = {
  local: { label: "Commerçant local", bg: "var(--color-sage)", text: "var(--color-forest)" },
  app: { label: "Dans l'appli", bg: "var(--color-lilac)", text: "var(--color-aubergine)" },
  raffle: { label: "Tombola", bg: "#FBF0CC", text: "#6E5200" },
};

export interface Reward {
  id: string;
  category: RewardCategory;
  title: string;
  partner: string;
  description: string;
  cost: number;
  effect: "early_access" | "golden_badge" | null;
}

export interface UserReward {
  id: string;
  reward_id: string;
  /** Prix payé */
  cost: number;
  /** null : avantage activé dans l'application */
  code: string | null;
  created_at: string;
  used_at: string | null;
}

export type OwnedReward = UserReward & { reward: Reward };

/** Catalogue et mes échanges, ou null si la boutique n'existe pas encore (migration 017). */
export async function fetchShop() {
  const supabase = getSupabase();
  const [catalogue, mine] = await Promise.all([
    supabase.from("rewards").select("*").eq("active", true).order("sort"),
    supabase.from("user_rewards").select("*").order("created_at", { ascending: false }),
  ]);
  const error = catalogue.error ?? mine.error;
  if (error) {
    if (["PGRST205", "42P01"].includes(error.code ?? "")) return null;
    throw new Error(error.message);
  }
  const rewards = catalogue.data as Reward[];
  const byId = new Map(rewards.map((r) => [r.id, r]));
  const owned = (mine.data as UserReward[]).flatMap((u) => {
    const reward = byId.get(u.reward_id);
    return reward ? [{ ...u, reward }] : [];
  });
  return { rewards, owned };
}

export async function redeemReward(rewardId: string) {
  const { data, error } = await getSupabase().rpc("redeem_reward", { p_reward_id: rewardId });
  if (error) throw new Error(dbMessage(error.message));
  announce(); // le solde a changé
  return data as UserReward;
}

