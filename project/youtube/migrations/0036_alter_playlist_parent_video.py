# Generated by Django 5.1.4 on 2025-02-19 16:53

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('youtube', '0035_alter_playlist_parent_video'),
    ]

    operations = [
        migrations.AlterField(
            model_name='playlist',
            name='parent_video',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='youtube.video'),
        ),
    ]
