# Generated migration for changing photo field to CloudinaryField

from django.db import migrations, models
import cloudinary.models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_merge_0003_add_tutor_badges_0006_systemsettings'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='photo',
            field=cloudinary.models.CloudinaryField(
                'profile',
                resource_type='image',
                blank=True,
                null=True
            ),
        ),
    ]
