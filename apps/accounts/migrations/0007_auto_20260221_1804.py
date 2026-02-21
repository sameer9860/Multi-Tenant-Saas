from django.db import migrations

def create_roles_and_migrate(apps, schema_editor):
    Organization = apps.get_model('core', 'Organization')
    Role = apps.get_model('accounts', 'Role')
    User = apps.get_model('accounts', 'User')
    OrganizationMember = apps.get_model('accounts', 'OrganizationMember')

    default_roles = ['OWNER', 'ADMIN', 'STAFF', 'ACCOUNTANT']

    for org in Organization.objects.all():
        roles_map = {}
        for role_name in default_roles:
            role, created = Role.objects.get_or_create(
                name=role_name,
                organization=org
            )
            roles_map[role_name] = role
        
        # Migrate Users
        for user in User.objects.filter(organization=org):
            if user.role in roles_map:
                user.temp_role = roles_map[user.role]
                user.save()
        
        # Migrate OrganizationMembers
        for member in OrganizationMember.objects.filter(organization=org):
            if member.role in roles_map:
                member.temp_role = roles_map[member.role]
                member.save()

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_organizationmember_temp_role_user_temp_role'),
    ]

    operations = [
        migrations.RunPython(create_roles_and_migrate),
    ]
