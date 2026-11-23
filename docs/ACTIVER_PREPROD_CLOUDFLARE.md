# Activer les fonctions métier sur la Preview Cloudflare

## Situation diagnostiquée le 23 novembre 2026

- **Projet Supabase cible uniquement** : `xuvaihwygkcwriqfnkbg`.
- **Worker** : `trade-in-pro`, **Preview** : `migration-cloudflare`.
- URL Preview : https://migration-cloudflare-trade-in-pro.samysamsung695.workers.dev
- Les bindings publics `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` sont présents dans la Preview.
- Le binding privé `SUPABASE_SERVICE_ROLE_KEY` est **absent** de la Preview (contrôle Cloudflare API).
- Les politiques RLS de `estimations`, `estimation_defects` et `repair_items` n'autorisent pas directement les inserts d'un client `authenticated`. Les fonctions métier utilisent donc le client Supabase administrateur côté serveur. **Il ne faut pas contourner ces règles par de nouveaux GRANT ou une désactivation de RLS.**

En conséquence, la compilation et l'affichage ne prouvent pas que l'enregistrement des estimations, des dossiers de réparation ou l'invitation de membres fonctionnent.

## Action unique de configuration sécurisée

Le connecteur Supabase actuellement accessible ne fournit **pas** les clés privées du projet. L'agent ne doit ni les fabriquer ni tenter de les extraire de PostgreSQL. Le propriétaire ou un administrateur autorisé doit donc effectuer **une seule saisie sécurisée directement dans Wrangler**, sans jamais communiquer la clé dans le chat.

1. Dans le [tableau de bord du projet Supabase](https://supabase.com/dashboard/project/xuvaihwygkcwriqfnkbg/settings/api-keys), ouvrir **API Keys** et récupérer une **clé secrète** du projet cible (type `sb_secret_...`), de préférence une clé dédiée à cette application. Vérifier qu'elle appartient bien au projet cible et pas à l'ancien staging. La clé `sb_publishable_...` ne convient pas.
2. Depuis le dossier local du dépôt GitHub, s'authentifier à Wrangler si nécessaire (`bunx wrangler login`), puis exécuter :

   ```bash
   bash scripts/configurer-secret-preview.sh
   ```

3. Saisir la clé **uniquement dans l'invite Wrangler**, jamais en argument, en variable `VITE_*`, dans un fichier suivi par Git, dans une issue ou dans un message ChatGPT.
4. **Contrôler** que la Preview `migration-cloudflare` possède les trois noms de bindings, sans afficher leurs valeurs. Vérifier que le Worker de production et les autres Previews n'ont pas été modifiés.
5. Exécuter ensuite les tests fonctionnels avec **identités de test autorisées** : connexion, espace boutique, création d'estimation, création de réparation, suivi, génération de facture, permissions d'une seconde boutique. Ne pas utiliser les comptes réels pour effectuer des écritures de test.
6. Si un essai échoue, examiner le **statut**, l'**identifiant de requête** et les logs **sans secret ni donnée personnelle**, puis corriger le code sur `migration-cloudflare`.

**Important :** ne jamais exécuter `wrangler secret put` sans le sous-commande `preview`, qui ciblerait le Worker principal. Les secrets d'une Preview et ceux du Worker principal ne sont pas interchangeables.

## Après la configuration

- Le smoke test HTTP sans identifiants valide seulement les pages SSR, les balises publiques et l'accès à Supabase Auth ; il ne valide pas les transactions.
- Tester le comportement serveur privilégié et les permissions multi-boutiques avant de considérer l'application complète.
- Maintenir la PR #1 en brouillon et Lovable comme source active. Faire la comparaison finale des données et un GO/NO-GO documenté **avant toute bascule**.
- Les comptes, tarifs, paiements, données et branches de production restent inchangés tant que la bascule n'a pas été explicitement autorisée.

Documentation officielle : [Cloudflare — Preview secrets](https://developers.cloudflare.com/workers/previews/configuration/#secrets), [Wrangler preview secret put](https://developers.cloudflare.com/workers/wrangler/commands/workers/#preview-secret-put), [Supabase — clés secrètes serveur](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).
