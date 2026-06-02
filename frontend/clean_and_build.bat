@echo off
echo ========================================
echo Nettoyage du cache et build EAS
echo ========================================

echo.
echo 1. Nettoyage du cache Expo...
npx expo start --clear

echo.
echo 2. Nettoyage du cache Metro...
if exist .expo rmdir /s /q .expo
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo 3. Nettoyage du build Android...
cd android
call gradlew clean
cd ..

echo.
echo 4. Nettoyage du cache EAS...
eas build:clean

echo.
echo ========================================
echo Nettoyage terminé !
echo ========================================
echo.
echo Pour lancer le build EAS, exécutez :
echo npx eas build -p android --profile preview
echo.
