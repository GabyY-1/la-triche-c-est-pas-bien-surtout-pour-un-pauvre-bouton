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
- Compteurs de test personnel et mondial, et historique des sessions.
- Suppression des sessions personnelles pour annuler leur contribution.
- Contrôles serveur : connexion obligatoire, 100 clics max par lot, 750 ms entre deux lots et 1 million par session.
- Design responsive, compatible navigateur Chromebook.

## Limite connue
Les tables réelles du Bouton Mondial n'étaient pas accessibles via la connexion Supabase lors de la création. Les clics sont donc **isolés dans acb_sessions** et ne modifient **pas** les vrais compteurs du site. Pour intégrer les vraies tables, il faudra vérifier leur structure et ajouter une opération atomique et réversible.

## Sécurité
La clé Supabase fournie est **publishable** (publique). Ne jamais ajouter de clé `service_role` au JavaScript. Les fonctions SQL ont des contrôles d'authentification. Il faut réserver l'accès aux utilisateurs autorisés si cet outil doit rester strictement privé.
