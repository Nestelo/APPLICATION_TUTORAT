# Endpoints API pour la messagerie et les notifications

## Base URLs:
- Messagerie: `http://localhost:8000/api/messagerie/`
- Notifications: `http://localhost:8000/api/notifications/`

## Messagerie

### Conversations
- `GET /api/messagerie/conversations/` - Lister les conversations de l'utilisateur
- `POST /api/messagerie/conversations/` - Créer une nouvelle conversation
- `GET /api/messagerie/conversations/{id}/` - Détails d'une conversation
- `DELETE /api/messagerie/conversations/{id}/` - Supprimer une conversation

### Messages
- `GET /api/messagerie/messages/` - Lister les messages de l'utilisateur
- `POST /api/messagerie/messages/` - Envoyer un message
- `GET /api/messagerie/messages/{id}/` - Détails d'un message
- `PUT /api/messagerie/messages/{id}/` - Modifier un message
- `DELETE /api/messagerie/messages/{id}/` - Supprimer un message

### Emails
- `GET /api/messagerie/emails/` - Lister les emails
- `POST /api/messagerie/emails/` - Envoyer un email
- `GET /api/messagerie/emails/{id}/` - Détails d'un email
- `POST /api/messagerie/emails/{id}/repondre/` - Répondre à un email

## Notifications

### Notifications
- `GET /api/notifications/notifications/` - Lister les notifications de l'utilisateur
- `POST /api/notifications/notifications/` - Créer une notification
- `GET /api/notifications/notifications/{id}/` - Détails d'une notification
- `PUT /api/notifications/notifications/{id}/` - Marquer comme lue
- `DELETE /api/notifications/notifications/{id}/` - Supprimer une notification

### Actions sur les notifications
- `POST /api/notifications/notifications/marquer-toutes-lues/` - Marquer toutes les notifications comme lues
- `POST /api/notifications/notifications/{id}/marquer-lue/` - Marquer une notification comme lue

## Exemples d'utilisation

### Créer une conversation
```json
POST /api/messagerie/conversations/
{
    "participants": [2, 3],
    "titre": "Discussion sur le tutorat"
}
```

### Envoyer un message
```json
POST /api/messagerie/messages/
{
    "conversation": 1,
    "contenu": "Bonjour, comment allez-vous ?"
}
```

### Envoyer une notification
```json
POST /api/notifications/notifications/
{
    "destinataire": 2,
    "titre": "Nouveau message",
    "contenu": "Vous avez reçu un nouveau message",
    "type": "message"
}
```

### Marquer une notification comme lue
```json
PUT /api/notifications/notifications/123/
{
    "lue": true
}
```

## Permissions

- **Utilisateurs authentifiés** : Peuvent accéder à leurs conversations, messages et notifications
- **Admins** : Peuvent accéder à toutes les données de messagerie et notifications

## Types de notifications

- `message` - Nouveau message reçu
- `tutorat` - Information sur le tutorat
- `ressource` - Information sur les ressources
- `forum` - Activité sur le forum
- `systeme` - Notifications système

## Statuts des emails

- `envoye` - Email envoyé
- `recu` - Email reçu
- `lu` - Email lu
- `repondu` - Email avec réponse
