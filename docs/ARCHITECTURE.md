# Arquitectura

## Visión general

El proyecto es una SPA Vue que consume una API Express. Firebase se usa como infraestructura (Auth, Firestore y Storage), pero **solo el backend habla con Firestore y con la cuenta de servicio**. El navegador se autentica con Firebase Auth y envía el ID token en cada request protegida.

```text
┌──────────────────────────────┐
│ Navegador (Vue 3 + Pinia)    │
│  vistas → stores → src/api   │
└──────────────┬───────────────┘
               │ HTTPS + Bearer <ID token>
┌──────────────▼───────────────┐
│ API Express                  │
│  routes → controllers →      │
│  services → repositories     │
└──────┬───────────────┬───────┘
       │               │
┌──────▼──────┐  ┌─────▼──────────────┐
│ Firestore   │  │ Firebase Auth      │
│ (Admin SDK) │  │ (verificación JWT) │
└─────────────┘  └────────────────────┘
       │
┌──────▼──────────────┐
│ Firebase Storage    │
│ (Admin SDK + rules) │
└─────────────────────┘
```

## Capas

### Frontend (`src/`)

| Carpeta | Responsabilidad |
| --- | --- |
| `views/` | Páginas y composición de la UI. Sin acceso directo a Firebase ni `fetch`. |
| `components/` | Componentes reutilizables y sin estado global propio. |
| `stores/` | Estado Pinia y flujos del cliente (carrito, auth, catálogo, ventas). |
| `api/` | Funciones por dominio sobre `client.js`. |
| `composables/` | Lógica reutilizable con estado local (subida de imágenes, moneda). |
| `utils/` | Formateo de fechas/moneda y generación de UUID. |
| `config/` | Inicialización de Firebase y conexión a emuladores. |
| `router/` | Rutas y guards de autenticación/rol. |

Regla práctica: **una vista no llama a `fetch` ni a Firestore**. Habla con un store; el store habla con `src/api`.

### Backend (`server/src/`)

| Capa | Responsabilidad | No debe hacer |
| --- | --- | --- |
| `routes/` | Definir endpoints, middlewares y orden de guards. | Contener reglas de negocio. |
| `controllers/` | Traducir HTTP ↔ servicios y elegir status codes. | Consultar Firestore. |
| `services/` | Reglas de negocio, validaciones de dominio y composición. | Conocer `req`/`res`. |
| `repositories/` | Única puerta a Firestore. Normalizar documentos. | Decidir reglas de negocio. |
| `schemas/` | Validación de entrada con Zod. | Acceder a datos. |
| `middleware/` | Auth, validación, rate limit, errores, request id. | Implementar dominio. |

### Código compartido (`shared/`)

- `constants.js`: impuestos, límite de unidades, moneda, locale, zona horaria, categorías y validaciones de imagen.
- `pricing.js`: `calculateTotals`, redondeo y normalización numérica.

Frontend y backend importan **el mismo archivo** mediante el alias `@shared` (Vite) y rutas relativas (Node). Esto evita que el carrito muestre un total distinto al que registra el servidor.

## Flujo de una venta

1. `ShopView` carga productos con `productsStore.fetchProducts()` y reconcilia el carrito (`cartStore.syncWithProducts`).
2. Al agregar un producto, el carrito guarda `id`, `name`, `price`, `image`, `availability` y `quantity`.
3. Los totales se recalculan en el cliente con `shared/pricing.js` usando `taxRate` de `GET /api/config` y el cupón validado por `POST /api/coupons/validate`.
4. Al confirmar, `cartStore.checkout()`:
   - exige sesión activa;
   - genera un `checkoutId` UUID si no existe;
   - envía solo `id` y `quantity` por producto (nunca precios);
   - reutiliza el mismo `checkoutId` en reintentos.
