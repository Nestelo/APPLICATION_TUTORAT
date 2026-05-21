# Generated manually to fix table name issue

from django.db import migrations, connections

def rename_table(apps, schema_editor):
    """Rename ressources_ressource table to ressources_globales"""
    db_alias = schema_editor.connection.alias
    with connections[db_alias].cursor() as cursor:
        # Vérifier si la table ressources_ressource existe
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'ressources_ressource'
        """)
        if cursor.fetchone()[0] > 0:
            cursor.execute("""
                ALTER TABLE ressources_ressource RENAME TO ressources_globales
            """)
            print("Table renamed from ressources_ressource to ressources_globales")
        else:
            # Vérifier si la table ressources_globales existe déjà
            cursor.execute("""
                SELECT COUNT(*) FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'ressources_globales'
            """)
            if cursor.fetchone()[0] == 0:
                # Si aucune table n'existe, la créer
                cursor.execute("""
                    CREATE TABLE ressources_globales (
                        id BIGSERIAL PRIMARY KEY,
                        titre VARCHAR(255) NOT NULL,
                        description TEXT,
                        auteur_id INTEGER NOT NULL,
                        matiere VARCHAR(100),
                        niveau VARCHAR(50),
                        type_fichier VARCHAR(20) NOT NULL,
                        fichier VARCHAR(100),
                        lien_externe VARCHAR(200),
                        tags VARCHAR(500),
                        statut VARCHAR(20) NOT NULL DEFAULT 'en_attente',
                        nb_telechargements INTEGER NOT NULL DEFAULT 0,
                        nb_vues INTEGER NOT NULL DEFAULT 0,
                        date_publication TIMESTAMP NOT NULL,
                        date_maj TIMESTAMP NOT NULL
                    )
                """)
                print("Created table ressources_globales")

def reverse_rename_table(apps, schema_editor):
    """Reverse operation - rename back to ressources_ressource"""
    db_alias = schema_editor.connection.alias
    with connections[db_alias].cursor() as cursor:
        cursor.execute("""
            ALTER TABLE ressources_globales RENAME TO ressources_ressource
        """)

class Migration(migrations.Migration):

    dependencies = [
        ('ressources', '0006_auto_20260502_0206'),
    ]

    operations = [
        migrations.RunPython(rename_table, reverse_rename_table),
    ]
