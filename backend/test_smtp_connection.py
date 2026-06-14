#!/usr/bin/env python
"""
Script de diagnostic pour tester la connexion SMTP Brevo
Exécutez ce script localement et sur Render pour identifier le problème
"""
import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import socket

# Configuration SMTP Brevo
SMTP_HOST = "smtp-relay.brevo.com"
SMTP_PORT = 587
SMTP_USER = "ad1e50001@smtp-brevo.com"
SMTP_PASSWORD = "nB64yOsrKWNzfIx5"
FROM_EMAIL = "ndjerabeernest@gmail.com"
TO_EMAIL = "ndjerabeernest@gmail.com"  # Changez ceci pour tester

def test_dns_resolution():
    """Test si le nom d'hôte peut être résolu"""
    print("=" * 60)
    print("TEST 1: Résolution DNS")
    print("=" * 60)
    try:
        ip_address = socket.gethostbyname(SMTP_HOST)
        print(f"✓ Résolution DNS réussie: {SMTP_HOST} -> {ip_address}")
        return True
    except socket.gaierror as e:
        print(f"✗ Erreur de résolution DNS: {e}")
        return False

def test_port_connectivity():
    """Test si le port SMTP est accessible"""
    print("\n" + "=" * 60)
    print("TEST 2: Connectivité du Port")
    print("=" * 60)
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        result = sock.connect_ex((SMTP_HOST, SMTP_PORT))
        sock.close()
        
        if result == 0:
            print(f"✓ Port {SMTP_PORT} accessible sur {SMTP_HOST}")
            return True
        else:
            print(f"✗ Port {SMTP_PORT} non accessible (code: {result})")
            return False
    except Exception as e:
        print(f"✗ Erreur de test de port: {e}")
        return False

def test_smtp_connection():
    """Test la connexion SMTP avec authentification"""
    print("\n" + "=" * 60)
    print("TEST 3: Connexion SMTP avec Authentification")
    print("=" * 60)
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.set_debuglevel(1)  # Affiche les détails de la connexion
        
        # Démarrer TLS
        print("Démarrage de TLS...")
        server.starttls()
        
        # Authentification
        print("Authentification...")
        server.login(SMTP_USER, SMTP_PASSWORD)
        
        print("✓ Connexion SMTP réussie!")
        server.quit()
        return True
    except smtplib.SMTPAuthenticationError as e:
        print(f"✗ Erreur d'authentification: {e}")
        print("Vérifiez vos identifiants SMTP Brevo")
        return False
    except smtplib.SMTPConnectError as e:
        print(f"✗ Erreur de connexion SMTP: {e}")
        print("Possiblement un blocage firewall ou réseau")
        return False
    except smtplib.SMTPException as e:
        print(f"✗ Erreur SMTP: {e}")
        return False
    except Exception as e:
        print(f"✗ Erreur inattendue: {e}")
        return False

def test_send_email():
    """Test l'envoi d'un email réel"""
    print("\n" + "=" * 60)
    print("TEST 4: Envoi d'Email Réel")
    print("=" * 60)
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        
        # Créer le message
        msg = MIMEMultipart()
        msg['From'] = FROM_EMAIL
        msg['To'] = TO_EMAIL
        msg['Subject'] = "Test SMTP Brevo - Diagnostic"
        
        body = """
Ceci est un email de test pour diagnostiquer la connexion SMTP Brevo.
Si vous recevez cet email, la configuration est correcte.
        """
        msg.attach(MIMEText(body, 'plain'))
        
        # Envoyer
        server.send_message(msg)
        server.quit()
        
        print(f"✓ Email de test envoyé à {TO_EMAIL}")
        print("Vérifiez votre boîte de réception")
        return True
    except Exception as e:
        print(f"✗ Erreur lors de l'envoi: {e}")
        return False

def test_alternative_ports():
    """Test les ports SMTP alternatifs"""
    print("\n" + "=" * 60)
    print("TEST 5: Ports Alternatifs")
    print("=" * 60)
    
    ports_to_test = [
        (25, "SMTP standard"),
        (465, "SMTPS (SSL)"),
        (587, "SMTP avec TLS"),
        (2525, "SMTP alternatif")
    ]
    
    for port, description in ports_to_test:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex((SMTP_HOST, port))
            sock.close()
            
            if result == 0:
                print(f"✓ Port {port} ({description}) accessible")
            else:
                print(f"✗ Port {port} ({description}) non accessible")
        except Exception as e:
            print(f"✗ Erreur sur port {port}: {e}")

def main():
    print("DIAGNOSTIC SMTP BREVO")
    print("=" * 60)
    print(f"Hôte: {SMTP_HOST}")
    print(f"Utilisateur: {SMTP_USER}")
    print(f"Email de test: {TO_EMAIL}")
    print("=" * 60)
    
    # Exécuter tous les tests
    results = []
    
    results.append(("Résolution DNS", test_dns_resolution()))
    results.append(("Connectivité Port", test_port_connectivity()))
    results.append(("Connexion SMTP", test_smtp_connection()))
    
    # Tests supplémentaires seulement si la connexion de base fonctionne
    if results[2][1]:  # Si connexion SMTP réussie
        results.append(("Envoi Email", test_send_email()))
    else:
        print("\n⚠️ Saut du test d'envoi (connexion échouée)")
        results.append(("Envoi Email", False))
    
    results.append(("Ports Alternatifs", test_alternative_ports()))
    
    # Résumé
    print("\n" + "=" * 60)
    print("RÉSUMÉ DES TESTS")
    print("=" * 60)
    for test_name, result in results:
        status = "✓ RÉUSSI" if result else "✗ ÉCHOUÉ"
        print(f"{test_name}: {status}")
    
    # Recommandations
    print("\n" + "=" * 60)
    print("RECOMMANDATIONS")
    print("=" * 60)
    
    if not results[0][1]:
        print("• Problème DNS: Vérifiez votre connexion internet")
    elif not results[1][1]:
        print("• Problème de port: Vérifiez le firewall")
        print("• Sur Render, les ports SMTP peuvent être bloqués")
    elif not results[2][1]:
        print("• Problème d'authentification: Vérifiez vos identifiants Brevo")
        print("• Allez sur https://app.brevo.com/smtp pour vérifier vos clés")
    else:
        print("• Configuration SMTP correcte!")

if __name__ == "__main__":
    main()