5. El backend:
   - valida el body con Zod;
   - verifica el ID token y obtiene `uid` y `role`;
   - relee los productos desde Firestore;
   - valida cantidades contra `MAX_ITEM_QUANTITY`;
   - recalcula precios y totales con los datos reales;
   - resuelve el cupón en el servidor;
   - ejecuta una transacción que valida stock y precio, descuenta inventario y crea la venta.
6. Si todo va bien, el carrito se vacía y se refresca el inventario. Si falla, se conserva el carrito y se muestra el error.

### Garantías del checkout

- **Atomicidad:** la venta y el descuento de stock se escriben en la misma transacción de Firestore. No puede quedar stock descontado sin venta ni venta sin stock descontado.
- **Idempotencia:** el documento de venta usa `checkoutId` como ID. Un reintento con el mismo ID devuelve la venta existente (`meta.duplicate: true`, HTTP 200). Si el ID pertenece a otro usuario, responde `CHECKOUT_ID_CONFLICT`.
- **Consistencia de precio:** si el precio actual difiere del mostrado, responde `PRICE_CHANGED` y no cobra.
- **Consistencia de stock:** si no alcanza, responde `INSUFFICIENT_STOCK` con el disponible real.
- **Propiedad:** una venta solo puede ser consultada por fecha a través del panel admin; el `createdBy` queda registrado.

## Modelo de datos

### `products/{productId}`

```js
{
  name: string,
  price: number,
  availability: number,
  category: number,        // 1 | 2 | 3
  image: string,           // URL pública de Storage o ""
  imagePath: string,       // "products/<uuid>.<ext>" o ""
  createdAt: string,       // ISO
  updatedAt: string        // ISO
}
```

### `sales/{checkoutId}`

```js
{
  items: [{ id, name, price, quantity, image }],
  subtotal: number,
  discount: number,
  taxes: number,
  total: number,
  couponCode: string | null,
  discountPercentage: number, // 0.1 = 10 %
  createdAt: string,          // ISO
  dateKey: string,            // YYYY-MM-DD en TIMEZONE
  createdBy: string           // uid de Firebase Auth
}
```

Las ventas antiguas guardaban `createdAt` como `dd/mm/yyyy`. El script `npm run migrate:sales` las normaliza a ISO y calcula `dateKey`.

### `dailySummaries/{dateKey}`

Resumen de un día, mantenido por el checkout dentro de la misma transacción que la venta:

```js
{
  dateKey: "2026-10-29",
  salesCount: 12,
  totalCents: 845050,          // dinero en centavos enteros, sin errores de punto flotante
  products: {
    "<productId>": { units: 3, revenueCents: 14700 }   // ingresos brutos por producto
  },
  updatedAt: "..."
}
```

Por qué existe: el dashboard y el ranking de "más vendidos" necesitan agregados de 30 días. Con 10 000 ventas al mes, sumar desde `sales` costaría miles de lecturas en cada visita. Con este documento, son como máximo 30 lecturas pequeñas.

Consideraciones:
- Cada venta escribe en el documento de su día. Con el volumen esperado (≈ 330 ventas al día en promedio) la contención es baja. Si el negocio crece por encima de unas decenas de ventas por minuto, conviene dividir el contador en subdocumentos por bloque de tiempo.
- Ventas anteriores a este cambio no están en los resúmenes. Para generarlos: `npm run migrate:sales` (si hay fechas antiguas) y luego `npm run backfill:summaries -- --apply`. El backfill reescribe cada día desde cero, así que puede repetirse sin duplicar cifras. Ejecútalo con poco tráfico, porque una venta registrada durante el proceso puede no entrar.

## Seguridad

