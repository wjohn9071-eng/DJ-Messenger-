import { AppState } from './types';

export const APP_UPDATES = [
  { 
    version: '3.2.0',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }), 
    desc: 'Amélioration de la connexion avec Google et optimisation des couleurs dans le profil (Mode sombre). Remplacement du système de stockage pour envoyer des fichiers lourds de façon sécurisée (Terminé Cloudinary).',
    adminDesc: 'Amélioration de la connexion Google (correction erreur auth/cancelled-popup-request) et fix visuel en mode sombre. Migration complète de Cloudinary vers Supabase Storage pour l\'envoi natif de tout type de fichier sans limite d\'extension bloquée.',
    manual: '### Guide d\'utilisation v3.2.0\n\n1. **Connexion Google** : Le problème de compte bloqué par popup a été corrigé.\n2. **Stockage Amélioré** : Le système de partage de gros fichiers est beaucoup plus robuste et tolérant.\n3. **Amélioration Visuelle** : L\'onglet Profil est parfaitement lisible en fond sombre.',
    adminManual: '### Guide d\'utilisation v3.2.0 (Admin)\n\n1. **Réseau & Base de Données** : Les fichiers passent désormais sur le bucket "medias" de Supabase pour contrer les limitations gratuites de 10 Mo de Cloudinary.\n2. **Google Connect** : Un système "isAuthenticating" empêche le clic multiple sur le bouton Google.'
  },
  {
    version: '3.1.4',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    desc: 'Correction du problème d\'échec de téléchargement pour les fichiers, assignation automatique du logo officiel DJ Messenger lors de la création d\'un groupe sans image, et finalisation de l\'adaptation au mode sombre sur l\'interface.',
    adminDesc: 'Correction du problème d\'échec de téléchargement pour les fichiers (gestion de la persistance des Blob URLs dans le navigateur), assignation de l\'image par défaut (DJ_LOGO) aux nouveaux groupes, et renforcement du mode sombre.',
    manual: `### Guide d'utilisation détaillé v3.1.4

1. **Téléchargement de fichiers réparé** :
   - Étape 1 : Cliquez sur le bouton de téléchargement de n'importe quel fichier envoyé dans le chat.
   - Étape 2 : Le fichier se télécharge désormais de manière fiable sans générer d'erreur "Echec du téléchargement" dans votre navigateur.

2. **Création de Groupe facilitée** :
   - Désormais, si vous créez un groupe et oubliez d'ajouter une image, l'image officielle par défaut de DJ Messenger sera automatiquement attribuée. Vous n'aurez plus une bulle vide au contour douteux !

3. **Adaptation système au mode sombre** :
   - Le système suit plus fidèlement les fonds adaptés du mode sombre pour les utilisateurs concernés.`,
    adminManual: `### Guide d'utilisation détaillé v3.1.4 (Admin)

1. **Bug Échec Téléchargement (Explication technique)** :
   - Initialement, l'API Cloudinary \`fl_attachment\` causait des erreurs HTTP 400 (Bad Request) sur les fichiers « raw » (comme ZIP, DOCX). De plus, l'utilisation de \`URL.createObjectURL(blob)\` empêchait le gestionnaire de téléchargement Android natif de lire le fichier en mémoire. La solution définitive a été d'utiliser l'API \`FileReader\` pour encoder le blob en Base64 (\`data: URL\`) avant de lancer le clic natif, assurant un téléchargement sécurisé et autonome, même sur PWA.

2. **Confidentialité des Mises à jour :**
   - Les notes de mise à jour ont été divisées en deux versions sécurisées :
   - Les informations concernant les administrateurs et outils de modération ont été catégorisées en « accès restreint ».
   - Les utilisateurs non gradés apercevront uniquement les nouveautés publiques (Thèmes, interface) dans leur bandeau d'accueil et dans l'onglet des notes de la communauté, tandis que les informations du Staff seront masquées. Si une note ne concerne que les administrateurs, elle n'apparaitra même pas pour les autres.`
  },
  {
    version: '3.1.3',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    desc: 'Réintégration de la liste de sélection des utilisateurs pour démarrer une discussion SMS, modernisation de l\'onglet Amis, et correction du bug des onglets masqués en mode sombre. Amélioration approfondie de la Regex Markdown pour éviter les conflits avec les numéros.',
    adminDesc: 'Réintégration de la liste de sélection des utilisateurs pour SMS, rafraîchissement visuel de l\'onglet Amis (suppression Création, retrait arobase), transparence ajustée en mode sombre pour les onglets, et SMS de nouveau visibles dans l\'onglet Récents.',
    manual: `### Guide d'utilisation détaillé v3.1.3

1. **Démarrer une discussion SMS avec N'IMPORTE QUI étape par étape** :
   - Étape 1 : Ouvrez le menu latéral (le bouton avec les 3 barres horizontales).
   - Étape 2 : Cliquez sur l'onglet **Discussions**.
   - Étape 3 : Dans l'en-tête de la page de discussions, cliquez sur le sous-onglet **SMS** (qui est désormais parfaitement visible même en mode sombre).
   - Étape 4 : Observez la partie située juste sous "Assistant virtuel". Vous y verrez une barre de recherche.
   - Étape 5 : Juste en dessous de cette barre, **SANS MÊME AVOIR BESOIN DE CHERCHER**, la liste complète de tous les utilisateurs inscrits sur l'application s'affiche.
   - Étape 6 : Chaque utilisateur est présenté avec sa photo et un tableau moderne. Ce tableau affiche sa "Dernière co." et son "Statut" (En ligne/Hors ligne).
   - Étape 7 : Pour lancer le SMS, cliquez simplement sur le bouton bleu avec l'icône de message à côté du compte.
   
2. **Consultation et ajout d'Amis modernisés** :
   - Étape 1 : Allez dans le menu principal et cliquez sur l'onglet **Amis**.
   - Étape 2 : Dans la section de recherche en haut, remarquez que **tous les utilisateurs s'affichent par défaut**, avec le nouveau style de tableau contenant leurs statuts.
   - Étape 3 : Descendez vers la section "Mes amis". 
   - Étape 4 : L'interface a été épurée : l'arobase "@" devant les noms a été retirée et la date de création de compte a été supprimée des statistiques de la carte pour l'alléger.
   
3. **Récupération des conversations SMS dans l'onglet Récents** :
   - Étape 1 : Ouvrez l'onglet **Discussions**.
   - Étape 2 : Cliquez sur l'onglet **Récents** (tout à droite).
   - Étape 3 : Constatez que vos discussions SMS privées apparaissent à nouveau aux côtés de vos groupes, listées par heure d'activité.
   - Étape 4 : Cliquez sur une carte SMS depuis cet espace Récents, le système vous emmènera directement dans le bon onglet conversationnel.
   
4. **Utilisation experte du formatage de texte sans bug de numéros** :
   - Étape 1 : Rendez-vous dans n'importe quel chat (Groupe ou SMS).
   - Étape 2 : Pour mettre un mot en *Gras*, tapez un seul astérisque : \`*Bonjour*\`.
   - Étape 3 : Pour l'Italique, utilisez deux astérisques : \`**Salut**\`.
   - Étape 4 : Pour le Souligné, le tiret bas : \`_Coucou_\`.
   - Étape 5 : Essayez d'écrire un numéro USSD téléphonique comme \`*155*1#\`. Le système possède désormais une lecture stricte qui n'altère pas vos chiffres.
   
5. **Mode Sombre et Lisibilité parfaite** :
   - Étape 1 : Dans les Paramètres, activez l'Apparence **Sombre**.
   - Étape 2 : Les titres comme "Vos discussions SMS" ou les boutons "PUBLICS/PRIVÉS" sont désormais mis en surbrillance réfléchie pour le contraste nocturne.`,
    adminManual: `### Guide d'utilisation détaillé v3.1.3 (Admin)

1. **Démarrer une discussion SMS (Privée) étape par étape** :
   - Étape 1 : Rendez-vous dans l'onglet **Discussions**, puis sélectionnez le sous-onglet **SMS**.
   - Étape 2 : En haut de l'écran, vous avez accès immédiatement à la liste de TOUS les utilisateurs existants.
   - Étape 3 : Leurs profils intègrent le fameux tableau des statistiques (Dernière co., statut) au format modernisé (sans la création pour une vue allégée).
   - Étape 4 : Cliquez sur le bouton bleu avec l'icône de message à côté du compte.
   
2. **Consultation de vos Amis** :
   - Étape 1 : Dans **Amis**, vous avez accès directement à la recherche globale des membres avec les badges Staff/Admin et statistiques détaillés.
   - Étape 2 : Vous retrouvez vos amis dans la partie inférieure, avec des fiches allégées (sans arobase @ ni tableau de création).
   
3. **Consulter l'historique global (Récents)** :
   - Étape 1 : En naviguant sur l'onglet **Récents**, le système compile vos SMS et Groupes.
   - Étape 2 : Le clic vers un SMS depuis la zone Récents est désormais 100% transparent et fonctionnel.
   
4. **Formatage strict du Markdown** :
   - La technologie d'analyse de message a été convertie en Regex universelle pour soutenir complètement les anciens navigateurs comme Safari iOS, interdisant aux codes USSD (*123#) de devenir du texte en gras ou de s'étaler sur tout le message.`
  },
  {
    version: '3.1.2',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    desc: 'Visibilité améliorée des textes en gras dans n\'importe quel thème et coloration automatique des liens envoyés dans les bulles.',
    adminDesc: 'Visibilité améliorée des textes en gras dans n\'importe quel thème et coloration automatique des liens envoyés dans les bulles.',
    manual: '### Guide d\'utilisation v3.1.2\n\n1. **Liens cliquables** : Les liens web sont maintenant automatiquement détectés et colorisés avec le Style DJ.\n2. **Formatage de texte** : Utilisez `*mot*` pour mettre en gras, `**mot**` pour mettre en italique, et `_mot_` pour souligner. Vous pouvez combiner ces symboles ! Par exemple : \n   - Gras + Italique : `***mot***`\n   - Gras + Souligné : `_*mot*_`\n   - Italique + Souligné : `_**mot**_`\n   - Les trois : `_***mot***_`\n3. **Thèmes globaux** : Dans vos Paramètres > Apparence, choisissez parmi Clair, Sombre, Azur, Lime et Dégradé.',
    adminManual: '### Guide d\'utilisation v3.1.2\n\n1. **Liens cliquables** : Les liens web sont maintenant automatiquement colorisés avec le Style DJ.\n2. **Formatage de texte** : Utilisez `*mot*` pour mettre en gras, `**mot**` pour mettre en italique, et `_mot_` pour souligner. Vous pouvez combiner ces symboles !\n3. **Thèmes globaux** : Dans vos Paramètres > Apparence, choisissez parmi Clair, Sombre, Azur, Lime et Dégradé.'
  },
  {
    version: '3.1.1',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    desc: 'Clarification des critères de formatage Markdown (Gras, Italique, Souligné) dans le manuel. Mise en place de la nouvelle règle de versionnage : incrémentation mineure x.x.1 puis passage automatique en x.x+1.0 (ex: 3.2.0) à la 10ème itération avec récapitulatif total.',
    manual: '### Guide d\'utilisation v3.1.1\n\n1. **Formatage de texte** : Utilisez `*mot*` pour mettre en gras, `**mot**` pour mettre en italique, et `_mot_` pour souligner. Vous pouvez combiner ces symboles ! Par exemple : \n   - Gras + Italique : `***mot***`\n   - Gras + Souligné : `_*mot*_`\n   - Italique + Souligné : `_**mot**_`\n   - Les trois : `_***mot***_`\n2. **Thèmes globaux** : Dans vos Paramètres > Apparence, choisissez parmi Clair, Sombre, Azur, Lime et Dégradé.\n3. **Lisibilité** : Les textes s\'adaptent automatiquement au fond coloré.'
  },
  { 
    version: '3.1.0',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }), 
    desc: 'Nouveau système de thèmes globaux, adaptation des textes sur les fonds personnalisés comme l\'Azur ou le Lime, et optimisation de l\'écran d\'accueil/mon compte.',
    adminDesc: 'Nouveau système de thèmes globaux, correction des droits administrateur (Super Admin) rendant l\'accès parfait, adaptation des textes sur les fonds personnalisés comme l\'Azur ou le Lime, et optimisation de l\'écran d\'accueil/mon compte.',
    manual: '### Guide d\'utilisation v3.1\n\n1. **Thèmes** : Dans vos Paramètres > Apparence, choisissez parmi 5 ambiances globales : Clair, Sombre, Azur, Lime et Dégradé.\n2. **Lisibilité** : Les écritures et les contours s\'adaptent automatiquement aux fonds colorés sur toute l\'application.',
    adminManual: '### Guide d\'utilisation v3.1\n\n1. **Thèmes** : Dans vos Paramètres > Apparence, choisissez parmi 5 ambiances globales : Clair, Sombre, Azur, Lime et Dégradé.\n2. **Super Admin** : Les Super Admins peuvent désormais changer les mots de passe et supprimer les utilisateurs avec leurs messages sans erreurs bloquantes.\n3. **Lisibilité** : Les écritures et les contours s\'adaptent automatiquement aux fonds colorés sur toute l\'application.'
  },
  { 
    version: '3.0.0',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }), 
    desc: 'Refonte totale du système de bulles de messages, ajout du Markdown (Gras, Italique, Souligné), sécurité renforcée des groupes privés (Codes complexes), indicateurs de frappe en direct, et refonte du Mode Sombre personnalisé.',
    manual: '### Guide d\'utilisation v3.0\n\n1. **Formatage** : Utilisez *texte* pour le gras, **texte** pour l\'italique et _texte_ pour le souligné.\n2. **Tutoriel** : Le tutoriel dispose maintenant d\'un bouton Quitter pour y revenir plus tard du menu latéral.\n3. **Présence** : L\'état "En ligne" de vos interlocuteurs s\'affiche de façon fiable dans vos SMS et vos profils d\'utilisateurs rapides.\n4. **Typing** : Des points de suspension s\'affichent de façon animée lorsque un utilisateur est en train d\'écrire un message.\n5. **Actions Rapides** : Les boutons pour télécharger, citer ou supprimer un message ont été repositionnés proprement après le message, sans gêner l\'avatar.'
  },
  { version: '2.9.9', date: '21/04/2026', desc: 'Mise à jour v3.0 (Beta) Stabilité & Ergonomie : Mode Sombre implémenté...' },
  { version: '2.9.9', date: '19/04/2026', desc: 'Optimisation Layout Mobile : Le menu latéral repousse désormais le contenu au lieu de l\'écraser, garantissant une lisibilité parfaite sur petit écran. Unification totale de l\'interface entre mobile et PC, avec suppression des effets de flou pour une meilleure clarté visuelle.' },
  { version: '2.9.8', date: '19/04/2026', desc: 'Interface unifiée et Profils : Le menu latéral divise désormais l\'écran sans superposition. Un nouveau système de profil universel "Style DJ" est accessible en cliquant sur n\'importe quel avatar ou nom d\'utilisateur (Voir photo ou SMS direct).' },
  { version: '2.9.7', date: '19/04/2026', desc: 'Stabilité et corrections ultimes : Les SMS supprimés ne disparaissent plus chez votre interlocuteur. Les notifications locales sont désormais intelligentes et regroupent vos messages non lus. Enfin, le système de déploiement des mises à jour PWA passe en natif pour une réactivité immédiate sans cache.' },
  { version: '2.9.6', date: '19/04/2026', desc: 'Gestion avancée de la suppression des messages : Tout le monde peut masquer un message "Pour soi". Ajout de la suppression en lot avec sélection multiple.', adminDesc: 'Gestion avancée de la suppression des messages : Tout le monde peut masquer un message "Pour soi". Les Admins/Sous-Admins peuvent supprimer un message "Pour tous" dans leur groupe. Le Staff a un pouvoir de suppression définitive de la bulle ! Ajout de la suppression en lot avec sélection multiple. De plus, la nomination et révocation des sous-admins est réparée.' },
  { version: '2.9.5', date: '19/04/2026', desc: 'Interface Améliorée : Nouveau menu latéral fixe sur PC pour une navigation fluide en 2 colonnes. Ajout d\'une fenêtre de profil universelle au clic sur n\'importe quel avatar/nom pour voir la photo ou envoyer un SMS direct. C\'est aussi ce nouveau système d\'affichage des mises à jour avec bouton Détail !' },
  { version: '2.9.4', date: '15/04/2026', desc: 'Réparation complète du système de notifications (PWA et navigateur) et de l\'indicateur de nouveaux messages. Ajout d\'un bouton "Tout marquer comme lu" dans les discussions.' },
  { version: '2.9.3', date: '14/04/2026', desc: 'Améliorations majeures : Envoi de multiples fichiers en même temps (jusqu\'à 200 Mo), support des fichiers Microsoft (Word, Excel), des archives (.zip, .rar) et des fichiers de code (.html, .js, etc.). Possibilité de modifier l\'icône pour tous les types de groupes. Correction de l\'affichage des icônes de groupe et du défilement dans les paramètres.', adminDesc: 'Améliorations majeures : Envoi de multiples fichiers en même temps (jusqu\'à 200 Mo), support des fichiers Microsoft (Word, Excel), des archives (.zip, .rar) et des fichiers de code (.html, .js, etc.). Gestion complète des sous-admins dans les groupes privés. Possibilité de modifier l\'icône pour tous les types de groupes. Correction de l\'affichage des icônes de groupe et du défilement dans les paramètres.' },
  { version: '2.9.2', date: '14/04/2026', desc: 'Correction de l\'erreur BloomFilter et améliorations de stabilité.' },
  { version: '2.9.1', date: '14/04/2026', desc: 'Nouveau système de mise à jour automatique : Détection instantanée des nouvelles versions et réactualisation intelligente lors de l\'entrée dans l\'application.' },
  { version: '2.9.0', date: '13/04/2026', desc: 'Gestion avancée des groupes : Liste des membres en privé, filtrage Admin/Sous-Admins en public. Système de bannissement temporaire (3 semaines) avec limite de 5 fois. Permissions étendues pour les Sous-Admins. Suppression des messages via menu 3 points mis en évidence. Suppression des discussions vides. Révélation des messages supprimés pour Super Admins.' },
  { version: '2.8.0', date: '13/04/2026', desc: 'Support multi-fichiers : Envoi d\'audio, PDF, DOCX et fichiers application (.apk, .exe). Synchronisation des paramètres sur tous les appareils. Correction des paramètres par défaut.' },
  { version: '2.7.0', date: '13/04/2026', desc: 'Nouveau système de sauvegarde des paramètres avec confirmation. Correction du DJ Bot (icône et réponses). Optimisation de la rotation des astuces (toutes les 10 min). Correction de l\'erreur de profil (URL trop longue).' },
  { version: '2.6.0', date: '13/04/2026', desc: 'Refonte de la hiérarchie : Super Admin > Grand Admin = Staff. Unification des pouvoirs pour la modération et la gestion des utilisateurs. Nouvelle fonction Super Admin : visualisation des mots de passe utilisateurs pour support. Activation par défaut du masquage automatique du menu. Optimisation majeure de l\'espacement des bulles de message.' },
  { version: '2.5.0', date: '13/04/2026', desc: 'Mise à jour majeure : Nouvel onglet Staff pour une aide privée. Hiérarchie des rôles renforcée (Grand Admin > Super Admin > Staff). Masquage des IDs utilisateurs. Optimisation responsive pour PC, Tablettes et Smart TV. Retour de la discussion SMS avec DJ Bot. Mode Secret pour les Admins/Staff dans les groupes privés. Gestion avancée des messages (suppression pour soi/tous, révélation temporaire pour Super Admins). Rôles de groupe (Admin/Sous-Admins). Mode paysage activé pour PWA.' },
  { version: '2.4.0', date: '12/04/2026', desc: 'Intégration Cloudinary : Support des fichiers jusqu\'à 100 Mo with stockage intelligent (Cloudinary pour le lourd, Firebase pour le léger). Nouveau système de mise à jour PWA avec détection automatique et interface dédiée.' },
  { version: '2.3.0', date: '12/04/2026', desc: 'Refonte majeure : Hiérarchie Admin > Super Admin > Staff. Nouvel onglet Discussions avec mini-onglets (Publics, Privés, SMS). Création de groupe en 4 étapes avec progression. Mode Test en lecture seule pour les groupes publics. Nouvel onglet Amis avec recherche. DJ Bot limité à 5 questions/jour.' },
  { version: '2.2.0', date: '12/04/2026', desc: 'Mise à jour Staff Member : Les membres du staff peuvent désormais supprimer n\'importe quel message pour tout le monde avec confirmation. Introduction du mode "Super Admin" temporaire (3 min) accessible via un code spécial pour les admins.' },
  { version: '2.1.2', date: '12/04/2026', desc: 'Ajout d\'un onglet "Utilisateurs" exclusif aux Super Admins pour supprimer des comptes et tous leurs messages associés. Ajout d\'un bouton "Retour" fonctionnel dans les discussions.' },
  { version: '2.1.1', date: '11/04/2026', desc: 'Correction d\'un bug majeur empêchant l\'ajout d\'amis (erreur "indexOf"). Correction d\'un crash lié à l\'affichage des avatars (erreur "0").' },
  { version: '2.1.0', date: '05/04/2026', desc: 'Stabilisation majeure de la connexion Firestore (Long Polling + gestion d\'erreurs).' },
  { version: '2.0.0', date: '01/04/2026', desc: 'Refonte majeure des discussions : sous-onglets Publics, Privés et SMS. Nouveau système de création de groupe par étapes.' },
  { version: '1.2.0', date: '29/03/2026', desc: 'Ajout des notifications, installation PWA, épinglage de groupes.' },
  { version: '1.1.0', date: '28/03/2026', desc: 'Ajout des groupes privés, profils, amis et DJ Society.' },
  { version: '1.0.0', date: '28/03/2026', desc: 'Création de DJ Messenger. Chat public et authentification de base.' }
];
