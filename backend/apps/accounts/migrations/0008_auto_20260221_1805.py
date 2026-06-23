import django.db.models.deletion
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_auto_20260221_1804'),
    ]

    operations = [
        # 1. Remove old role fields
        migrations.RemoveField(
            model_name='organizationmember',
            name='role',
        ),
        migrations.RemoveField(
            model_name='user',
            name='role',
        ),
        # 2. Rename temp_role to role
        migrations.RenameField(
            model_name='organizationmember',
            old_name='temp_role',
            new_name='role',
        ),
        migrations.RenameField(
            model_name='user',
            old_name='temp_role',
            new_name='role',
        ),
        # 3. Fix related_names and constraints if necessary
        migrations.AlterField(
            model_name='organizationmember',
            name='role',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='members', to='accounts.role'),
        ),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to='accounts.role'),
        ),
    ]
