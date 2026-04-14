@echo off
echo ============================================
echo  Subiendo CRMLucio al repositorio mi-tienda.crm
echo ============================================

echo.
echo [1/3] Inicializando Git y preparando archivos...
git init
git add .
git commit -m "Actualizacion: CRM SaaS Multi-tenant"
git branch -M main

echo.
echo [2/3] Conectando con tu repositorio en GitHub...
set /p usuario="Escribe tu nombre de usuario de GitHub (Ej. TuNombre): "
git remote remove origin 2>nul
git remote add origin https://github.com/Caperp22/mi-tienda.crm.git

echo.
echo [3/3] Subiendo el codigo a la nube...
git push -u origin main

echo.
echo ============================================
echo  ¡Listo! Tu codigo ha sido subido a GitHub.
pause
