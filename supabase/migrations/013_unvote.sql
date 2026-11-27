-- ShareWood — décocher sa réaction (à exécuter après 011 ; relançable sans risque).
-- « Toujours dispo » disparaît : « J'y suis allé » enregistre le passage ET un vote +1 (confirmation).
-- « J'y suis allé » et « Plus dispo » se décochent : il faut pouvoir retirer son propre vote.
drop policy if exists "retirer son vote" on public.votes;
create policy "retirer son vote" on public.votes for delete to authenticated using (user_id = auth.uid());
grant delete on public.votes to authenticated;
