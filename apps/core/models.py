import uuid
from django.db import models

class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    plan = models.CharField(
        max_length=20,
        choices=[
            ('FREE', 'Free'),
            ('BASIC', 'Basic'),
            ('PRO', 'Pro'),
        ],
        default='FREE'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
