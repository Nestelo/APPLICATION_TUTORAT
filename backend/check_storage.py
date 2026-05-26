# check_storage.py
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from django.conf import settings
from django.core.files.storage import default_storage

print("=" * 60)
print("🔍 VÉRIFICATION DU STOCKAGE")
print("=" * 60)

print(f"\n1️⃣ DEBUG = {settings.DEBUG}")
print(f"2️⃣ DEFAULT_FILE_STORAGE = {settings.DEFAULT_FILE_STORAGE}")
print(f"3️⃣ Cloudinary dans INSTALLED_APPS: {'cloudinary_storage' in settings.INSTALLED_APPS}")

# Tester le stockage
print("\n4️⃣ Test d'écriture d'un fichier...")
try:
    test_path = default_storage.save('test_storage.txt', 'Contenu de test')
    print(f"   ✅ Fichier sauvegardé: {test_path}")
    print(f"   📁 URL: {default_storage.url(test_path)}")
    default_storage.delete(test_path)
    print(f"   ✅ Fichier supprimé")
except Exception as e:
    print(f"   ❌ Erreur: {e}")

print("\n" + "=" * 60)