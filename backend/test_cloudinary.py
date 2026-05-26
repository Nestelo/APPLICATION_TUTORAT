#!/usr/bin/env python
"""
Test de connexion à Cloudinary
"""

import cloudinary
import cloudinary.uploader
import cloudinary.api
import os

print("=" * 60)
print("🧪 TEST DE CONNEXION CLOUDINARY")
print("=" * 60)

# Configuration Cloudinary
cloudinary.config(
    cloud_name='dqtk8z6of',
    api_key='877765774416995',
    api_secret='IlLuSpBfM3lsD8568Ve7nAZ6I-0',
    secure=True
)

print("\n1️⃣ Test de connexion à Cloudinary...")
try:
    result = cloudinary.api.ping()
    print("✅ Connexion établie avec succès!")
    print(f"   Réponse: {result}")
except Exception as e:
    print(f"❌ Erreur de connexion: {e}")
    exit(1)

print("\n2️⃣ Test d'upload d'un fichier...")
try:
    # Télécharger un fichier de test depuis internet
    import requests
    from io import BytesIO
    
    # URL d'un fichier PDF de test
    pdf_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    response = requests.get(pdf_url)
    
    if response.status_code == 200:
        # Upload vers Cloudinary
        upload_result = cloudinary.uploader.upload(
            response.content,
            folder="test/",
            public_id="test_file"
        )
        print("✅ Upload réussi!")
        print(f"   URL sécurisée: {upload_result['secure_url']}")
        print(f"   Public ID: {upload_result['public_id']}")
    else:
        print("❌ Impossible de télécharger le fichier de test")
except Exception as e:
    print(f"❌ Erreur upload: {e}")

print("\n3️⃣ Test de création d'un dossier...")
try:
    # Lister les ressources
    resources = cloudinary.api.resources(type="upload", prefix="test/", max_results=10)
    print(f"✅ {len(resources.get('resources', []))} fichiers trouvés dans le dossier test/")
except Exception as e:
    print(f"⚠️ Erreur listing: {e}")

print("\n" + "=" * 60)
print("✅ Test terminé!")
print("=" * 60)