- **Firestore cerrado al cliente:** `firestore.rules` deniega toda lectura/escritura directa. Toda operación pasa por la API.
- **Autenticación:** el backend verifica el ID token con `verifyIdToken(token, true)`; los tokens revocados o expirados se rechazan.
- **Autorización:** los endpoints de administración exigen el claim `role: "admin"`. `requireRole` se aplica después de `requireAuth`.
- **Custom claims:** `npm run set-role` asigna `admin` o `cashier`. El frontend solo usa el rol para navegación; el backend siempre revalida.
- **Storage:** lectura pública de imágenes, escritura solo para `admin` (reglas de Storage). Las rutas de imagen deben empezar con `products/` y no contener `..` ni `\`.
- **Validación:** Zod valida body, params y query; los schemas usan `.strict()` para rechazar campos inesperados.
- **Rate limiting:** límite general por IP y límites más estrictos para checkout y cupones.
- **Cabeceras:** Helmet, CORS con orígenes explícitos, `x-powered-by` deshabilitado y body limitado a 100 kB.
- **Errores:** en producción los errores 500 no exponen detalles internos; todos incluyen `requestId` para trazabilidad.
- **Secretos:** credenciales solo en `server/.env` o variables del entorno. `.env` está ignorado por Git.

## Manejo de errores

Formato uniforme:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para \"Sudadera\". Disponible: 2",
    "details": { "productId": "abc", "available": 2, "requested": 3 },
    "requestId": "..."
  }
}
```

- Los errores operativos usan `AppError` y son seguros de mostrar.
- Los errores inesperados se registran con Pino y se devuelven como `INTERNAL_ERROR`.
- `src/api/client.js` normaliza timeout, fallo de red y errores HTTP en una sola clase `ApiError`.
- Un 401 dispara `pos:unauthorized`, que cierra la sesión local. Los flujos que requieren sesión redirigen al login.
- Los stores conservan datos previos si un refresco falla y muestran un banner de reintento (`RetryBanner`).

## Decisiones y tradeoffs

| Decisión | Motivo | Coste |
| --- | --- | --- |
| API Express en lugar de acceso directo a Firestore | Permite validar precios/stock, aplicar roles y mantener secretos fuera del cliente | Un servicio más que desplegar |
| Quitar VueFire | El acceso directo desde el navegador impedía garantizar consistencia y seguridad | Se pierde la suscripción en tiempo real; se usa refresco explícito |
| Cupones en `server/src/config/coupons.js` | No requiere panel ni colección nueva; el servidor es la fuente de verdad | Cambiar cupones requiere redeploy del backend |
| Subida de imágenes desde el cliente | Evita enviar binarios a la API y aprovecha Storage | Depende de reglas de Storage correctas |
| `checkoutId` generado en el cliente | Permite reintentos seguros sin coordinación extra | Requiere UUID y validación estricta |
| Cálculo de totales compartido | Una sola fórmula para UI y servidor | El código compartido debe ser compatible con ambos entornos |
| Categorías e impuestos en configuración | Evita hardcodear reglas en múltiples lugares | No son editables desde la UI |

## Testing

Vitest cubre la lógica que más riesgo tiene:

- `shared/pricing.test.js`: redondeo, descuentos, impuestos y entradas inválidas.
- `server/src/services/coupon.service.test.js`: normalización y cupones inactivos.
- `server/src/services/product.service.test.js`: limpieza de imágenes y errores.
- `server/src/services/sale.service.test.js`: cantidades, productos inexistentes y totales.
- `server/src/schemas/*.test.js`: validación de payloads.
- `server/src/utils/date.test.js`: fechas legacy, ISO y `dateKey` por zona horaria.

Los repositorios de Firestore no se testean con emulador en CI; se validan manualmente con los emuladores.

## Próximos pasos

1. Tests de integración con el emulador de Firestore para el checkout transaccional.
2. Panel de cupones y configuración de impuestos en Firestore.
3. Recibos en PDF y facturación fiscal.
4. Integración con pasarela de pagos.
5. Multitienda y multimoneda.
6. Auditoría de movimientos de inventario.
7. Recuperación de contraseña y gestión de usuarios desde la UI.
8. Observabilidad: métricas, trazas y alertas.
