-- ShareWood — on ne vote pas sur son propre bon plan (à exécuter après 009_account.sql ; relançable sans risque).
-- Sans cette règle, un auteur pouvait gonfler sa fiabilité et relancer lui-même ses 7 jours d'accès complet.

-- Les votes déjà enregistrés par des auteurs sur leurs propres bons plans sont effacés.
delete from public.votes v using public.deals d where v.deal_id = d.id and v.user_id = d.author_id;

-- « is distinct from » : un bon plan sans auteur (compte supprimé) reste ouvert aux votes.
drop policy if exists "voter" on public.votes;
create policy "voter" on public.votes for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id is distinct from auth.uid())
);
drop policy if exists "changer son vote" on public.votes;
create policy "changer son vote" on public.votes for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid() and exists (select 1 from public.deals d where d.id = deal_id and d.author_id is distinct from auth.uid())
  );
