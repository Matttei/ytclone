# Generated by Django 5.1.4 on 2025-01-04 16:52

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('youtube', '0002_video'),
    ]

    operations = [
        migrations.RenameField(
            model_name='video',
            old_name='uploader',
            new_name='user',
        ),
    ]
