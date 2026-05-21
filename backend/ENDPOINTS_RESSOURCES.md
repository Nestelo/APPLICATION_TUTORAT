# Endpoints API pour la gestion des ressources et modération

## Base URL: `http://localhost:8000/api/ressources/`

## Gestion des ressources

### CRUD Ressources
- `GET /api/ressources/resources/` - Lister toutes les ressources (filtrées par statut)
- `POST /api/ressources/resources/` - Créer une nouvelle ressource
- `GET /api/ressources/resources/{id}/` - Détails d'une ressource
- `PUT /api/ressources/resources/{id}/` - Modifier une ressource
- `DELETE /api/ressources/resources/{id}/` - Supprimer une ressource

### Actions sur les ressources
- `POST /api/ressources/resources/{id}/telecharger/` - Télécharger une ressource
- `POST /api/ressources/resources/{id}/vue/` - Marquer comme vu
- `POST /api/ressources/resources/{id}/commenter/` - Ajouter un commentaire
- `POST /api/ressources/resources/{id}/noter/` - Noter une ressource (1-5)
- `POST /api/ressources/resources/{id}/favori/` - Ajouter/retirer des favoris

### Gestion des commentaires
- `GET /api/ressources/commentaires/` - Lister tous les commentaires
- `POST /api/ressources/commentaires/` - Créer un commentaire
- `GET /api/ressources/commentaires/{id}/` - Détails d'un commentaire
- `PUT /api/ressources/commentaires/{id}/` - Modifier un commentaire
- `DELETE /api/ressources/commentaires/{id}/` - Supprimer un commentaire
- `POST /api/ressources/commentaires/{id}/signaler/` - Signaler un commentaire

### Notes et favoris
- `GET /api/ressources/notes/` - Lister les notes de l'utilisateur
- `POST /api/ressources/notes/` - Noter une ressource
- `GET /api/ressources/favoris/` - Lister les favoris de l'utilisateur
- `POST /api/ressources/favoris/` - Ajouter aux favoris

## Administration (réservé aux admins)

### Validation des ressources
- `GET /api/ressources/admin/ressources/en-attente/` - Lister les ressources en attente de validation
- `POST /api/ressources/admin/ressources/{id}/valider/` - Valider une ressource
- `POST /api/ressources/admin/ressources/{id}/rejeter/` - Rejeter une ressource (avec motif)

### Gestion des signalements
- `GET /api/ressources/admin/signalements/` - Lister tous les signalements non traités
- `POST /api/ressources/admin/signalements/{id}/traiter/` - Traiter un signalement (supprimer ou ignorer)

### Signalements (CRUD)
- `GET /api/ressources/signalements/` - Lister les signalements (admin seulement)
- `POST /api/ressources/signalements/` - Créer un signalement
- `GET /api/ressources/signalements/{id}/` - Détails d'un signalement
- `POST /api/ressources/signalements/{id}/traiter/` - Marquer comme traité

## Exemples d'utilisation

### Créer une ressource
```json
POST /api/ressources/resources/
{
    "titre": "Cours de mathématiques",
    "description": "Introduction aux dérivées",
    "matiere": "Mathématiques",
    "niveau": "Terminale",
    "type_fichier": "pdf",
    "tags": "maths, dérivées, terminale"
}
```

### Valider une ressource (admin)
```json
POST /api/ressources/admin/ressources/123/valider/
```

### Signaler un commentaire
```json
POST /api/ressources/commentaires/456/signaler/
{
    "motif": "Contenu inapproprié"
}
```

### Traiter un signalement (admin)
```json
POST /api/ressources/admin/signalements/789/traiter/
{
    "action": "supprimer"  // ou "ignorer"
}
```

## Permissions

- **Utilisateurs authentifiés** : Peuvent voir les ressources publiées, commenter, noter, ajouter aux favoris
- **Tuteurs/Enseignants** : Peuvent créer et modifier leurs propres ressources
- **Admins** : Peuvent gérer toutes les ressources, valider, rejeter, et traiter les signalements

## Statuts des ressources

- `en_attente` : En attente de validation par un admin
- `publie` : Publiée et visible par tous
- `rejete` : Rejetée par un admin
