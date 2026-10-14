# AC Button V0.1

Application web privée de test des compteurs, conçue pour un Chromebook.

## Installation
1. Ouvrir le projet Supabase correspondant à `rtxtwbizfbsjhvttyatn`.
2. Coller le contenu de `supabase/setup.sql` dans **SQL Editor**, puis exécuter.
3. Déployer le dépôt comme site statique (ex. Vercel, sans commande de build).
4. Ouvrir le site, se connecter avec un compte Supabase du projet, puis lancer une session.

## Fonctions
- Authentification Supabase par e-mail et mot de passe.
- Débit configurable de 1 à 100 clics/s, avec un lot toutes les secondes.
- Compteurs **réels** personnel et mondial, et historique des sessions.
- Suppression des sessions personnelles via la fonction RPC `acb_remove`, qui annule leur contribution dans les vrais compteurs.
- Contrôles serveur : connexion obligatoire, 100 clics max par lot, 750 ms entre deux lots et 1 million par session.
- Design responsive, compatible navigateur Chromebook.

## Limite connue
**Mise à jour :** la liaison est installée sur Supabase. `acb_add` ajoute les clics aux tables réelles `button_players` et `button_world` dans une transaction. `acb_contributions` conserve les périodes quotidiennes/hebdomadaires des clics de test pour que `acb_remove` les annule proprement. Les sessions existantes sont gérées séparément. **La migration additionnelle a été déployée sur le projet Supabase connecté**, et n'est pas incluse dans `setup.sql` (qui contient le schéma initial seulement).

## Sécurité
La clé Supabase fournie est **publishable** (publique). Ne jamais ajouter de clé `service_role` au JavaScript. Les fonctions SQL ont des contrôles d'authentification. Il faut réserver l'accès aux utilisateurs autorisés si cet outil doit rester strictement privé.
