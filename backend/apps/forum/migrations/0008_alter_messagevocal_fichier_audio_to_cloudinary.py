# Generated migration for changing fichier_audio field to CloudinaryField

from django.db import migrations, models
import cloudinary.models


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0007_alter_messagevocal_fichier_audio'),
    ]

    operations = [
        migrations.AlterField(
            model_name='messagevocal',
            name='fichier_audio',
            field=cloudinary.models.CloudinaryField(
                'voice_message',
                resource_type='video',
                blank=True,
                null=True
            ),
        ),
    ]
