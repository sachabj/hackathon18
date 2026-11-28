// Compétition entre écoles (tâche 70, migration 028) : liste des écoles et classement calculé par la base.
// Sans la migration : liste vide (le champ texte libre reste), classement null (rien n'est affiché).
import { getSupabase } from "./supabase/client";

export interface School {
  id: string;
  name: string;
  city: string;
}

export interface SchoolRank {
  id: string;
  name: string;
  members: number;
  /** Membres ayant gagné au moins une Flèche ces 7 derniers jours */
  active: number;
  points: number;
  /** Flèches de la semaine par membre actif */
  score: number;
  rank: number;
}

export interface SchoolRanking {
  ranking: SchoolRank[];
  my_school: string | null;
  /** Membres de son école (classée à partir de 3) */
  my_members: number;
}

/** Nombre de membres à partir duquel une école est classée (la base applique le même). */
export const SCHOOL_MIN_MEMBERS = 3;

export async function fetchSchools(): Promise<School[]> {
  const { data, error } = await getSupabase().from("schools").select("id, name, city").order("sort");
  return error ? [] : (data as School[]);
}

export async function fetchSchoolRanking(): Promise<SchoolRanking | null> {
  const { data, error } = await getSupabase().rpc("school_ranking");
  if (!error) return data as SchoolRanking;
  if (error.code !== "PGRST202") console.warn("Classement des écoles indisponible :", error.message);
  return null;
}

/** École choisie dans la liste (`schoolId`), ou « Autre » avec son nom (`other`), ou rien. */
export async function saveSchoolChoice(userId: string, schoolId: string | null, other: string) {
  const row = { user_id: userId, school_id: schoolId, school: schoolId ? null : other.trim() || null };
  const { error } = await getSupabase().from("preferences").upsert(row, { onConflict: "user_id" });
  if (!error) return;
  throw new Error(
    error.code === "PGRST204"
      ? "La base de données n'est pas à jour : lancer supabase/migrations/028_school_ranking.sql."
      : error.message,
  );
}
