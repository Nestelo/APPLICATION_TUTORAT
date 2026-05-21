from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import StudentProfile

# Create your tests here.

class StudentProfileTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            email='student@test.com',
            password='testpassword'
        )
        self.profile = StudentProfile.objects.create(user=self.user)
        self.client.force_authenticate(user=self.user)

    def test_increment_ressources_consultees(self):
        """Test de l'incrémentation des ressources consultées"""
        url = f'/studentprofiles/{self.profile.id}/increment_ressources/'
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.ressources_consultees, 1)
