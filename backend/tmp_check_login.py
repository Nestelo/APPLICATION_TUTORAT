import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tutorat_backend.settings')
django.setup()

from apps.accounts.views import LoginView
from rest_framework.test import APIRequestFactory

factory = APIRequestFactory()
request = factory.post('/api/auth/login/', {'email': 'ndoubadabonheur@gmail.com', 'password': 'bonheur6840', 'include_refresh': True}, format='json')
view = LoginView.as_view()
response = view(request)
print('status', response.status_code)
print(response.data)
