# Route du Rhum 2026 — Plugin Windy (v0.1)

Plugin distinct de « Météo & Vols ». Affiche les voiliers sur Windy, leurs noms, navigateurs, pavillons, vitesse (en nœuds), cap, date du pointage et trace historique **si ces données figurent dans un flux JSON autorisé**.

**Important : aucune API ouverte et autorisée de la cartographie officielle n'a été identifiée.** Le plugin n'invente pas des positions de bateaux : il indique « Source non configurée » tant qu'aucune source JSON compatible n'est connectée. Le lien de la cartographie officielle reste accessible : https://carto.routedurhum.com/fr/index.html

## Connecter les données

Dans `src/settings.ts`, remplacer `DATA_URL = ''` par une URL HTTPS qui renvoie du JSON au format suivant, avec CORS autorisant Windy. Votre fournisseur doit autoriser la republication des données et l'accès automatisé.

```json
{
  "updatedAt": "2026-11-02T12:00:00Z",
  "boats": [
    {
      "id": "id-unique",
      "boatName": "Nom du bateau",
      "skipper": "Nom du navigateur",
      "flag": "🇫🇷",
      "className": "IMOCA",
      "lat": 47.0,
      "lon": -7.0,
      "speedKn": 12.4,
      "headingDeg": 235,
      "updatedAt": "2026-11-02T12:00:00Z",
      "history": [
        {"lat": 48.6, "lon": -2.0, "time": "2026-11-01T12:02:00Z"},
        {"lat": 47.6, "lon": -4.0, "time": "2026-11-01T18:00:00Z"}
      ]
    }
  ]
}
```

Les coordonnées et valeurs de l'exemple ci-dessus sont **fictives**, à usage de documentation seulement ; `sample-feed.json` fourni est vide pour éviter tout affichage trompeur.

## Installer

1. Créer un **nouveau dépôt GitHub** (ex. `windy-route-du-rhum`) pour ne pas remplacer le plugin « Météo & Vols ».
2. Envoyer **le contenu** de ce dossier à la racine du nouveau dépôt, y compris `.github/workflows/deploy-pages.yml`.
3. Dans les Settings du dépôt > Pages, choisir Source = GitHub Actions.
4. Après un build vert, l'URL de script sera `https://VOTRE-PSEUDO.github.io/windy-route-du-rhum/plugin.js`.
5. Charger cette URL dans Windy.

Le workflow GitHub Pages peut utiliser le même script que dans votre projet précédent. L'URL du dépôt dans `pluginConfig.ts` est informative et peut être modifiée.

Départ officiel : dimanche 1er novembre 2026 à 13 h 02 (heure de Paris). La fréquence du **relevé officiel** est différente du rafraîchissement de la page web.
