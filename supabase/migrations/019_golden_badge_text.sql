-- ShareWood — le Badge Doré s'affiche sur la page « Ciblés », plus sur le profil (à exécuter après 017 ;
-- relançable sans risque). Texte de la boutique uniquement.
update public.rewards set description = 'Un badge doré sur ta page « Ciblés », pour toujours.' where id = 'golden';
