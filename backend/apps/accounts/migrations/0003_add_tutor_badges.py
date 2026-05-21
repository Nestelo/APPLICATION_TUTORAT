# Generated migration for tutor badges and points
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_user_options_user_badges_user_biographie_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tutorprofile',
            name='points',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='tutorprofile',
            name='badge_solutions',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='tutorprofile',
            name='badge_aide',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='tutorprofile',
            name='badge_expert',
            field=models.IntegerField(default=0),
        ),
    ]
