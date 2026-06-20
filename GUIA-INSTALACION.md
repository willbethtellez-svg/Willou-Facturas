# 🚀 Guía de Instalación - willou Facturas

## 📋 Requisitos Previos

Antes de empezar, necesitas tener instalados:

1. **Node.js** (versión 18 o superior)
   - Ve a https://nodejs.org
   - Descarga la versión LTS
   - Instala con las opciones por defecto

2. **Visual Studio Code** (editor de código)
   - Ve a https://code.visualstudio.com
   - Descarga e instala

3. **Cuenta en GitHub**
   - Si no tienes: https://github.com (es gratis)

4. **Cuenta en Supabase** (base de datos)
   - Ve a https://supabase.com
   - Crea una cuenta gratuita

---

## 🎯 Paso 1: Configurar Supabase (Base de Datos)

1. Ve a https://supabase.com y haz login
2. Haz clic en "New Project"
3. Configura:
   - **Name**: willou-facturas
   - **Database Password**: Elige una contraseña segura (guárdala)
   - **Region**: Usar la más cercana
4. Espera ~2 minutos a que se cree
5. Ve a **SQL Editor** en el menú izquierdo
6. Copia y pega TODO el contenido del archivo `supabase/schema.sql`
7. Haz clic en "Run" ▶️
8. Ve a **Settings** → **API** y copia:
   - **Project URL** (algo como: https://xxxxxxxx.supabase.co)
   - **Project API Key** (anon public)

---

## 🎯 Paso 2: Configurar el Proyecto

1. Abre **Visual Studio Code**
2. Abre la carpeta del proyecto:
   - Archivo → Abrir Carpeta → Busca `facturas-willou`
3. Abre la terminal (Ctrl + ` o Terminal → New Terminal)
4. Escribe estos comandos uno por uno:

```bash
npm install
```

5. Espera a que termine (puede tomar 1-2 minutos)

---

## 🎯 Paso 3: Configurar Variables de Entorno

1. En VS Code, abre el archivo `.env.local`
2. Reemplaza los valores con los de tu Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU-ANON-KEY-AQUI
NEXT_PUBLIC_APP_PASSWORD=willou2026
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Importante**: Cambia `TU-PROYECTO` y `TU-ANON-KEY-AQUI` por tus valores reales de Supabase.

---

## 🎯 Paso 4: Ejecutar la App

En la terminal, escribe:

```bash
npm run dev
```

Abre tu navegador en: **http://localhost:3000**

**Contraseña por defecto**: `willou2026`

---

## 🎯 Paso 5: Configurar tu App

Una vez dentro:

1. Ve a **Configuración** (menú izquierdo)
2. Configura:
   - **Número de factura inicial**: 153 (o el que necesites)
   - **Porcentaje de IVA**: 16%
   - **Datos de tu empresa**: Nombre, dirección, teléfono, correo
3. Haz clic en **Guardar**

---

## 📊 Estructura de la App

```
willou/
├── 📊 Dashboard      → Resumen de facturación
├── 📄 Facturas       → Crear, ver, gestionar facturas
├── 👥 Clientes       → Gestionar cartera de clientes
├── 📦 Servicios      → Catálogo de servicios y precios
└── ⚙️ Configuración  → Numeración, IVA, datos empresa
```

---

## 🔧 Comandos Útiles

```bash
# Iniciar la app
npm run dev

# Detener la app (en la terminal)
Ctrl + C

# Instalar dependencias
npm install

# Ver errores
npm run lint
```

---

## 🐛 Solución de Problemas

### "No se puede conectar a Supabase"
- Verifica que las credenciales en `.env.local` sean correctas
- Asegúrate de haber ejecutado el schema SQL en Supabase

### "Error al cargar datos"
- Abre la consola del navegador (F12)
- Revisa los errores en la pestaña Console

### "La app no carga"
- Verifica que Node.js esté instalado: `node --version`
- Reinstala dependencias: `rm -rf node_modules && npm install`

---

## 📝 Próximos Pasos

Una vez que la app esté funcionando:

1. **Agregar clientes**: Ve a Clientes → Nuevo Cliente
2. **Agregar servicios**: Ve a Servicios → Nuevo Servicio
3. **Crear tu primera factura**: Ve a Facturas → Nueva Factura
4. **Descargar PDF**: En la factura, haz clic en "Descargar PDF"

---

## 🆕 Crear en GitHub (para backup)

1. Crea una cuenta en GitHub si no tienes
2. Abre terminal en VS Code
3. Escribe:

```bash
git init
git add .
git commit -m "Initial commit: willou facturas"
git remote add origin https://github.com/TU-USUARIO/facturas-willou.git
git push -u origin main
```

---

## ❓ ¿Necesitas Ayuda?

Si te atascas en algún paso, dime exactamente:
1. En qué paso estás
2. Qué error ves (si hay)
3. Una captura de pantalla si es posible

¡Estoy aquí para ayudarte!
