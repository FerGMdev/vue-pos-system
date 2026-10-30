# API

API HTTP del POS. Todas las rutas cuelgan de `/api`.

- **Desarrollo:** `http://localhost:3000/api`
- **Frontend:** `VITE_API_URL` o el proxy de Vite (`/api` → `http://localhost:3000`)

## Convenciones

### Formato de respuesta

Las respuestas exitosas envuelven el resultado en `data`:

```json
{ "data": { } }
```

Los errores usan un único formato:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos",
    "details": [{ "path": "items.0.quantity", "message": "..." }],
    "requestId": "8f0c..."
  }
}
```

`details` es opcional. `requestId` aparece en todos los errores y también en la cabecera `X-Request-Id` de cada respuesta.

### Autenticación

Las rutas protegidas requieren un ID token de Firebase:

```http
Authorization: Bearer <idToken>
```

El backend verifica el token y resuelve el rol desde el custom claim `role` (`admin` o `cashier`).

### Códigos de error frecuentes

| Código | HTTP | Significado |
| --- | --- | --- |
| `AUTH_REQUIRED` | 401 | Falta el header `Authorization` o el token |
| `INVALID_TOKEN` | 401 | Token inválido |
| `TOKEN_EXPIRED` | 401 | Token expirado; hay que renovarlo o volver a iniciar sesión |
| `ROLE_REQUIRED` | 403 | El usuario no tiene el rol necesario |
| `CORS_NOT_ALLOWED` | 403 | Origen no permitido |
| `VALIDATION_ERROR` | 400 | Body, params o query inválidos |
| `INVALID_JSON` | 400 | El body no es JSON válido |
| `INVALID_COUPON` | 400 | Cupón inexistente o inactivo |
| `EMPTY_CART` | 400 | Checkout sin items |
| `QUANTITY_LIMIT_EXCEEDED` | 400 | Cantidad fuera de rango |
| `PRODUCT_NOT_FOUND` | 404 / 409 | Producto inexistente |
| `INSUFFICIENT_STOCK` | 409 | Stock insuficiente |
| `PRICE_CHANGED` | 409 | El precio cambió desde que se cargó el carrito |
| `CHECKOUT_ID_CONFLICT` | 409 | El `checkoutId` ya lo usó otro usuario |
| `RATE_LIMITED` | 429 | Límite general excedido |
| `CHECKOUT_RATE_LIMITED` | 429 | Límite de checkouts excedido |
| `COUPON_RATE_LIMITED` | 429 | Límite de validaciones de cupón excedido |
| `ROUTE_NOT_FOUND` | 404 | Ruta inexistente |
| `INTERNAL_ERROR` | 500 | Error inesperado (sin detalles en producción) |

### Rate limits

| Ámbito | Límite por defecto |
| --- | --- |
| General (por IP) | `RATE_LIMIT_MAX` cada `RATE_LIMIT_WINDOW_MS` |
| Checkout | `CHECKOUT_RATE_LIMIT_MAX` por ventana |
| Cupones | 20 por ventana |

Los límites se desactivan cuando `NODE_ENV=test`.

## Endpoints

### `GET /health`

Público. Estado del servicio.

```json
{
  "data": {
    "status": "ok",
    "uptime": 42,
    "timestamp": "2026-10-29T12:00:00.000Z"
  }
}
```

### `GET /config`

Público. Configuración de negocio que el frontend necesita para calcular totales y categorías.

```json
{
  "data": {
    "taxRate": 0.1,
    "maxItemQuantity": 5,
    "currency": "MXN",
    "locale": "es-MX",
    "timezone": "America/Mexico_City",
    "categories": [{ "id": 1, "name": "Sudadera" }]
  }
}
```

### `GET /auth/me`

Requiere autenticación. Devuelve la identidad resuelta por el backend.

```json
{
  "data": {
    "uid": "abc123",
    "email": "admin@ejemplo.com",
    "role": "admin"
  }
}
```

`role` puede ser `null` si el usuario no tiene claim.

## Productos

### `GET /products`

Público. Devuelve todos los productos ordenados por categoría y nombre.

```json
{
  "data": [
    {
      "id": "p1",
      "name": "Sudadera negra",
      "price": 499,
      "availability": 8,
      "category": 1,
      "image": "https://...",
      "imagePath": "products/uuid.jpg",
      "createdAt": "2026-10-01T10:00:00.000Z",
      "updatedAt": "2026-10-01T10:00:00.000Z"
    }
  ]
}
```

### `GET /products/:id`

Público. Devuelve un producto o `404 PRODUCT_NOT_FOUND`.

### `POST /products`

Requiere rol `admin`. Crea un producto.

```json
{
  "name": "Sudadera negra",
  "price": 499,
  "availability": 8,
  "category": 1,
  "image": "https://...",
  "imagePath": "products/uuid.jpg"
}
```

Reglas:

- `name`: 2–120 caracteres.
- `price`: número finito > 0 y ≤ 1 000 000.
- `availability`: entero entre 0 y 1 000 000.
- `category`: debe existir en `PRODUCT_CATEGORIES`.
- `image`: URL válida (≤ 2048) o `""`.
- `imagePath`: debe cumplir `^products/[A-Za-z0-9._-]+$` o ser `""`.
- No se aceptan campos extra (`.strict()`).

Respuesta: `201` con el producto creado.

### `PATCH /products/:id`

Requiere rol `admin`. Actualiza solo los campos enviados (al menos uno). Si cambia `imagePath`, el backend elimina la imagen anterior de Storage.

Respuesta: `200` con el producto actualizado.

### `DELETE /products/:id`

Requiere rol `admin`. Elimina el producto y su imagen asociada.

Respuesta: `204` sin body.

## Cupones

### `POST /coupons/validate`

Público. Valida un código y devuelve su descuento. El porcentaje real siempre lo decide el servidor.

```json
{ "code": "10DESCUENTO" }
```

```json
{
  "data": {
    "code": "10DESCUENTO",
    "percentage": 0.1,
    "discountPercentage": 10
  }
}
```

Cupones incluidos: `10DESCUENTO`, `20DESCUENTO`, `30DESCUENTO`. Se editan en `server/src/config/coupons.js`.

## Ventas

### `POST /sales/checkout`

Requiere autenticación (cualquier usuario con sesión). Registra una venta y descuenta stock de forma atómica.

```json
{
  "checkoutId": "3f1c2b8e-6a1f-4f6e-9c1d-2b7a9e0d4c11",
  "items": [
    { "id": "p1", "quantity": 2 }
  ],
  "couponCode": "10DESCUENTO"
}
```

Reglas:

- `checkoutId`: UUID válido. Es la clave de idempotencia.
- `items`: 1–50 productos distintos, sin IDs repetidos.
- `quantity`: entero entre 1 y `MAX_ITEM_QUANTITY`.
- `couponCode`: opcional, ≤ 50 caracteres.
- El cliente **no envía precios**; el servidor los relee.

Respuesta `201` (venta nueva):

```json
{
  "data": {
    "id": "3f1c2b8e-...",
    "items": [
      { "id": "p1", "name": "Sudadera negra", "price": 499, "quantity": 2, "image": "" }
    ],
    "subtotal": 998,
    "discount": 99.8,
    "taxes": 89.82,
    "total": 988.02,
    "couponCode": "10DESCUENTO",
    "discountPercentage": 0.1,
    "createdAt": "2026-10-29T18:00:00.000Z",
    "dateKey": "2026-10-29",
    "createdBy": "abc123"
  },
  "meta": { "duplicate": false }
}
```

Respuesta `200` en un reintento con el mismo `checkoutId` y el mismo usuario:

```json
{ "data": { "...": "venta existente" }, "meta": { "duplicate": true } }
```

Errores de negocio habituales:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para \"Sudadera negra\". Disponible: 1",
    "details": { "productId": "p1", "productName": "Sudadera negra", "available": 1, "requested": 2 },
    "requestId": "..."
  }
}
```

