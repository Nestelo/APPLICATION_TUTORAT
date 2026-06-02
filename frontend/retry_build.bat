@echo off
echo ========================================
echo Réessayer le build EAS après corrections
echo ========================================

echo.
echo 1. Nettoyage du cache EAS...
eas build:clean

echo.
echo 2. Lancement du build EAS Android...
echo.
echo Le répertoire android a été renommé en android_backup
echo pour forcer EAS à utiliser la configuration app.json
echo.
npx eas build -p android --profile preview

echo.
echo ========================================
echo Si le build réussit, vous pouvez restaurer android :
echo ren android_backup android
echo ========================================
