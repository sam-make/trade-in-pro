# Audit étendu de préproduction — 23 novembre 2026

**Projet :** Trade-In Pro · **Branche :** `migration-cloudflare` · **PR :** [#1](https://github.com/sam-make/trade-in-pro/pull/1) en brouillon.

**Décision : NO-GO pour la bascule publique.** Cette revue vise la couverture la plus large possible avec les accès disponibles ; elle ne certifie **pas** une absence de défauts ni un test de toutes les fonctions avec des utilisateurs réels. Aucun compte client, paiement, mot de passe, donnée métier, production Lovable ou branche `main` n'a été modifié.

## 1. Méthodes réellement exécutées

- Lecture du dépôt et des configurations GitHub Actions / Cloudflare ; contrôle de la PR et de son état.
- Requêtes PostgreSQL **SELECT** uniquement dans le projet source Lovable et la destination autonome `xuvaihwygkcwriqfnkbg` ; comparaison agrégée des nombres de lignes et empreintes de contenu sans afficher de ligne ni de secret individuel.
- Tests transactionnels **BEGIN READ ONLY / SET LOCAL ROLE / ROLLBACK** des politiques RLS sous `anon` et deux identités de boutique **simulées**. Il ne s'agit pas de véritables JWT HTTP.
- Test du déploiement via l'API Cloudflare : version déployée, types de bindings et absence de secret privilégié.
- Tests HTTP dans GitHub Actions et **véritable Chrome headless** pour les pages publiques et protections d'accès, en viewport PC et mobile. Aucun compte ni donnée de boutique utilisé.
- Lecture personnelle de captures d'écran publiques (accueil, connexion, inscription) après défilement réel de la landing page.

## 2. Tests PASSÉS et preuves

| Domaine | Test précis | Résultat |
| --- | --- | --- |
| CI | TypeScript, ESLint/Prettier, compilation client/serveur, Worker local, scan de secrets | **PASSÉ** — [CI #45140762351](https://github.com/sam-make/trade-in-pro/actions/runs/45140762351) |
| Tests métiers unitaires | Pricing, critères de reprise, états des réparations, factures/références, Auth, sécurité, suivi, analytics et autres tests existants | **99/99 PASSÉS** au contrôle antérieur [CI #45137378309](https://github.com/sam-make/trade-in-pro/actions/runs/45137378309) ; nombre et succès également enregistrés dans les CI ultérieures |
| Pages et UX réelles | 8 pages publiques sur PC et mobile Chrome, métadonnées Supabase, erreurs JS, overflow horizontal | **PASSÉ** — [Chrome #45140692267](https://github.com/sam-make/trade-in-pro/actions/runs/45140692267) |
| Navigation et formulaires | Lien mot de passe oublié, validation e-mail vide, `sitemap.xml` sans URLs privées | **PASSÉ** — même workflow Chrome |
| Accès hors session | Redirection vers connexion de `/tableau-de-bord`, `/clients`, `/reparations`, `/estimation`, `/admin`, sur PC et mobile | **PASSÉ** — même workflow Chrome ; ce contrôle ne remplace pas RLS |
| Animations et affichage | Sections de l'accueil révélées après défilement ; captures d'écran examinées sur PC et mobile | **PASSÉ** — [Chrome #45140692267](https://github.com/sam-make/trade-in-pro/actions/runs/45140692267), 32 contrôles Chrome réussis |
| Cloudflare | URL Preview indépendante, bonne URL Supabase et clé publiable, pas de clé privée dans le HTML | **PASSÉ** pour le périmètre public ; la clé **serveur** manque (voir blocages) |
| Source ↔ destination : schéma | 24 tables publiques, 24 RLS, 61 policies, 17 fonctions, 18 triggers, 49 index et 30 FK ; empreintes colonnes/fonctions/policies/triggers/index identiques | **PASSÉ**, requêtes source Lovable et Supabase autonome |
| Source ↔ destination : contenu | Empreintes identiques de **23 des 24 tables** publiques ; tables majeures (boutiques/clients/devis/réparations/factures) identiques | **PASSÉ avec une différence identifiée**, voir ci-dessous |
| Comptes Auth | 17 utilisateurs, 17 identités, 11 e-mails confirmés, aucun hachage absent ; signatures agrégées des hachages de mots de passe et liens d'identité identiques | **PASSÉ** pour la conservation des identifiants ; pas un test de connexion |
| Intégrité des données | Aucun profil/rôle/estimation/réparation/facture/défaut/ligne de réparation orphelin sur les relations contrôlées | **PASSÉ** |
| Références | Pas de référence REP ou FA vide/dupliquée ; contraintes uniques `(shop_id,reference)` et `(shop_id,number)` | **PASSÉ** pour les enregistrements présents et le schéma ; concurrence réelle non testée |
| Totaux | 14 réparations et 10 factures, sommes des lignes cohérentes avec les totaux, aucun total négatif/absent | **PASSÉ** |
| Cloisonnement | Visiteur `anon` voit 0 ligne sensible ; deux boutiques simulées voient chacune leur boutique et 0 ligne étrangère sur les tables testées | **PASSÉ en simulation SQL uniquement** |
| Storage | Compartiment `repair-photos` privé, 0 fichier actuellement | **PASSÉ** pour configuration et inventaire ; upload et téléchargement non testés |

## 3. Écart de données constaté

Source Lovable : **539 lignes** dans les 24 tables ; destination autonome : **540 lignes**. Les 23 autres tables ont un nombre de lignes et une empreinte de contenu identiques.

**Seule différence : `public.shop_usage_days` : 16 lignes Lovable / 17 lignes destination.** La destination contient une journée d'activité supplémentaire au **23/11/2026**. Hypothèse plausible : visite/connexion depuis la préproduction ; cette causalité n'a pas été prouvée. Ne pas supprimer, fusionner ou écraser cette ligne à l'aveugle.

Le rapprochement final est à refaire **après gel contrôlé des écritures source** au moment de la bascule.

## 4. Bloqueurs et limites NON VÉRIFIÉS

| Priorité | Élément | État / impact |
| --- | --- | --- |
| **P0** | `SUPABASE_SERVICE_ROLE_KEY` absente de la Preview | **ÉCHEC confirmé** par API Cloudflare ; création boutique, écritures d'estimation/réparation, invitations, suivi public réel et super-admin privilégié **non opérationnels ou non validés** sur la Preview |
| **P0** | Connexion Auth de bout en bout et conservation des sessions | Le log Supabase contient des succès HTTP Auth, mais **aucun essai complet avec identités contrôlées sous Chrome dans cette revue** ; les tests unitaires ne remplacent pas un login réel |
| **P0** | RLS sous deux JWT Supabase réels et tests d'écriture multi-boutiques | **NON VÉRIFIÉ** ; deux contextes SQL simulés ont réussi mais les HTTP/API réels restent à tester |
| **P0** | Création/enregistrement de devis, clients, réparations, photos, facture, e-mail de récupération, invitation, suivi via jeton valide et super-admin | **NON VÉRIFIÉ de bout en bout** ; impossible de les déclarer fonctionnels sans clé serveur et comptes de test isolés |
| **P0** | Synchronisation finale et retour arrière | **NON VÉRIFIÉ** ; 1 ligne de suivi d'activité divergente, données source toujours actives ; sauvegarde restaurable hors site/restore non démontrés |
| **P1** | Security Advisor | **4 catégories signalées** : tables RLS sans policies (dont tables internes), 10 fonctions SECURITY DEFINER exécutables par `anon`, 10 par `authenticated`, protection des mots de passe compromis désactivée. Audit de nécessité des RPC et tests réels indispensables avant changement de privilèges |
| **P1** | Observabilité Cloudflare | **Désactivée** sur la Preview lors du contrôle ; diagnostic d'erreurs serveur insuffisant |
| **P1** | Paiements, Stripe, webhooks, abonnement et tarifs | **NON TESTÉ en conditions réelles** conformément à la consigne de ne pas modifier les flux financiers ; copies des tables de paiement/souscriptions intactes au contrôle d'empreinte |
| **P1** | Navigateurs Safari/Firefox, véritable téléphone physique, accessibilité exhaustive, performance sous charge, concurrence REP/FA | **NON VÉRIFIÉ** ; Chrome desktop/mobile émulé seulement |
| **P1** | Domaines, emails Auth/SMTP, quotas Free et reprise après coupure | **NON VÉRIFIÉ** intégralement ; ne pas promettre des ressources gratuites illimitées |

## 5. Décision et chemin vers le GO

1. Configurer la clé secrète **uniquement dans la Preview** par canal protégé, sans jamais la transmettre par chat ou Git. Voir [la procédure sécurisée](ACTIVER_PREPROD_CLOUDFLARE.md). Ne pas désactiver RLS pour contourner ce verrou.
2. Exécuter sous de vraies identités de test autorisées, idéalement isolées des boutiques réelles, les scénarios Auth + 2 boutiques + devis + client + réparation + photos + statut + facture + suivi + super-admin. Vérifier les réponses HTTP, la base et les journaux, puis effacer les données de test **uniquement** avec une autorisation distincte.
3. Revoir les alertes `SECURITY DEFINER`, la configuration des e-mails, les secrets et la collecte de logs sans PII.
4. Mettre en place une sauvegarde restaurable et contrôler le rattrapage Lovable, la cohérence des 24 tables, les comptes Auth et les fichiers privés après gel des écritures.
5. Réaliser le contrôle GO/NO-GO final, puis seulement demander un feu vert **explicite** de bascule publique. Tant que les P0 subsistent, **NO-GO**.

## 6. Garde-fous respectés

- Branche `migration-cloudflare` exclusivement ; PR en brouillon, aucune fusion `main`.
- Lovable production et Supabase autonome **en lecture seule** pour cet audit ; aucun changement de mot de passe, paiement, suppression ni écriture sur comptes et tables réels.
- Ancienne base staging abandonnée jamais consultée.
- Aucun secret ni donnée personnelle publié dans cette documentation ou dans les traces de test.
- Aucun sous-agent Codex indépendant lancé : Chrome et GitHub Actions sont des vérifications exécutées, pas des agents Codex travaillant en continu.
- La tâche quotidienne de préparation reste inchangée.