```json
{
  "error": {
    "code": "PRICE_CHANGED",
    "message": "El precio de \"Sudadera negra\" cambió. Actualiza el carrito e intenta de nuevo.",
    "details": { "productId": "p1", "previousPrice": 499, "currentPrice": 549 },
    "requestId": "..."
  }
}
```

### `GET /sales?date=YYYY-MM-DD`

Requiere rol `admin`. Devuelve las ventas de un día, ordenadas de más reciente a más antigua.

```json
{
  "data": [
    {
      "id": "3f1c2b8e-...",
      "items": [{ "id": "p1", "name": "Sudadera negra", "price": 499, "quantity": 2, "image": "" }],
      "subtotal": 998,
      "discount": 99.8,
      "taxes": 89.82,
      "total": 988.02,
      "couponCode": "10DESCUENTO",
      "discountPercentage": 0.1,
      "createdAt": "2026-10-29T18:00:00.000Z",
      "dateKey": "2026-10-29",
      "createdBy": "abc123"
    }
  ]
}
```

`date` es obligatorio y debe cumplir `^\d{4}-\d{2}-\d{2}$`. El `dateKey` se calcula con la zona horaria del negocio, no con UTC.

## Dashboard

### `GET /dashboard/summary`

Requiere rol `admin`. Alimenta la pantalla de inicio del panel. Lee productos y, como máximo, 30 documentos de `dailySummaries`; nunca escanea ventas. Respuesta cacheada en memoria durante `DASHBOARD_CACHE_TTL_MS` (por defecto 60 s).

