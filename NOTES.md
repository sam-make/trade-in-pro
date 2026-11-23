# NOTES — Trade-In Pro
Date : 2026-11-20
Branche de travail : `migration-cloudflare`; ne jamais écrire directement sur `main`.

## Architecture
GitHub pour le code, Cloudflare Workers pour TanStack Start SSR, Supabase pour les données et comptes. Lovable exclu de la cible. Production interdite sans accord.

## Réalisé pour la PR fondations
- Vérification d'accès GitHub : branche créée, fichier `TEST_ACCES.md` créé puis supprimé.
- `AGENTS.md` remplacé par cinq agents et des règles strictes.
- `.env`, `.env.development`, `.env.production` retirés du suivi de la branche ; `.gitignore` renforcé, `.env.example` sans valeurs ajouté.
- Connexion Google / bibliothèque `@lovable.dev/cloud-auth-js` supprimées ; connexion e-mail/mot de passe conservée.
- Vérifications GitHub Actions sur PR : installation, types, lint, tests, build, secrets.
- Architecture cible documentée.

## Sécurité des anciennes variables
Aucune variable `SUPABASE_SERVICE_ROLE_KEY` relevée dans les trois fichiers d'environnement examinés. Une variable de jeton client de paiement `VITE_PAYMENTS_CLIENT_TOKEN` y était renseignée ; ne pas afficher sa valeur. Des clés Supabase publiques y étaient renseignées. Ces fichiers existent dans l'historique Git antérieur : les retirer de la dernière version ne purge pas l'historique. Vérifier le caractère secret des valeurs et décider d'une rotation si nécessaire, sans action irréversible automatique.

## Blocages et vérifications
- Les dépendances restantes `@lovable.dev/vite-tanstack-config` et `@lovable.dev/ai-gateway`, et le verrou `bun.lock`, ne sont pas modifiés dans cette mission ; la suppression complète de Lovable reste à faire.
- Le code de paiement et les fonctions SQL du propriétaire restent intacts.
- **Installation, tests, types, lint et build NON EXÉCUTÉS** : l'environnement local ne possède pas Bun (commande introuvable) et n'a pas d'accès réseau pour cloner le dépôt. Tentative `git ls-remote https://github.com/sam-make/quick-iphone-quote.git HEAD` : `fatal: unable to access ... Could not resolve host: github.com`. Aucune erreur de compilation n'est donc démontrée ; résultat inconnu. GitHub Actions devra effectuer ces vérifications à l'ouverture de la PR.
- Vérifier que GitHub Actions s'exécute avec succès avant fusion. **Configurer aussi la protection de la branche main (contrôles obligatoires)** ; la présence d'un workflow seule ne bloque pas automatiquement la fusion. Le scan de secrets peut signaler l'historique Git contenant les anciens `.env`.
- Aucun accès ni modification à la production ou à Supabase.

## Suites proposées (nécessitent accord pour nouvelles modifications)
1. Réparer la compilation Cloudflare Workers autonome sans bibliothèque Lovable.
2. Réviser le verrou Bun pour retirer les entrées devenues inutiles.
3. Valider sécurité RLS, estimations, numérotation REP/FA et mobile avec des tests automatisés.

## Mission suivante : sortie technique de Lovable (2026-11-20)
- `bun.lock` : 140 URL d'archives du cache privé remplacées par `registry.npmjs.org` ; références directes `@lovable.dev/*` supprimées du verrou. **Attention** : verrou ajusté par transformation du fichier existant, pas régénéré localement avec Bun ; la résolution de `@cloudflare/vite-plugin` et `wrangler` est faite dans GitHub Actions pendant `bun install`. Faire ultérieurement une régénération canonique, committer le résultat puis activer une installation figée.
- `package.json` : retrait de `@lovable.dev/vite-tanstack-config`, `@lovable.dev/ai-gateway`, Nitro ; ajout de `@cloudflare/vite-plugin` et `wrangler`. Aucune logique Stripe modifiée.
- `vite.config.ts` : configuration officielle Cloudflare Vite + TanStack Start + React + Tailwind CSS + alias TypeScript ; option d'entrée serveur `server` conservée pour `src/server.ts`. `wrangler.jsonc` définit un Worker serveur, sans déploiement automatique.
- `bunfig.toml` : garde de sécurité de publication 24 h préservée ; exceptions privées Lovable supprimées.
- `drizzle.config.ts` : `DATABASE_URL` à la place de `LOVABLE_DB_MIGRATION_URL`. Ne pas exécuter de migration sans autorisation.
- `src/lib/lovable-error-reporting.ts` supprimé : erreurs de racine journalisées par `console.error`. Code d'attribution TikTok basé sur `__lovableEvents` retiré de l'accueil ; mesure TikTok absente jusqu'à une solution indépendante.
- `src/integrations/supabase/previewAuthStorage.ts` supprimé : stockage standard Supabase dans le navigateur, sans relais Lovable. Les sessions éventuellement propres aux domaines d'aperçu ne se transfèrent pas automatiquement entre domaines.
- Code restant spécifiquement lié à Lovable dans les archives `.lovable/`, `README.md` et certains textes générés. Aucun de ces historiques n'est nécessaire à l'exécution mais la suppression complète doit être vérifiée.

### Fonctionnalités cachées de l'ancien Vite
1. **Devtools TanStack** (outils de diagnostic en développement) : pas réinstallés pour l'instant. Ce n'est pas nécessaire à la production ; vérifier le besoin et la compatibilité avant d'ajouter un paquet.
2. **Alias `@/` et chemins TypeScript** : repris par `vite-tsconfig-paths`.
3. **Cible Cloudflare** : reprise par `@cloudflare/vite-plugin`, remplaçant le déploiement Nitro. Attention : aucune compilation Worker réussie prouvée à ce stade.
4. **React/TanStack dedupe** : reprise par `resolve.dedupe`.
5. **Injection `VITE_*`** : effectuée par Vite en construction ; ne jamais y mettre `service_role`.
6. **Capture d'erreurs Lovable** : retirée à la demande, remplacée par les journaux locaux.
7. **Détection sandbox / host / strictPort** : spécifique à l'ancien environnement Lovable, non reconduite ; vérifier si une configuration spéciale de développement est souhaitée.

### GitHub Actions : résultats déjà observés
- Contrôle des secrets : PASSÉ sur les exécutions inspectées.
- Vérification des types : un ancien échec `src/routes/index.tsx(95,19)` et `(96,14)` provenait de `__lovableEvents` ; référence supprimée dans le nouveau commit.
- Lint : 1 839 problèmes (1 830 erreurs, 9 avertissements) sur un commit après suppression de `__lovableEvents`, très majoritairement erreurs de formatage `prettier/prettier` dans des fichiers existants. Le CI reste rouge. Ne pas masquer le problème en désactivant les règles.
- Workflow ajusté pour lancer les tests et le build même après un échec de lint, afin de découvrir d'autres blocages. Vérifier les résultats de la dernière exécution.
- Le conteneur local n'a ni Bun ni accès GitHub ; seuls les jobs GitHub Actions constituent une exécution technique à distance.

### Résultat vérifié après correction (run GitHub Actions 44705696149, commit 4280402)
- Installation Bun : **SUCCÈS**.
- Vérification TypeScript : **SUCCÈS**.
- Tests automatisés : **SUCCÈS** (étape GitHub Actions ; nombre de tests à confirmer si nécessaire).
- Build Vite / Cloudflare : **SUCCÈS** (compilation seulement, aucun déploiement ni test runtime de Worker).
- Scan de secrets : **SUCCÈS**.
- Lint : **ÉCHEC** (1 839 problèmes relevés dans un run antérieur ; le nombre exact du run 44705696149 doit être confirmé à ses journaux). La PR n'est **PAS verte**.
- Décision : ne pas désactiver les contrôles ni reformater massivement des fichiers hors du périmètre sans autorisation.
- `main` protégée d'après le propriétaire ; PR n°1 toujours en brouillon, non fusionnée.

