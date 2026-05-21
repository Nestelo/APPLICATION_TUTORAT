import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')

from django.db import connection

def check_tables():
    with connection.cursor() as cursor:
        cursor.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = cursor.fetchall()
        print("Tables in the database:")
        for table in tables:
            print(table[0])

if __name__ == "__main__":
    check_tables()