```json
{
  "data": {
    "generatedAt": "2026-10-30T00:48:48.677Z",
    "date": "2026-10-29",
    "totalProducts": 39,
    "today": { "salesCount": 1, "total": 192.5 },
    "stock": { "outOfStock": 1, "lowStock": 2, "lowStockThreshold": 3 },
    "restockProducts": [
      { "id": "p1", "name": "Sudadera", "image": "/products/producto2.jpg", "price": 29, "availability": 0, "category": 1, "createdAt": null }
    ],
    "topSellers": [
      { "id": "p2", "name": "Tenis", "image": "/products/producto4.jpg", "unitsSold": 3, "revenue": 87 }
    ],
    "topSellersPeriodDays": 30,
    "activeOffers": [
      { "code": "10DESCUENTO", "name": "Descuento 10 %", "percentage": 0.1, "discountPercentage": 10, "startsAt": null, "endsAt": null }
    ],
    "recentProducts": [
      { "id": "p3", "name": "Gorra", "image": "", "price": 20, "availability": 40, "category": 1, "createdAt": "2026-10-29T10:00:00.000Z" }
    ]
  }
}
```

Notas:
- `today.total` coincide con el "Total del día" de la pantalla de Ventas.
- `restockProducts` incluye productos con 0 a `lowStockThreshold` unidades, primero los agotados. Muestra hasta 10.
- `topSellers` suma `revenue` brutos por producto (antes de descuento e impuestos). Muestra hasta 5.
- `activeOffers` solo incluye cupones activos cuya fecha de hoy cae dentro de `startsAt`/`endsAt`. Sin fechas, son permanentes.

## Ejemplo con cURL

```bash
# Catálogo
curl http://localhost:3000/api/products

# Validar cupón
curl -X POST http://localhost:3000/api/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"10DESCUENTO"}'

# Checkout (requiere token)
curl -X POST http://localhost:3000/api/sales/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ID_TOKEN" \
  -d '{
    "checkoutId": "3f1c2b8e-6a1f-4f6e-9c1d-2b7a9e0d4c11",
    "items": [{ "id": "p1", "quantity": 1 }]
  }'
```