## Session lint du 20 novembre 2026 — résultats vérifiés
- État initial (run 44705891478) : **1 839 problèmes**, dont 1 830 erreurs `prettier/prettier`, 8 avertissements `react-refresh/only-export-components`, 1 avertissement `react-hooks/exhaustive-deps`.
- Groupe 1 : `bunx eslint . --fix` a automatiquement corrigé **1 830 problèmes de formatage**. Modifications enregistrées sur `migration-cloudflare` par GitHub Actions (commit 183c2e5). Le job automatique temporaire a été supprimé du workflow ensuite.
- Groupe 2 : dépendances primitives du `useEffect` dans l'administration. Avertissement React Hooks corrigé sans ignorer la règle.
- Groupe 3 : suppression de quatre exports internes inutilisés par d'autres modules : `badgeVariants`, `useFormField`, `navigationMenuTriggerStyle`, `useSidebar`.
- Groupe 4 : extraction de `buttonVariants` et `toggleVariants` dans des fichiers autonomes, avec mise à jour des imports consommateurs.
- Groupe 5 : extraction de `ownerAnalyticsOptions` dans `src/lib/owner-analytics.options.ts` pour préserver la mise en cache des statistiques sans export non-composant.
- Groupe 6 : séparation de `AuthProvider`, `AuthContext` et du hook `useAuth` pour conserver le comportement de connexion et supprimer le dernier avertissement.
- Corrections secondaires de formatage des imports et de la fin des fichiers après extraction.
- **Total corrigé : 1 839 / 1 839 ; restant : 0 erreur et 0 avertissement.** Aucune règle désactivée et aucun commentaire d'ignorance ajouté.
- **Vérification GitHub Actions 44715156157 sur commit 117ae1d : SUCCESS** : installation, TypeScript, lint (aucune erreur ni avertissement), 10 fichiers de tests, build Vite/Cloudflare, scan de secrets.
- Aucune action sur `main`, la production, les paiements ou Supabase. Pull request 1 toujours non fusionnée. Le succès du build ne remplace pas un test fonctionnel en ligne.

## Reprise technique — 20 novembre 2026 (après correction du lint)

