-- ShareWood — ne garder qu'une quarantaine d'offres INVENTÉES (démo lisible, majorité d'offres réelles).
-- À lancer entre reset_demo.sql et seed_arrows.sql (inclus dans demo_complet.local.sql). Relançable.
-- ⚠️ Sur une base déjà prête, relancer ensuite seed_arrows.sql : supprimer une offre retire les Flèches liées.
-- Aucune offre réelle n'est touchée ; les offres inventées gardées conservent leur mention « Exemple fictif (démo) ».
delete from public.deals d
 using auth.users a
 where a.id = d.author_id
   and a.email like 'demo.%@example.com'
   and d.description like 'Exemple fictif (démo)%'
   and (split_part(a.email, '@', 1), d.title) not in (values
     -- Commerces fictifs : les 3 offres du compte de démo commerce1, une pour chacun des 11 autres.
     ('demo.commerce1', 'Formule étudiante à 8,90 €'), ('demo.commerce1', '-20 % le lundi soir'),
     ('demo.commerce1', 'Boisson offerte sur présentation de l''appli'),
     ('demo.commerce2', '-20 % le lundi soir'), ('demo.commerce3', 'Boisson offerte sur présentation de l''appli'),
     ('demo.commerce4', 'Formule étudiante à 8,90 €'), ('demo.commerce5', 'Panier étudiant à 5 €'),
     ('demo.commerce6', 'Invendus du jour à -50 %'), ('demo.commerce7', '-15 % sur le vrac'),
     ('demo.commerce8', 'Séance d''essai gratuite'), ('demo.commerce9', 'Carnet 10 séances étudiant'),
     ('demo.commerce10', 'Entrée à 5 € le mercredi'), ('demo.commerce11', 'Pass 3 entrées à 12 €'),
     ('demo.commerce12', 'Soirée découverte gratuite'),
     -- « Étudiants » : le scénario de démo et quelques offres par catégorie.
     ('demo.malo', 'Covoiturage Bruz → Rennes le vendredi'), ('demo.malo', 'Petit-déjeuner étudiant à 3 €'),
     ('demo.malo', 'Happy hour étudiant jusqu''à 21 h'), ('demo.lea', 'Menu étudiant à 7,50 €'),
     ('demo.lea', '-15 % sur l''addition le midi'), ('demo.lea', 'Inscription à moitié prix pour les boursiers'),
     ('demo.hugo', 'Viennoiseries à -50 % en fin de journée'), ('demo.hugo', 'Séance d''essai offerte'),
     -- demo.lea et demo.hugo : assez de publications pour leur historique de Flèches (seed_arrows).
     ('demo.hugo', '-15 % sur l''addition le midi'), ('demo.hugo', 'Plat du jour à 8 €'),
     ('demo.lea', 'Formule midi sandwich + boisson'), ('demo.lea', 'Panier fruits et légumes à 4 €'),
     ('demo.sarah', 'Menu étudiant à 6,90 €'), ('demo.sarah', 'Pain de la veille à moitié prix'),
     ('demo.sarah', 'Séance d''essai offerte'), ('demo.ines', 'Plats préparés à -40 % après 19 h'),
     ('demo.ines', 'Créneau libre étudiant'), ('demo.tom', '2 pizzas achetées, la 3e offerte'),
     ('demo.tom', 'Invendus du soir à moitié prix'), ('demo.chloe', 'Premier mois de salle offert'),
     ('demo.yanis', 'Cagette de fruits et légumes à 4 €'), ('demo.nolan', 'Boisson offerte avec un menu')
   );
