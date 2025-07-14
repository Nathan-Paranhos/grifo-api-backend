@echo off
echo Building APK for Grifo Vistorias...

cd "%~dp0android"

echo Running Gradle clean...
call gradlew.bat clean

echo Building release APK...
call gradlew.bat :app:assembleRelease

echo.
echo If build was successful, the APK can be found at:
echo %~dp0android\app\build\outputs\apk\release\app-release.apk
echo.

pause