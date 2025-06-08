# 🚀 INSTRUCCIONES DE DEPLOY - NETLIFY

## 📋 PASOS PARA SOLUCIONAR EL ERROR 404

### 1️⃣ **Archivos ya creados:**
- ✅ `public/_redirects` - Maneja las rutas de React
- ✅ `netlify.toml` - Configuración de build

### 2️⃣ **Configurar Variables de Entorno en Netlify:**

1. Ve a tu **Dashboard de Netlify**
2. Selecciona tu proyecto
3. Ve a **Site settings** → **Environment variables**
4. Agrega estas variables:

```
VITE_SUPABASE_URL = tu_url_de_supabase
VITE_SUPABASE_ANON_KEY = tu_clave_publica
```

### 3️⃣ **Hacer nuevo deploy:**

**Opción A: Desde Git**
```bash
git add .
git commit -m "Fix: Configuración Netlify y redirects"
git push origin main
```

**Opción B: Deploy manual**
1. Ejecuta: `npm run build`
2. Sube la carpeta `dist` a Netlify

### 4️⃣ **Verificar configuración de build:**

En Netlify, asegúrate de que:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Node version:** 18

## 🔧 SOLUCIÓN AL ERROR 404

El archivo `_redirects` que creamos contiene:
```
/*    /index.html   200
```

Esto le dice a Netlify que **todas las rutas** deben servir el `index.html`, permitiendo que React Router maneje la navegación.

## ⚠️ PROBLEMAS COMUNES

### **Error: "Build failed"**
- Verifica que las variables de entorno estén configuradas
- Asegúrate de que no hay errores de ESLint

### **Error: "Function not found"**
- Verifica que Supabase esté configurado correctamente
- Revisa que las credenciales sean correctas

### **Error: "Module not found"**
- Ejecuta `npm install` antes del build
- Verifica que todas las dependencias estén en package.json

## 🎯 RESULTADO ESPERADO

Después de seguir estos pasos:
- ✅ La aplicación carga correctamente
- ✅ La navegación funciona sin errores 404
- ✅ Supabase se conecta correctamente
- ✅ Todas las funcionalidades operativas

## 🚀 DEPLOY AUTOMÁTICO

Para futuros deploys, solo necesitas:
```bash
git add .
git commit -m "Actualización"
git push origin main
```

Netlify detectará automáticamente los cambios y hará el deploy.

---

## 📞 SI PERSISTEN LOS PROBLEMAS

1. **Limpia el cache de Netlify:** Site settings → Build & deploy → Clear cache
2. **Redeploy:** Deploys → Trigger deploy → Deploy site
3. **Verifica logs:** Deploys → [último deploy] → Deploy log

¡Tu aplicación debería funcionar perfectamente después de estos pasos! 🎉 