# Point of Sale with Vue

Sistema de Punto de Venta (POS) construido con Vue 3, Pinia, Vue Router, Tailwind CSS, FormKit y Firebase (Firestore, Storage).

## Características

- **Inventario:** Agregar, editar y eliminar productos con imagen
- **Ventas:** Carrito de compras, cupones de descuento, cálculo de impuestos
- **Administración:** Panel para gestionar productos y ver ventas por fecha
- **Tiempo real:** Sincronización con Firestore

## Tecnologías

- [Vue 3](https://vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [VueFire](https://vuefire.vuejs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [FormKit](https://formkit.com/)
- [Vite](https://vitejs.dev/)

## Requisitos

- Node.js 18+
- Cuenta de Firebase con Firestore y Storage habilitados

## Instalación

1. Clonar el repositorio
```bash
git clone https://github.com/FerGMdev/vue-pos-system.git
cd vue-pos-system
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
Copia `.env.example` a `.env` y completa con tus credenciales de Firebase:
```bash
cp .env.example .env
```

Edita `.env` con los valores de tu proyecto Firebase (Configuración del proyecto > General > Tus apps).

4. Configurar reglas de Firebase (solo desarrollo)

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

> ⚠️ **IMPORTANTE:** Las reglas abiertas son solo para desarrollo/curso. Para producción implementa autenticación y reglas restrictivas.

5. Ejecutar en desarrollo
```bash
npm run dev
```

## Uso

- **Tienda (`/`)**: Agregar productos al carrito, aplicar cupones, realizar venta
- **Admin (`/admin`)**: Protegido por guard. Redirige a `/`. Para desarrollo en curso, comenta el guard en `src/router/index.js`

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
```

## Seguridad

- Este proyecto es educativo. Antes de comercializarlo necesitas: implementar autenticación, control de roles, reglas restrictivas de Firebase, validación server-side y auditoría de ventas.
