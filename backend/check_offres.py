from apps.tutorat.models import OffreTutorat
offres = OffreTutorat.objects.filter(est_active=True)
print("=== OFFRES ACTIVES DANS LA BASE DE DONNÉES ===")
for offre in offres:
    print(f'ID: {offre.id}')
    print(f'Titre: {offre.titre}')
    print(f'Type: {offre.type}')
    print(f'Tarif: {offre.tarif}')
    print(f'Matière: {offre.matiere}')
    print(f'Description: {offre.description[:100]}...' if len(offre.description) > 100 else f'Description: {offre.description}')
    print(f'Tuteur: {offre.tuteur.username}')
    print(f'Date création: {offre.date_creation}')
    print('---')