### Vérifications et correctifs effectués
- PR n°1 toujours en brouillon ; toutes les modifications sont sur `migration-cloudflare`. Production, paiement et SQL propriétaire non modifiés.
- Inspection **en lecture seule** du Worker `trade-in-pro-staging` : `SUPABASE_URL` correspond au projet Supabase de test ; les liaisons `SUPABASE_PUBLISHABLE_KEY` (publique) et `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement) existent. Aucune valeur de clé affichée ni modifiée. Aucune variable `VITE_*` enregistrée dans les liaisons du Worker.
- **Bug prioritaire évité** : le navigateur ne recevait pas automatiquement les variables publiques `SUPABASE_*` présentes sur le Worker. Ajout de `src/integrations/supabase/public-config.ts`, qui transmet uniquement URL + clé publique par les balises HTML `meta` générées au rendu serveur. Cela évite de dépendre d'une valeur `VITE_*` à la compilation. Test de priorité configuration serveur vs ancienne configuration compilée ; aucune clé `service_role` transmise.
- Nettoyage de messages Lovable restants dans le client serveur et le contrôle d'authentification. `.env.example` utilise `DATABASE_URL` (Drizzle).
- **Nouveau contrôle GitHub Actions sans déploiement** : `vite preview` lance le vrai Worker localement. Deux pages publiques répondent HTTP 200 et l'URL fictive de Supabase apparaît bien dans l'HTML. Le fichier `.dev.vars` fictif doit être créé **avant `vite build`**, car Cloudflare le copie au résultat utilisé par `vite preview`. Aucun compte réel ni base réelle n'est contacté.
- **Défaut critique du verrou découvert** dans les journaux : `InvalidLockfile: failed to parse lockfile`. L'installation l'ignorait et le recréait. Un job unique a généré un verrou canonique et l'a commité, puis a été retiré. Désormais l'installation utilise `bun install --frozen-lockfile --ignore-scripts` pour empêcher tout changement silencieux de versions.
- **Résultat vérifié** du workflow `44731426820` : installation figée, TypeScript, lint, 11 fichiers de tests, build, rendu Worker local et scan de secrets **tous réussis**. Aucun déploiement sur Cloudflare.
- `.gitignore` inclut désormais `.dev.vars*` pour exclure aussi les variantes nommées ; `README.md` ne dirige plus vers Lovable ; vérification de l'absence de variable serveur `SUPABASE_SERVICE_ROLE_KEY` dans les bundles navigateur ajoutée au workflow.

### Cinq relectures avant validation
- Sécurité : **partiel** — scan de secrets et isolation du code client contrôlés ; isolation RLS entre deux boutiques et clé serveur réelle non testées.
- Qualité : **validé en CI** — installation figée, types, lint, compilation.
- Tests : **validé en CI sur tests existants** — 11 fichiers de tests et rendu serveur local ; tests de bout en bout avec vrais comptes non réalisés.
- Base de données : **aucune migration appliquée** ; export et restauration restent à organiser sur la base de test.
- Réparateur : **non vérifié en conditions réelles** — appareil mobile, parcours devis/client/réparation/facture à tester avec réparateurs.

### Priorités recommandées
1. Tester une connexion e-mail/mot de passe et les parcours boutique sur un déploiement de **staging** explicitement isolé, jamais en production. Confirmer avant de déployer.
2. Vérifier l'isolation multi-boutiques/RLS et les références de factures et réparations en situation réelle.
3. Préparer un export manuel contrôlé de la base de test avant d'ajouter des données de réparateurs.
4. Ne pas créer d'agents IA autonomes pour l'instant : les cinq rôles d'`AGENTS.md` sont des contrôles de relecture, pas des services payants.

## Audit des sauvegardes et de l'authentification — 20/11/2026
- Source : **le vrai Trade-In Pro** publié via Lovable, backend Supabase géré par Lovable Cloud, référence retrouvée dans les variables du projet `omjonrbowazuicnbpuux` ; l'accès direct via le compte Supabase connecté est refusé.
- L'export métier remis par le propriétaire (`trade-in-pro-public-export.sql`, 200580 octets, SHA-256 `6cf56b97f71620050cc76a94adc6fb454c42496839387f00c674783933d1d4be`) possède 24 sections de données et **24/24 comptes de lignes identiques** à la source Lovable lors du contrôle. Aucun fichier privé commité.
- `auth.users` : 17 comptes dont 17 avec hachage ; `auth.identities` : 17 identités toutes `email`. Les 11 profils correspondent aux utilisateurs Auth. **L'authentification n'a pas été exportée ni transférée**.
- `repair-photos` : 0 fichier ; `repair_photos` : 0 ligne au contrôle. Inventaire à revalider à la bascule.
- Aucun changement Supabase, Cloudflare ou production. Aucune fusion. Le projet Supabase de production destinataire reste à choisir/créer avec accord sur l'organisation et le coût éventuel.
- [Plan et audit en lecture seule](docs/MIGRATION_PRODUCTION.md). Ne pas utiliser la base staging ni écraser le projet Supabase préexistant. La PR 1 reste en brouillon.

## Restauration Supabase production — 20/11/2026
- Nouveau projet **`trade-in-pro-production`** : `xuvaihwygkcwriqfnkbg`, région Paris, `ACTIVE_HEALTHY`.
- Source Lovable inchangée. Les **17** utilisateurs Auth et **17** identités email ont été transférés avec UUID et hachages identiques, sans exporter de secrets vers GitHub. Les **24** tables publiques / **538** lignes de l'instantané source ont été restaurées et comparées par empreinte des données : **24/24 identiques**.
- **61 politiques RLS**, **24 tables RLS**, **18 déclencheurs** et **4 politiques Storage** pour le compartiment privé `repair-photos` recréés. Aucun fichier photo actif dans la source au contrôle.
- Tests SQL de cloisonnement : rôle anonyme 0 ligne visible ; compte boutique isolé ; propriétaire super-admin reconnu, autre membre non propriétaire ; 0 référence orpheline Auth/profils/rôles.
- Audit Supabase : fonctions `SECURITY DEFINER` exposées et protection anti-mot-de-passe-compromis à examiner avant publication.
- Configuration Wrangler du Worker modifiée **sur la branche PR uniquement** de `trade-in-pro-staging` à `trade-in-pro`. Aucune publication du Worker de production ni connexion Cloudflare à la nouvelle base à ce stade.
- Blocage de lancement : **vérification réelle de connexion depuis le navigateur, configuration des secrets Worker, et synchronisation finale après gel des écritures Lovable**.
- Aucun SQL métier privé ni données Auth publiés dans le dépôt. La PR reste en brouillon.

### Sécurisation préalable au lancement (20/11/2026)
- Source/destination : 24/24 empreintes de lignes métier identiques, 538 enregistrements ; 17 comptes Auth hachés identiques ; identités Auth complètes identiques ; 0 profil/role orphelin.
- RLS : utilisateur anonyme 0 ligne, compte boutique limité à sa boutique, statut propriétaire attendu. 4 politiques Storage et bucket privé `repair-photos` reproduits ; 17 fonctions et 18 triggers identiques.
- Révocation des droits `anon`/`authenticated` sur `seed_default_rules(uuid)` et `seed_default_services(uuid)` ; serveur `service_role` toujours autorisé.
- Auth source : 11 e-mails confirmés, 6 non confirmés ; 9 comptes avec jetons temporaires dans la source (non migrés), nouvelles confirmations nécessaires selon parcours.
- Workflow manuel de déploiement production préparé sur PR brouillon ; **aucun Worker production déployé, aucune configuration de clé serveur effectuée**, aucun DNS modifié.


## Agents Codex et orchestration — 20 novembre 2026
- Six sous-agents Codex projet créés avec rôles distincts : sécurité, données, authentification, qualité, expérience réparateur et déploiement.
- Configuration dans `.codex/config.toml` ; les modèles héritent du parent pour éviter d'imposer un modèle indisponible ; permissions et accès MCP hérités du parent.
- Nouveau contrôle GitHub Actions non déployant : `.github/workflows/agents-preflight.yml` et `scripts/check-agent-contract.py`.
- Tableau de dépendances et GO/NO-GO : `docs/AGENTS_PRODUCTION.md`. Les agents définis ne sont pas des processus déjà démarrés : ils s'activent en session Codex.
- État : PR n°1 en brouillon. Les 24 tables et 17 utilisateurs sont restaurés, mais connexion réelle, données finales et Worker Cloudflare public **non validés**.

## Lancement manuel du sprint agents — 20/11/2026
- Le sprint de préparation `Automation_b5eb05ac5a8881918c0ecfaa10de05b9` a été déclenché manuellement par `run_now`; l'exécution a été effectuée **dans le chat courant** (retour `inline_run`), et non par six processus Codex permanents. Les séances horaires déjà planifiées restent séparées.
- Configuration des six rôles Codex lue et validée dans `.codex/agents`. Aucun sous-agent Codex autonome n'a été lancé par cette interface : elle ne dispose pas du mécanisme de délégation Codex.
- CI du commit `e0310d4aaf2ea2f866c58ac2400c8362cea64082` : `Agents Codex - contrôle de préparation` et `Vérifications de la pull request` **SUCCÈS** (runs 44752285588 et 44752285573).
- Audit live **lecture seule** : 24/24 tables métier et 538/538 lignes, empreintes identiques ; `auth.identities` identique (17 comptes). `auth.users` même nombre 17 avec jetons temporaires différents ; ne pas réimporter.
- Supabase sécurité : 1 INFO (`rls_enabled_no_policy`), 3 WARN (deux catégories `SECURITY DEFINER` exposées et protection contre les mots de passe compromis désactivée). Risques consignés dans issue #3 ; dérive données issue #4.
- Cloudflare non déployé, PR #1 non fusionnée. P0 encore ouverts : vraie reconnexion des utilisateurs, test métier navigateur, examen des privilèges, delta Lovable final et GO/NO-GO.

## Sprint programmé 16 h 30 — audit sécurité RPC, 20/11/2026
- Audit direct de `pg_proc` et `has_function_privilege` sur Supabase cible : 12 fonctions `SECURITY DEFINER` dans `public` ; 10 exécutables par `anon` et `authenticated`, 2 seed restreintes.
- Code SQL de `owner_analytics`, `super_admin_mutate`, `next_shop_reference`, `record_shop_presence`, `has_role`, `current_shop_id` et `business_access_allowed` lu en lecture seule. Risque P1 d'énumération potentielle via `has_role(_user_id, _role)` à tester, sans conclusion d'exploitabilité.
- Supabase Security Advisor inchangé : 1 INFO et 3 WARN. Inventaire, remédiations prudentes et GO/NO-GO consignés dans `docs/AGENTS_PRODUCTION.md` et issue #4.
- Les deux GitHub Actions du commit `972d11e3` ont réussi. Nouvelle CI attendue après ce commit de documentation.
- Aucun changement SQL ni production, aucun compte client touché. Auth réelle, RLS multi-boutiques sous JWT et parcours navigateur restent NON VÉRIFIÉS. Sous-agents Codex non exécutables directement par cette session ; audits réalisés avec les connecteurs.

## Relance à la demande — 20/11/2026, vers 17 h (Europe/Amsterdam)
- Automatisation du sprint vérifiée **activée** : exécution de 16 h 30 terminée, prochaine séance prévue à 17 h 30 ; déclenchement immédiat `run_now` accepté avec retour `inline_run` (travail dans la conversation, pas six processus indépendants).
- Lecture effective sur `migration-cloudflare` de `AGENTS.md`, `NOTES.md`, `docs/AGENTS_PRODUCTION.md`, `.codex/config.toml`, des six fichiers `.codex/agents/*.toml`, de la PR #1 et des tickets #2 à #7.
- Vérification factuelle : `.codex/config.toml` autorise jusqu'à six threads **par session Codex** ; cette conversation n'a pas de mécanisme de lancement de sous-agents Codex. Aucun thread autonome n'est donc confirmé en cours.
- Responsabilités conservées : `security_auditor` (#3), `data_migration` (#4), `auth_specialist` (#2), `qa_engineer` (#5), `repairer_ux` (#7), `release_engineer` (#6).
- Décision : **NO-GO** inchangé. Auth réelle, tests RLS sous JWT, parcours mobile, synchronisation delta Lovable et préproduction indépendante restent à prouver. Aucun déploiement, SQL, paiement, compte réel ni donnée client modifiés ; tâche quotidienne inchangée.

## Sprint 17 h 30 — contrôle UX et branche Cloudflare (20/11/2026)
- Relecture effective des instructions `AGENTS.md`, `NOTES.md`, `docs/AGENTS_PRODUCTION.md`, des six rôles `.codex/agents/*.toml`, de la PR #1 et des issues #2 à #7. Les six domaines ont leurs tickets respectifs : sécurité #3, données #4, Auth #2, QA #5, UX #7, Cloudflare #6. Aucun sous-agent Codex autonome n'est disponible depuis cette exécution ; contrôles réalisés directement via GitHub.
- Vérification statique ciblée dans `src/routes/__root.tsx` : le document HTML était déclaré `lang="en"` et les erreurs globales 404/chargement étaient affichées en anglais alors que l'application est destinée aux réparateurs francophones.
- Correction sûre et limitée sur `migration-cloudflare` : `lang="fr"`, messages 404/erreur et actions de retour/reprise en français. Commit `6021d899d5912c457604ce8710c78b9adcf66998`. Aucun tarif, paiement, donnée, secret ni environnement de production modifié.
- Contrôle CI via l'API des workflows associés au commit : **aucun run `pull_request` encore retourné au moment du contrôle** ; succès de compilation du nouveau commit NON VÉRIFIÉ. Les sessions suivantes doivent recontrôler les workflows, ne pas annoncer PASSÉ prématurément.
- Auth réelle : NON VÉRIFIÉ ; sécurité RPC/RLS sous JWT : PARTIEL ; delta Lovable : NON VÉRIFIÉ ; parcours boutique et mobile réels : NON VÉRIFIÉ ; Worker Cloudflare indépendant : NON DÉPLOYÉ. Décision : **NO-GO**.

## Sprint 18 h 30 — revue CI et correction UX (20/11/2026)
- Relecture actuelle de `AGENTS.md`, `NOTES.md`, `docs/AGENTS_PRODUCTION.md`, des six fichiers `.codex/agents/*.toml`, de la PR #1 et des tickets #2 à #7. Responsables : Auth #2, sécurité #3, données #4, QA #5, Cloudflare #6, UX #7. Sous-agents Codex non exécutables depuis cette interface ; revue directe via GitHub.
- **CI vérifiée** pour le commit UX précédent `6021d899` : les workflows « Agents Codex - contrôle de préparation » (run `44774094405`) et « Vérifications de la pull request » (run `44774094467`) sont tous deux terminés en **SUCCESS**. Cette preuve porte sur ce commit, pas sur les commits ultérieurs.
- Défaut UX résiduel vérifié dans `src/routes/__root.tsx` : bouton de retour de la page d'erreur toujours libellé « Go home » malgré les autres traductions. Correction limitée en « Retour à l'accueil » sur `migration-cloudflare`, commit `cb7d499a3c46f309fc830102a8f03150c7d4c30a` ; CI de ce nouveau commit à contrôler.
- **NO-GO** : aucune connexion réelle historique, test RLS multi-boutiques sous JWT, parcours mobile de bout en bout, rattrapage des écritures Lovable ou préproduction Cloudflare autonome vérifiés dans cette séance. Aucune modification de `main`, production Lovable, Supabase, paiements, comptes ou secrets.

## Correctifs préproduction — 20/11/2026
- Audit ciblé des routes Auth : l'écran mot de passe oublié affichait l'envoi comme réussi même si Supabase renvoyait une erreur ou une défaillance réseau. Correction côté code et quatre nouveaux tests Vitest ; l'envoi réel de courrier et le vrai parcours de connexion historique demeurent **non validés**.
- Le workflow de déploiement Cloudflare envoyait auparavant le code d'abord et trois secrets ensuite via des commandes `wrangler secret put` distinctes. Cela ouvrait une fenêtre où le Worker pouvait fonctionner sans ses bindings. Le workflow est changé pour **une publication unique** `wrangler deploy --secrets-file`, documentée par Cloudflare, à partir d'un JSON temporaire créé en permissions restreintes sur le runner et détruit à la fin ; aucun secret commité ou affiché.
- Le fichier `wrangler.jsonc` exige désormais les trois bindings nécessaires. Le contrôle automatique des agents empêche la réintroduction du workflow dangereux. Le CI vérifie compilation, tests et garde de secrets. Aucun déploiement n'a été lancé.
- Restent P0 : tests Auth réels, configuration des courriels Supabase, Security Advisor, parcours métier mobile et rattrapage des données entre Lovable et la copie autonome.

## Sprint 19 h 30 — CI et correctif de récupération Auth (20/11/2026)
- Relecture de `AGENTS.md`, `NOTES.md`, `docs/AGENTS_PRODUCTION.md`, six TOML Codex, PR #1 et issues #2 à #7. Six responsabilités confirmées : Auth #2, sécurité #3, données #4, QA #5, Cloudflare #6, UX #7. Aucun sous-agent Codex indépendant disponible dans ce runtime ; contrôles directs via GitHub.
- **ÉCHEC CI vérifié** au SHA `a6af429e0711c35340c5956026836e0f114701c5` : workflow PR [44793494170](https://github.com/sam-make/trade-in-pro/actions/runs/44793494170), job `Installation, types, lint, tests et build` : **1 erreur Prettier**, `src/lib/password-recovery.ts:3:3`. Le job scan secrets est passé. Le workflow agents [44793494124](https://github.com/sam-make/trade-in-pro/actions/runs/44793494124) a réussi. Les autres étapes du job PR ont continué ; ne pas interpréter ce run comme vert.
- **Correction ciblée effectuée** : format du type union `PasswordRecoveryResult` aligné sur Prettier, sans changer la logique métier ni les réponses Supabase. Commit [2e7d4eaf](https://github.com/sam-make/trade-in-pro/commit/2e7d4eaf38333a441c9b0eb2a9f8ab193deaa277) sur `migration-cloudflare`. Le nouveau run CI n'était pas encore retourné au premier contrôle : **NON VÉRIFIÉ** pour ce commit.
- GO/NO-GO : **NO-GO**. Connexion historique et e-mails Auth réels, RLS sous JWT multi-boutiques, delta Lovable final, tests navigateur/mobile, Worker Cloudflare indépendant restent non vérifiés. Aucune modification de `main`, des comptes, du projet Lovable, de Supabase, des paiements ou du domaine public. La base staging interdite n'a pas été utilisée.

## Sprint 20 h 30 — vérification CI et revue des six domaines (20/11/2026)
- Relus sur la branche `migration-cloudflare` : `AGENTS.md`, `NOTES.md`, `docs/AGENTS_PRODUCTION.md`, `.codex/config.toml`, six `.codex/agents/*.toml`, PR #1 et tickets #2 à #7. Les six rôles sont configurés, mais aucun sous-agent Codex indépendant n'est exécutable depuis ce runtime ; contrôles réalisés directement par connecteur GitHub.
- **Vérification nouvelle et vérifiable :** les deux workflows attachés au correctif de formatage Auth `2e7d4eaf38333a441c9b0eb2a9f8ab193deaa277` sont terminés avec conclusion **success** : [contrôle agents 44793631516](https://github.com/sam-make/trade-in-pro/actions/runs/44793631516) et [vérifications PR 44793631442](https://github.com/sam-make/trade-in-pro/actions/runs/44793631442). Cela lève le doute CI sur **ce commit uniquement**, sans prouver la validité des commits plus récents.
- **Sécurité #3 : PARTIEL** — RLS sous JWT réels, fonctions `SECURITY DEFINER` et Security Advisor non clos ; aucun GRANT/REVOKE appliqué.
- **Données #4 : PARTIEL** — dernière preuve enregistrée de 24/24 tables et 538/538 lignes identiques, mais pas de gel ni de rattrapage final Lovable. Aucun accès à la base staging interdite.
- **Auth #2 : PARTIEL** — pages SSR et endpoint Auth joignables selon ticket ; connexion historique, réinitialisation et rôle boutique après login non prouvés.
- **QA #5 : PARTIEL** — CI du correctif `2e7d4eaf` verte ; tests navigateur authentifiés, numérotation concurrente et parcours métier complets manquants.
- **UX #7 : NON VÉRIFIÉ en boutique** — traductions statiques corrigées, temps d'estimation mobile non mesuré.
- **Cloudflare #6 : PARTIEL** — Preview Workers indépendante documentée dans le ticket #6 ; secret serveur requis absent, tests complets et rollback non prouvés. Aucun déploiement de production.
- **Décision : NO-GO** pour la bascule. Pas de changement de `main`, du code Lovable en production, des comptes, tarifs, paiements, secrets, données ou domaine public. Tâche quotidienne existante inchangée.

## Bilan final du sprint — 20/11/2026, 21 h 25 (Europe/Amsterdam)
- **Nouvelle preuve CI contrôlée :** commit documentaire `f572126a78556855594313ea5716b0fff1adb1f5` : [workflow agents 44802566588](https://github.com/sam-make/trade-in-pro/actions/runs/44802566588) et [workflow PR 44802566317](https://github.com/sam-make/trade-in-pro/actions/runs/44802566317), tous deux `completed/success`. La réussite de ces contrôles ne valide pas les connexions réelles ni les parcours métier authentifiés.
- Six contrats `.codex/agents/*.toml`, `AGENTS.md`, `docs/AGENTS_PRODUCTION.md`, `NOTES.md`, PR #1 et tickets #2–#7 relus. Aucun sous-agent Codex indépendant n'a été démarré : seule une session Codex dédiée peut les exécuter. Les audits de ce sprint ont été réalisés directement via les connecteurs.
- **Sécurité #3 : PARTIEL / NO-GO** : Security Advisor et droits `SECURITY DEFINER` non clos, tests inter-boutiques sous JWT non démontrés ; pas de changement SQL.
- **Données #4 : PARTIEL / NO-GO** : comparaison antérieure de 24/24 tables et 538 lignes concordantes, mais contrôle de dérive final et gel des écritures Lovable encore requis. Aucun import ni accès à la base staging interdite.
- **Auth #2 : PARTIEL / NO-GO** : pages Auth SSR en aperçu et correctifs de récupération documentés, mais connexion réelle historique, courriels et profil boutique non validés.
- **QA #5 : PARTIEL / NO-GO** : CI du commit ci-dessus réussie ; tests complets devis, clients, réparations, factures, références concurrentes et navigateur authentifié non démontrés.
- **UX #7 : PARTIEL / NO-GO** : traductions corrigées, mais test mobile et mesure d'estimation < 2 minutes non effectués.
- **Cloudflare #6 : PARTIEL / NO-GO** : aperçu Cloudflare indépendant publié selon ticket #6 ; `SUPABASE_SERVICE_ROLE_KEY` non configurée, fonctionnalités serveur non validées ; aucun déploiement du domaine de production.
- Vérification supplémentaire en lecture seule : `wrangler.jsonc` requiert explicitement les trois bindings Supabase ; le workflow `agents-preflight.yml` contrôle la branche de migration et les PR. Une requête HTTP depuis le conteneur a échoué sur la résolution DNS, donc aucun nouveau succès HTTP ne peut être affirmé depuis ce runtime.
- **Décision finale : NO-GO**. Avant toute bascule : Auth réelle avec identités contrôlées, tests RLS JWT, tests métier et mobile, secrets configurés par canal protégé, contrôle du delta final Lovable et plan de rollback testé ; ensuite seulement autorisation explicite du propriétaire. `main`, production Lovable, comptes, mots de passe, tarifs et paiements inchangés. La tâche quotidienne existante n'a pas été modifiée.

## Reprise manuelle après clôture — 20/11/2026, vers 22 h 40 (Europe/Amsterdam)
- Le sprint planifié jusqu'à 21 h 30 est clos ; cette reprise est un contrôle manuel, sans modification de sa planification ni de la tâche quotidienne.
- **Preuve nouvelle** : sur le commit final de bilan `87da0d263ce7d528b5a473fa0bcfc8424400afd2`, les workflows GitHub Actions `44811381341` et `44811381299` sont `completed/success`. Ces résultats concernent ce commit, et non un test d'authentification réelle.
- Relecture statique de `src/routes/connexion.tsx`, `src/routes/mot-de-passe-oublie.tsx`, `src/routes/reset-password.tsx` et `wrangler.jsonc` : la connexion utilise `signInWithPassword`, le lien de récupération utilise `resetPasswordForEmail`, la page de réinitialisation traite code PKCE, token_hash et fragment de session ; les trois bindings Supabase restent requis côté Worker.
- **Point QA P1 découvert, non corrigé** : dans `reset-password.tsx`, `establishSession()` ne capture pas les rejets inattendus des appels asynchrones Auth ; en cas d'exception réseau, l'interface peut rester sur « Vérification du lien… ». Préparer un correctif local avec `try/catch` et tests avant validation ; ne jamais tester avec un mot de passe réel.
- **NO-GO maintenu** : authentification historique, RLS sous JWT multi-boutiques, delta Lovable, parcours mobile et fonctionnalités Worker dépendant de la clé serveur toujours non validés. Aucun accès à la base staging interdite, aucune production modifiée.

## Vérification autonome du 21 novembre 2026 — aperçu et sécurité
- Contrôle GitHub Actions : `44822489125` (CI PR) et `44822488975` (agents) : succès au commit `d8d28f0c`. Le contrôle HTTP externe `44822475869` a échoué le 20/11 à 21:41 UTC sur l'absence de l'URL du nouveau Supabase dans le HTML. Le Preview Cloudflare indique un déploiement à 21:42:34 UTC : **course de propagation plausible, pas une preuve que la configuration finale est correcte**.
- Correction minimale sur `migration-cloudflare` : `scripts/smoke-cloudflare-preview.sh` retente pendant au plus 120 s le contrôle HTTP en lecture seule lorsque l'URL Supabase n'est pas encore présente. Le script recontrôle l'absence d'ancienne base et de marqueurs de secrets après attente. Aucun compte ni donnée métier touché.
- Supabase autonome `xuvaihwygkcwriqfnkbg` : **17 comptes, 17 identités, 24 tables publiques** constatés par SELECT lecture seule. Cela ne démontre ni le fonctionnement des mots de passe, ni la parité actuelle avec Lovable.
- Security Advisor du 21/11 : **3 tables RLS sans politique (INFO)**, **10 fonctions SECURITY DEFINER accessibles à anon (WARN)**, **10 accessibles à authenticated (WARN)** et **protection des mots de passe compromis désactivée (WARN)**. Aucune révocation automatique : dépendances et tests multi-boutiques requis.
- **GO/NO-GO : NO-GO maintenu**. Attendre la nouvelle CI sur le correctif, contrôler le rendu externe, tester Auth avec identités autorisées, RLS multi-boutiques, parcours métier et delta Lovable final. Ne pas confondre déploiement Preview et production publique.


## Vérification autonome — 22 novembre 2026 (lecture seule)
- Base cible `xuvaihwygkcwriqfnkbg` : **24 tables publiques, RLS activée sur 24/24** (requête de catalogue PostgreSQL en lecture seule). Cela ne prouve PAS l'étanchéité multi-boutiques : les tests JWT de deux boutiques restent P0.
- Cloudflare : Worker `trade-in-pro` lié au bon projet par `SUPABASE_URL`, clé publique présente, route publique désactivée et aperçus autorisés. **La clé serveur `SUPABASE_SERVICE_ROLE_KEY` est absente des bindings de ce Worker** : les RPC serveur nécessitant des privilèges restent non validées.
- Workers Builds : dépôt `sam-make/trade-in-pro` et branche d'aperçu `migration-cloudflare` liés. Aucun déploiement public effectué.
- [GitHub Actions 44918682188](https://github.com/sam-make/trade-in-pro/actions/runs/44918682188) : **ÉCHEC** du smoke HTTP après 120 s ; l'URL du nouveau Supabase n'apparaît pas dans le HTML SSR de `/`. Le délai de propagation seul ne suffit donc pas à expliquer ou résoudre le défaut. D'autres jobs du même commit ont réussi ; la validation de bout en bout reste **NO-GO**.
- Diagnostic à poursuivre sans données personnelles : contrôler les variables **runtime de l'aperçu exact** (distinctes des bindings du Worker de base), sa version active et le chemin d'injection HTML de `public-config.ts`. Ne pas publier de clé privée, ne pas ouvrir le Worker public, ne pas modifier Lovable.

### GO/NO-GO au 22/11
- **Qualité CI** : PARTIEL (jobs verts mais smoke HTTP rouge).
- **Authentification réelle** : NON VÉRIFIÉE.
- **RLS activée** : PASSÉ (24/24) ; **isolation entre boutiques** : NON VÉRIFIÉE.
- **Synchronisation finale Lovable → Supabase** : NON VÉRIFIÉE, aucun gel des écritures.
- **Parcours métier et mobile** : NON VÉRIFIÉS.
- **Production Cloudflare** : **NO-GO** ; PR #1 non fusionnée.

## Reprise manuelle du 22 novembre 2026 — correction Auth et contrôle Cloudflare
- **Correctif P1 Auth enregistré uniquement sur `migration-cloudflare`** : `src/routes/reset-password.tsx` capture maintenant les exceptions pendant l'échange de session de récupération et pendant `updateUser()`. En cas d'échec inattendu de vérification, l'interface affiche un message et un bouton « Réessayer » au lieu de charger indéfiniment ; le bouton de soumission est réactivé après échec. Commits [81dc22b9](https://github.com/sam-make/trade-in-pro/commit/81dc22b9e8a52dd4748b8e7c5768aaa5de31def5), puis [e617551d](https://github.com/sam-make/trade-in-pro/commit/e617551d3995b6f120b94c7b1a5f10efa042e66a) (mise en forme).
- **CI du correctif confirmée** : [contrôle des agents 45044096663](https://github.com/sam-make/trade-in-pro/actions/runs/45044096663) et [vérifications de la PR 45044096666](https://github.com/sam-make/trade-in-pro/actions/runs/45044096666), tous deux `completed/success` sur `e617551d`. Aucun test d'intégration Auth avec un vrai compte de test ni scénario navigateur de récupération n'a été exécuté ; cette partie demeure NON VÉRIFIÉE.
- **Contrôle Cloudflare en lecture seule** : le Worker de base `trade-in-pro` affiche les bindings publics `SUPABASE_URL` (URL du projet autonome `xuvaihwygkcwriqfnkbg` confirmée) et `SUPABASE_PUBLISHABLE_KEY`. La clé serveur `SUPABASE_SERVICE_ROLE_KEY` n'y figure pas ; la connexion des fonctions privilégiées reste bloquée. Un nom de script correspondant littéralement à l'URL Preview n'a pas été trouvé dans l'API Workers : cela ne permet **pas** de conclure que les bindings de la version Preview sont corrects. Ne jamais publier le secret dans Git ou le navigateur.
- **Blocage Cloudflare P0/P1 maintenu** : le dernier smoke HTTP consigné (run [44918682188](https://github.com/sam-make/trade-in-pro/actions/runs/44918682188)) était en échec ; les validations de configuration HTML du Preview n'ont pas été reproduites avec succès. Le code SSR `src/integrations/supabase/public-config.ts` lit `process.env.SUPABASE_URL` puis fournit la configuration au HTML ; vérifier explicitement l'injection des bindings dans la **version Preview** et le rendu SSR, sans modifier la production.
- **Prochain ordre** : (1) diagnostiquer le rendu SSR de l'aperçu et l'injection des variables publiques ; (2) valider un login et une récupération avec comptes de test autorisés ; (3) tester RLS avec deux JWT de boutiques distinctes ; (4) parcours devis/client/réparation/facture et mobile ; (5) vérifier delta final Lovable + plan de rollback, puis seulement GO/NO-GO et autorisation explicite.
- **Décision : NO-GO**. `main`, Lovable active, comptes utilisateurs, base staging interdite, paiements, secrets, déploiement public et tâche quotidienne inchangés.

## Intervention du 22/11/2026 — correction des bindings Preview Cloudflare
- Lecture GitHub PR #1 et tickets #2–#7, configuration Cloudflare, contrôles Supabase cible. Projet cible `xuvaihwygkcwriqfnkbg` `ACTIVE_HEALTHY`; 24 tables `public` avec RLS actif. La production Lovable et la branche `main` restent inchangées.
- Cause vérifiée du smoke Preview en échec : les bindings publics `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` étaient présents sur le Worker principal, mais **absents du déploiement Preview du 22/11 16:32 UTC**. Le déploiement Preview ancien du 20/11 contenait ces deux variables. Le problème ne se résumait donc pas à une propagation lente.
- Correctif immédiat, sur **la seule Preview Cloudflare** : rattachement par API des deux bindings publics récupérés du Worker `trade-in-pro`, après contrôle strict de l'URL cible. Aucune clé privée ni donnée client copiée. Le retour API et une seconde lecture de la dernière Preview confirment les deux noms de variables et la bonne URL.
- Validation HTTP : relance des jobs en échec du workflow GitHub Actions [44918682188](https://github.com/sam-make/trade-in-pro/actions/runs/44918682188) ; le job `HTTP SSR, nouvelle base et Auth` s'est terminé avec `success`. Le contrôle concerne quatre pages SSR, la présence de l'URL de la nouvelle base et la joignabilité Auth, **sans connexion d'utilisateur**.
- Prévention des futures régressions : ajout aux variables de **compilation des Previews**, dans Cloudflare Workers Builds uniquement, de `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`. La seconde valeur est masquée comme secret de build, bien que la clé de publication soit destinée au navigateur. Aucune valeur commise dans Git. Les commandes de build/déploiement Preview et la commande de production bloquée restent inchangées. Le code existant privilégie déjà le runtime puis utilise les valeurs `VITE_*` en repli ; **l'efficacité après un nouveau build reste à valider**.
- Reste P0 : `SUPABASE_SERVICE_ROLE_KEY` absent des bindings serveur ; il ne faut pas la fabriquer ni l'écrire dans Git. Tests réels de connexion et RLS multi-boutiques, sécurité des fonctions privilégiées, synchronisation finale après gel de Lovable et parcours métier authentifié non prouvés. **NO-GO** toujours en vigueur.

### Suite du 22/11/2026 — cause de la perte des bindings après chaque build
- Important correctif au compte rendu précédent : le premier succès HTTP après patch API **ne tenait pas après redéploiement automatique**. Le nouveau déploiement a perdu les deux bindings publics ; relance de [44918682188](https://github.com/sam-make/trade-in-pro/actions/runs/44918682188), nouvel échec `/: URL du nouveau Supabase absente ... après 120 s`. Le succès initial n'est donc pas une preuve de stabilité.
- Cause supplémentaire prouvée dans la configuration Cloudflare Workers Builds : la branche Preview `migration-cloudflare` possède ses **propres** `settings.deploy_command` et `settings.environment_variables`, qui priment sur `previews_base_config`. Modifier uniquement les paramètres de base n'avait pas modifié la commande réellement exécutée : les logs indiquaient encore `bunx wrangler preview`.
- Deux paramètres publics contrôlés avec la clé publishable active de `xuvaihwygkcwriqfnkbg` ont été placés comme **variables de build propres à la branche Preview** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, cette dernière masquée en configuration Cloudflare). Commande Preview de cette branche remplacée par `bash scripts/deploy-cloudflare-preview.sh` ; les paramètres production restent inchangés et bloqués.
- Nouveau script de déploiement dans `scripts/deploy-cloudflare-preview.sh` : vérifie la destination, prépare les variables publiques runtime sans les versionner, ajoute les `previews.vars` dans la configuration Wrangler **générée** `dist/server/wrangler.json` (le plugin Vite redirige Wrangler vers cette sortie), supprime le fichier temporaire en fin de commande. Aucun `service_role` ne peut être placé dans les variables publiques.
- Échec intermédiaire réel : build Cloudflare `f8683191-b54a-4602-bf59-13e5c1a7781d` a compilé mais a échoué au déploiement avec `The entry-point file at "@tanstack/react-start/server-entry" was not found`. Cause : passer `--config` empêchait la redirection automatique vers le fichier compilé. Correctif : utiliser `bunx wrangler preview` sans `--config`, après modification de la config compilée (commit `6eab8d3`).
- CI GitHub [45047666579](https://github.com/sam-make/trade-in-pro/actions/runs/45047666579) : réussite des types, lint, tests, build, scanner de secrets et vérification du fichier compilé. Ce test ne remplace pas le contrôle externe après un nouveau build Cloudflare.
- **Reste à valider** au moment de cet enregistrement : le dernier build Cloudflare sur le correctif `6eab8d3`, ses bindings runtime, le smoke HTTP externe et l'authentification. Aucun accès utilisateur réel, écriture client, fusion, bascule Lovable ou modification serveur SQL. **NO-GO** conservé.

## Vérification du 22 novembre 2026 — régression des bindings Preview et contrôle HTML

- Audit Cloudflare en lecture seule de l'aperçu `migration-cloudflare` : les deux déploiements successifs `cd201e7e-791c-4dee-9531-ce65b32af562` (17:13 UTC) et `f7f0be35-8fd9-4419-917b-1100e3da2944` (17:14 UTC) contiennent **les deux bindings publics** `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY`. Les versions précédentes de 17:04 et 17:08 les avaient perdus. La dernière URL correspond exactement à `https://xuvaihwygkcwriqfnkbg.supabase.co`. La clé publique de l'aperçu a été comparée sans affichage avec les clés actives du projet Supabase cible : **égalité exacte confirmée**.
- Build Cloudflare `037db5ad-4aa3-432b-b4bd-23070e282f33` sur le commit `e838f7b` : `success`, avec publication de l'aperçu. GitHub Actions `45048121736` (PR) et `45048121746` (contrat agents) : `completed/success` sur ce commit.
- Amélioration du smoke HTTP externe : outre le code HTTP 200, la bonne URL et l'absence de marqueurs de secrets, le script vérifie désormais les deux **balises meta SSR** `trade-in-supabase-url` et `trade-in-supabase-publishable-key` utilisées par le client navigateur. Aucun secret ni valeur de clé n'est imprimé. Ce contrôle ne constitue pas un test de connexion utilisateur.
- **Limite de preuve** : un appel HTTP direct depuis l'environnement de cette séance n'a pas abouti (résolution DNS indisponible). Le dernier smoke HTTP externe connu avait échoué avant les deux derniers déploiements ; il reste à valider avec GitHub Actions sur le nouvel état. L'API Cloudflare confirme les bindings et le build, **pas** le HTML retourné.
- Supabase cible : 17 utilisateurs, 17 identités, 24 tables publiques, RLS activée sur 24/24. Security Advisor : 3 tables RLS sans politique, 10 fonctions `SECURITY DEFINER` exécutables par `anon` et 10 par `authenticated`, protection contre les mots de passe compromis désactivée. Aucun changement SQL ni test sous deux JWT réels.
- **GO/NO-GO : NO-GO**. `SUPABASE_SERVICE_ROLE_KEY` reste absente du Worker principal, la connexion historique et l'isolement de bout en bout ne sont pas testés, et une comparaison finale après gel des écritures Lovable demeure obligatoire. `main`, comptes, données, paiements et production Lovable inchangés.

## Incident Auth — 22/11/2026 18:21 UTC (HTTP 500 lors de connexion réelle)
- Pour la première fois, tentative réelle de connexion sur la Preview Cloudflare avec compte historique ; requête `POST /auth/v1/token?grant_type=password` vers **le bon projet Supabase** `xuvaihwygkcwriqfnkbg`, HTTP 500 `unexpected_failure` ; Auth log : `error finding user: sql: Scan error on column index 3, name "confirmation_token": converting NULL to string is unsupported`. Cause identifiée : contenu de la restauration des comptes Auth, pas un mauvais mot de passe prouvé.
- SELECT sans exposer de données personnelles : **17/17 utilisateurs** ont `confirmation_token`, `recovery_token`, `email_change_token_new` à NULL ; `email_change`, `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token` : 0 NULL. 17/17 hachages de mots de passe non vides ; 11 comptes confirmés, 6 non confirmés. Aucun trigger utilisateur sur `auth.users`.
- Cause et correction recommandée confirmées dans la [documentation Supabase](https://supabase.com/docs/guides/troubleshooting/scan-error-on-column-confirmation_token-converting-null-to-string-is-unsupported-during-auth-login-a0c686) : remplacer les tokens NULL par `''` pour permettre leur lecture par GoTrue.
- Correction **préparée mais non appliquée** : `scripts/repair-auth-null-tokens.sql`, commit `4be417e`, transaction, préconditions 17 comptes/hachages présents, UPDATE uniquement des trois champs NULL, contrôle de sortie. Un test login après SQL restera nécessaire. Éviter d'ajouter des données privées ou l'ancien staging au projet.
- **Approbation propriétaire requise avant exécution** : il s'agit de modifier les 17 vrais enregistrements Auth de la cible. Préparer une sauvegarde protégée, appliquer le script sur le seul projet autonome cible, tester une identité autorisée, puis les rôles et parcours Auth. Aucun compte, secret, base, paiement, Lovable ou domaine de production changé pendant ce diagnostic. Issue #2 actualisée. **NO-GO maintenu**.

## Réparation Auth Supabase approuvée et exécutée — 22/11/2026
- Le propriétaire a autorisé explicitement la normalisation des trois colonnes NULL des 17 comptes de la **seule destination** `xuvaihwygkcwriqfnkbg`. Aucun secret, compte existant, hachage de mot de passe ou backend Lovable ne doit être exporté.
- **Contrôle préalable en lecture seule** : 17 utilisateurs Auth, 17 identités, 17 triplets NULL, 0 hachage absent ; aucun déclencheur utilisateur sur `auth.users`.
- **Sauvegarde privée avant correction** : migration `private_auth_token_backup_before_null_fix_20261122` appliquée avec succès. Table `tradein_private_auth_backup.token_snapshot_20261122` : 17 enregistrements avec les *trois anciennes valeurs de jetons*, une empreinte de contrôle du hachage (pas le hachage lui-même) et le statut de confirmation ; 0 divergence avec l'original. Schéma et table sans accès à `anon`, `authenticated` ou `service_role` ; RLS activée sans policy. Sauvegarde de retour arrière interne à cette base, **pas** un dump indépendant hors site.
- **Réparation SQL exécutée dans une transaction** : uniquement `auth.users.confirmation_token`, `auth.users.recovery_token`, `auth.users.email_change_token_new` ; remplacement des NULL par `''` ; préconditions sur les 17 utilisateurs, sauvegarde et empreintes ; vérification de sortie, rollback automatique si divergence.
- **Contrôle après COMMIT en lecture seule** : 17 utilisateurs, 17 identités, 11 profils, 11 rôles. Les 17 comptes ont les trois champs en chaîne vide ; 0 NULL restant ; 0 hachage absent ; 0 divergence de l'empreinte du mot de passe chiffré ni du statut d'e-mail confirmé par rapport à la sauvegarde ; 11 confirmés et six non confirmés inchangés. Sauvegarde persistée et accès public toujours refusé.
- Incident et résultat détaillés dans l'[issue #2](https://github.com/sam-make/trade-in-pro/issues/2). **Test de connexion HTTP avec le mot de passe réel toujours NON VÉRIFIÉ depuis la correction** : à réaliser par le propriétaire via Preview Cloudflare, sans communiquer son mot de passe. Le Worker public, `main`, Lovable, les paiements, les boutiques et les tables métier n'ont pas été touchés ; **NO-GO de bascule inchangé**.

## Correction post-connexion sans privilèges — 22/11/2026
- Preuve Supabase Auth en lecture seule après réparation de la restauration des comptes : le 22/11 à 18:27:39 UTC, `POST /auth/v1/token?grant_type=password` HTTP 200, `GET /auth/v1/user` HTTP 200, JWKS HTTP 200. Appels `business_access_allowed` HTTP 200 ; le résultat booléen ne ressort pas des journaux.
- Root cause suivante : le chemin `ensureWorkspace` utilisait systématiquement `supabaseAdmin`, alors que la Preview Cloudflare ne possède pas `SUPABASE_SERVICE_ROLE_KEY` (variable serveur privée indispensable au provisionnement et aux écritures privilégiées).
- Changements dans `migration-cloudflare` : `src/lib/workspace.functions.ts` utilise le client JWT / RLS issu du middleware pour lire **uniquement les espaces déjà provisionnés** quand le secret serveur est absent ; `src/lib/workspace.server.ts` accepte `allowProvisioning:false` et rejette tout compte sans boutique existante **avant toute écriture** ; trois nouveaux tests dans `src/lib/workspace.server.test.ts`.
- Contrôle RLS lecture seule de la cible : politiques `SELECT` sur `profiles`, `shops`, `user_roles` liées à `current_shop_id()` en `PERMISSIVE` et `business_access_gate` en `RESTRICTIVE`. Les requêtes de l'espace sont filtrées par les identifiants utilisateur/boutique. Profil, rôle boutique et rôle global du propriétaire présents, boutique non suspendue.
- GitHub Actions [CI #45055834178](https://github.com/sam-make/trade-in-pro/actions/runs/45055834178) **SUCCESS** (types, lint, tests, scan secrets, compilation, Worker local). Cloudflare build Preview `2ce5766f-091a-4aca-80d2-f0a205bbc1e2` **success** sur `61e3e91` ; déploiement `e85400cd-686e-42c3-a457-dcf4171e0d44` publié le 22/11 à 18:36:41 UTC avec `SUPABASE_URL` correcte et `SUPABASE_PUBLISHABLE_KEY` dans les bindings. Aucun `SUPABASE_SERVICE_ROLE_KEY` dans le déploiement, aucune exposition d'une clé privée.
- Smoke HTTP externe GitHub relancé après publication ; vérifier son verdict séparément. **Pas de test d'authentification navigateur réalisé sur cette version après la correction.**
- **Statut limité :** l'ouverture du dashboard des utilisateurs historiques dispose désormais d'un chemin sans clé admin ; les actions privilégiées (création d'une boutique, estimations sauvegardées, plusieurs écritures de réparation, invitations) nécessitent toujours la configuration sécurisée de `SUPABASE_SERVICE_ROLE_KEY` **uniquement dans les secrets runtime de Preview**. Ne jamais obtenir/exporter la clé via SQL ni l'insérer en VITE, logs, messages, code ou vars publiques. La production publique / Lovable / `main` restent inchangés. **GO/NO-GO production : NO-GO**.

## Suivi Auth propriétaire — 22/11/2026
- Revue post-login : les Server Functions créent un Supabase client avec `persistSession:false`. `requireOwner` appelait `auth.getUser()` sans token, ce qui peut renvoyer `AuthSessionMissingError` et masquer à tort l'espace Super Administration après un login réussi.
- Correctif isolé en branche `migration-cloudflare` : le middleware `requireSupabaseAuth` transmet son JWT vérifié dans le **contexte serveur uniquement** (`accessToken`) ; `requireOwner(client, accessToken)` appelle `auth.getUser(accessToken)`. Tous les appels propriétaire dans `super-admin.functions.ts` et `owner-analytics.functions.ts` transmettent le token. Identité du propriétaire codée, confirmation e-mail et contrôle `is_super_admin` préservés ; aucun changement des permissions SQL ni client/browser.
- Test `super-admin.server.test.ts` ajouté pour vérifier l'appel `getUser(accessToken)` et l'exigence du rôle global. [CI GitHub 45056340810](https://github.com/sam-make/trade-in-pro/actions/runs/45056340810) **SUCCESS** : types, lint, tests, build, scan secrets, smoke local. Commit code `8cced98`, déploiement Preview en cours à la rédaction.
- La précédente révision `61e3e91` (lecture RLS d'espace existant sans clé admin) a été déployée avec succès (`e85400cd-686e-42c3-a457-dcf4171e0d44`) ; smoke HTTP externe GitHub relancé avec résultat **success** ; pas de test de session réelle sur cette version.
- **Limites de preuve :** le jeton d'un compte réel doit encore être testé côté navigateur après ce second patch. `SUPABASE_SERVICE_ROLE_KEY` demeure absente de la Preview ; les opérations privilégiées restent impossibles. Pas de clé fabriquée, extraite ou divulguée. Aucune modification de la production publique ou de Lovable. **NO-GO production**.

## Séance opérationnelle du 23/11/2026 — stabilité Auth, devis et verrou Cloudflare
- **Périmètre** : `migration-cloudflare`, PR #1 toujours en brouillon. Aucun déploiement public, aucune fusion vers `main`, aucune modification Lovable ou donnée réelle. Aucun sous-agent Codex indépendant lancé depuis le connecteur ; contrôles réalisés directement.
- **Diagnostic de la panne métier** : l'API Cloudflare de la Preview `migration-cloudflare` retourne seulement les bindings `SUPABASE_URL` (vers le projet autonome `xuvaihwygkcwriqfnkbg`) et `SUPABASE_PUBLISHABLE_KEY`, mais **pas** `SUPABASE_SERVICE_ROLE_KEY`. Lecture seule des politiques PostgreSQL : `estimations`, `estimation_defects` et `repair_items` ont des politiques restrictives/SELECT sans politique permissive d'INSERT pour `authenticated`. Les écritures métier basées sur `supabaseAdmin` ne peuvent pas fonctionner avec cette Preview non configurée. **Ne pas désactiver RLS ni élargir les GRANT pour contourner ce blocage.**
- **Fix sécurité des devis** : `src/lib/workspace.server.ts` refuse une estimation si la lecture des tarifs ou critères échoue, ou si un critère sélectionné est manquant/inactif/dupliqué ; les valeurs absentes ne sont plus silencieusement supprimées avant écriture privilégiée. Commits [0407000](https://github.com/sam-make/trade-in-pro/commit/0407000575960360a445cce12616bc9365f88908) et [26339ee](https://github.com/sam-make/trade-in-pro/commit/26339ee5199a3a202a06a5e474a9ea5b44f3cb75), six tests ciblés. [GitHub Actions 45136912333](https://github.com/sam-make/trade-in-pro/actions/runs/45136912333) **success**, 94/94 tests, types, lint, build et garde de secrets.
- **Fix stabilité de connexion** : `src/hooks/useAuth.tsx` et `src/hooks/session-bootstrap.ts` empêchent une réponse `getSession()` tardive d'écraser une session plus récente ; erreurs au chargement initial capturées pour ne pas bloquer indéfiniment l'interface. Cinq tests de régression dans `session-bootstrap.test.ts` ; dernier correctif de formatage [74a2399](https://github.com/sam-make/trade-in-pro/commit/74a23997bfe50af4bd03661ebf51b578bb76f143). [GitHub Actions 45137378309](https://github.com/sam-make/trade-in-pro/actions/runs/45137378309) **success** : 99/99 tests, types, lint, build et smoke local.
- **Préparation sécurisée de la clé serveur** : [guide](https://github.com/sam-make/trade-in-pro/blob/migration-cloudflare/docs/ACTIVER_PREPROD_CLOUDFLARE.md), `scripts/configurer-secret-preview.sh`, et CI qui en vérifie la syntaxe/la cible sans l'exécuter. La commande officielle `wrangler preview secret put` cible seulement `migration-cloudflare`, jamais le Worker public. Le connecteur Supabase accessible ne délivre pas de clé privée : **aucune valeur secrète copiée, inventée ou transmise**. [GitHub Actions 45137852357](https://github.com/sam-make/trade-in-pro/actions/runs/45137852357) **success**, 99/99 tests et scan secrets.
- **Contrôles Supabase en lecture seule** : projet `ACTIVE_HEALTHY` ; 17 comptes Auth et 17 identités, 14 boutiques, 11 profils, 9 estimations, 14 réparations, 10 factures, 24 tables `public` avec RLS. Comparaison finale avec Lovable et tests HTTP en vraie session utilisateur encore non réalisés. Security Advisor : 4 INFO RLS sans policy (dont la sauvegarde interne), 10 WARN fonctions `SECURITY DEFINER` exécutables par `anon`, 10 pour `authenticated`, 1 WARN protection contre les mots de passe compromis ; aucun GRANT/REVOKE.
- **État de publication constaté** : Cloudflare Preview tag `79ff24d` à 08:21 UTC le 23/11, avec deux bindings publics corrects, sans clé serveur privée. Les commits plus récents doivent encore être vérifiés comme déployés, même si la CI locale est verte.
- **GO/NO-GO : NO-GO** pour la production. Action dépendante d'une clé privée : la fournir une seule fois par un canal sécurisé directement à **Cloudflare Preview** selon le guide, sans passer par le chat. Ensuite valider de vrais parcours Auth et boutique sur comptes contrôlés, RLS avec deux JWT, écrire des données de test *uniquement dans un périmètre autorisé*, contrôler le delta Lovable et le rollback ; obtenir un feu vert explicite avant bascule. La tâche quotidienne existante reste inchangée.

## Audit approfondi autonome — 23 novembre 2026

Détails, portée réelle et preuves : [docs/AUDIT_PREPROD_2026-11-23.md](docs/AUDIT_PREPROD_2026-11-23.md). **Décision : NO-GO** (bloqueurs d'exploitation métier).

- **Vérification croisée réelle en lecture seule source Lovable ↔ Supabase cible** : 24 tables, **23 empreintes de contenu strictement identiques** ; `shop_usage_days` : source 16 / cible 17, avec une ligne d'activité supplémentaire datée du 23/11 sur la cible. Aucun effacement, ajout, migration ou tentative de « correction » de données. Source toujours active.
- **Comptes et structure** : 17 utilisateurs et 17 identités, 11 e-mails confirmés et 0 hachage absent de chaque côté ; signatures agrégées des mots de passe hachés et des rattachements d'identités égales. Schéma conforme : 24 tables, 24 RLS, 61 policies, 17 fonctions, 18 triggers, 49 index, 30 FK ; empreintes des colonnes/fonctions/policies/triggers/index identiques. Aucune donnée personnelle, identifiant ni hash individuel exporté.
- **Contrôles SQL supplémentaires** : 0 enregistrement orphelin détecté dans les relations métier contrôlées, 0 duplicat de références REP/FA, 0 incohérence du total sur 14 réparations et 10 factures. Bucket `repair-photos` privé et vide. `anon` voit 0 ligne sensible ; deux simulations `authenticated` distinctes voient chacune leur boutique et aucune donnée de la boutique étrangère sur les tables testées. **Ce ne sont pas des JWT HTTP réels.**
- **Vérification réellement exécutée dans Chrome** sur [GitHub Actions #45140692267](https://github.com/sam-make/trade-in-pro/actions/runs/45140692267) : **32 contrôles réussis** PC et mobile émulé, formulaires, liens, pages publiques, viewport, métadonnées, absence d'erreur JavaScript et redirection des 5 routes protégées hors session. Captures desktop/mobile de l'accueil, connexion et inscription téléchargées et visuellement examinées. Les sections `Reveal` apparaissent après défilement réel.
- **Qualité** : 99 tests Vitest, TypeScript, lint, build SSR et scan secrets verts ; [CI #45140762351](https://github.com/sam-make/trade-in-pro/actions/runs/45140762351). Nouveau test navigateur et procédure de captures ajoutés uniquement à `migration-cloudflare`. La documentation obsolète `docs/ARCHITECTURE.md` qui dirigeait vers l'ancienne staging a été remplacée par l'architecture réellement utilisée.
- **Blocage certain** : le secret serveur `SUPABASE_SERVICE_ROLE_KEY` est absent des bindings de la Preview Cloudflare, malgré les 2 bindings publics corrects. Fonctions de création boutique, enregistrement privilégié de devis et réparations, suivi public réel et super-admin dépendant de la clé : **non validées / bloquées**. Cloudflare Preview observabilité désactivée. Aucune clé copiée/exposée, aucun contournement RLS ou modification de production.
- **À vérifier impérativement avant GO** : vrai login, création/récupération, deux JWT multi-boutiques, toutes les écritures de test en périmètre isolé, factures, photos, super-admin, suivi, paiements en environnement test uniquement, e-mails, sécurité SECURITY DEFINER (10 WARN anon, 10 WARN authentifié), sauvegardes/restauration, comparaison finale Lovable et rollback. Ne jamais prétendre « tout fonctionne » sur cette seule base.
- **Périmètre inchangé** : `main`, Lovable en service, comptes, mots de passe, données métier, tarifs, paiements, domaine public, projet staging abandonné, abonnements et tâche quotidienne existante.


## Contrôle de suivi — 23/11/2026 (16 h 29, Europe/Amsterdam)
- GitHub PR #1 : tête `ff77c65522f800e5f3d33b00d823448166489d0f`, toujours ouverte et non fusionnée. CI [45141286968](https://github.com/sam-make/trade-in-pro/actions/runs/45141286968) **SUCCESS** : scan de secrets, installation, TypeScript, lint, tests, compilation, vérification des bindings et smoke Worker local. Test HTTP/Chrome [45141278223](https://github.com/sam-make/trade-in-pro/actions/runs/45141278223) **SUCCESS** : rendu public et parcours hors session seulement ; aucune connexion historique prouvée.
- Supabase cible `xuvaihwygkcwriqfnkbg` : état **ACTIVE_HEALTHY** ; SQL en lecture seule : **17** `auth.users`, **17** `auth.identities`, **24** tables publiques et **24** tables avec RLS activée. Aucun compte ni ligne métier modifié.
- Cloudflare Worker `trade-in-pro` : `SUPABASE_URL` pointe bien vers le projet cible ; `SUPABASE_PUBLISHABLE_KEY` présente, `SUPABASE_SERVICE_ROLE_KEY` absente des bindings de base. Route publique `workers.dev` **désactivée**, Preview **activée**, branche `migration-cloudflare` visible. L'inventaire du Worker de base ne prouve pas l'état des secrets de chaque Preview ; le dernier audit détaillé indique leur absence sur la Preview et la configuration réelle reste à valider sans exposer de clé.
- **GO/NO-GO : NO-GO inchangé**. Les 99 tests automatisés, les contrôles Chrome hors session et les simulations SQL ne remplacent pas les JWT réels, les écritures métier, la revue des fonctions privilégiées, le delta final Lovable, la restauration/rollback et le GO explicite. Pas de nouveau déploiement, modification de Lovable, coût ou changement SQL.


## Vérification ciblée — 23 novembre 2026, soirée
- Supabase cible `xuvaihwygkcwriqfnkbg` : projet `ACTIVE_HEALTHY` confirmé par API ; requête SQL en lecture seule : **24 tables publiques / 24 avec RLS activée**.
- Security Advisor consulté à nouveau : **10 fonctions `SECURITY DEFINER` exécutables par `anon`**, et avertissements correspondants pour `authenticated`. Une quatrième table sans politique a été signalée dans un schéma de sauvegarde privé (`tradein_private_auth_backup`), en plus des trois tables publiques déjà connues. Ce constat ne prouve pas une exposition de ce schéma via l'API ; vérifier les schémas exposés avant toute action.
- **Aucune correction SQL appliquée** : révoquer globalement `EXECUTE` sans examiner les appels depuis les politiques RLS, triggers et clients risquerait de casser l'application.
- **NO-GO inchangé** : login historique réel, isolation JWT de deux boutiques, parcours métier et synchronisation finale Lovable non vérifiés. Prochaine action : auditer les appels aux fonctions privilégiées, puis préparer des tests JWT contrôlés et un correctif minimal revu.
- Aucune donnée personnelle ni secret affiché, aucun déploiement ni modification Lovable.
