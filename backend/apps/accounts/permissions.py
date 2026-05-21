from rest_framework import permissions

class IsEtudiant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'etudiant'

class IsTuteur(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['tuteur', 'enseignant']

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsAdminOuTuteur(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.role == 'admin' or request.user.role in ['tuteur', 'enseignant'])

class IsAdminOuTuteurProprietaire(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Admin peut modifier n'importe quelle offre
        if request.user.role == 'admin':
            return True
        
        # Tuteur ne peut modifier que ses propres offres
        if request.user.role in ['tuteur', 'enseignant'] and obj.tuteur.id == request.user.id:
            return True
        
        return False