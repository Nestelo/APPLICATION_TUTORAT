# Generated migration for priority field only
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0003_alter_question_date_publication_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='priorite',
            field=models.CharField(
                choices=[('haute', 'Haute'), ('moyenne', 'Moyenne'), ('basse', 'Basse')],
                default='moyenne',
                max_length=10
            ),
        ),
    ]
