# Especificación: Pantalla de inicio del administrador (landing)

Versión: 1.0 · Estado: propuesta para diseño y desarrollo
Alcance: pantalla de inicio del panel de administración del POS.

---

## 1. Objetivo de negocio

Cuando el administrador entra al sistema, en menos de 5 segundos debe poder responder tres preguntas:

1. **¿Qué tengo que reabastecer?** Productos sin stock o con poca existencia.
2. **¿Qué conviene promocionar?** Productos que se venden bien y ofertas que siguen vigentes.
3. **¿Qué entró nuevo al catálogo?** Para verificar que la carga de productos quedó bien.

Métricas de éxito (propuestas, a validar con el negocio):

| Indicador | Meta inicial |
| --- | --- |
| Tiempo para identificar un producto a reabastecer | < 5 s |
| Clics para pasar de la landing a editar un producto | ≤ 2 |
| Uso de la landing como primera pantalla (sesiones admin) | > 80 % |

---

## 2. Usuarios y contexto

- **Usuario principal:** administrador de la tienda (rol `admin`). Usa la app en escritorio durante el día y en el móvil para revisar stock fuera de la tienda.
- **Contexto de uso:** consulta rápida entre ventas, no análisis profundo. Cada visita dura entre 30 segundos y 2 minutos.
- **Cajeros (rol `cashier`):** no ven esta landing. Siguen entrando a la tienda (`/`), que no cambia.

---

## 3. Supuestos

Estos supuestos son necesarios para avanzar. Si alguno cambia, la especificación se ajusta.

| # | Supuesto | Por qué importa | Si es falso |
| --- | --- | --- | --- |
| S1 | El catálogo tiene menos de 500 productos. Hoy son 40. | Define si la lista completa cabe en memoria y en una pantalla. | Paginar y buscar en el servidor. |
| S2 | Hay menos de 10 000 ventas por mes. | Define el costo de agregar ventas por rango de fechas. | Mantener un documento de agregados diarios. |
| S3 | El umbral de "poco stock" es de 3 unidades, igual que hoy en la tienda. | Define qué aparece en "Reabastecer". | Hacerlo configurable en `shared/constants.js`. |
| S4 | "Más vendidos" se calcula sobre los últimos 30 días. | Una ventana fija evita leer toda la historia. | Otro rango configurable. |
| S5 | No existen ofertas en el sistema. Se propone un modelo mínimo (sección 7). | Sin datos de ofertas, el bloque no puede mostrar nada real. | Si ya tienen ofertas en otro sistema, habría que integrarlas. |
| S6 | El negocio es una sola tienda y una sola moneda (MXN). | Evita selector de tienda y conversiones. | Agregar selector de tienda. |
| S7 | El administrador no necesita reportes exportables ni gráficas históricas en esta pantalla. | Mantiene la landing enfocada en acciones. | Reportes en una pantalla aparte. |
| S8 | El stack se mantiene: Vue 3, Pinia, Tailwind, API Express y Firestore. | No se introducen librerías de gráficas en esta versión. | Se evalúa una librería de gráficas solo si S7 cambia. |

---

## 4. Principios de diseño

1. **Acción antes que métrica.** Cada bloque termina en una acción concreta (editar, reabastecer, promocionar).
2. **Lo urgente arriba.** El orden refleja la frecuencia con que el administrador necesita cada dato.
3. **Un bloque, una pregunta.** Ningún bloque mezcla dos objetivos.
4. **Cargar por partes.** Un bloque que falla no oculta los demás.
5. **Reutilizar lo existente.** Tarjetas, colores y estados de la tienda y del admin, sin estilos nuevos.

---

## 5. Arquitectura de información

- **Ruta nueva:** `/admin/inicio`. Se convierte en la ruta por defecto del panel. Hoy `/admin` redirige a `/admin/productos`; el cambio es solo la redirección.
- **Navegación del admin:** agregar la pestaña "Inicio" como primera opción. Orden: Inicio · Productos · Ventas.
- **Fuera de alcance de la landing:** crear productos, editar precios y registrar ventas. Se accede a ellos mediante acciones de los bloques.

---

## 6. Información y orden de los bloques

El orden se justifica por frecuencia de uso y urgencia.

| Orden | Bloque | Pregunta que responde | Prioridad |
| --- | --- | --- | --- |
| 1 | Resumen del día | ¿Cómo va hoy? | Contexto, siempre visible |
| 2 | Reabastecer | ¿Qué me puede dejar sin venta? | Urgente |
| 3 | Más vendidos | ¿Qué debo promocionar? | Alta |
| 4 | Ofertas vigentes | ¿Qué promoción está activa? | Alta (depende de S5) |
| 5 | Últimos agregados | ¿Entró bien lo que cargué? | Media |

### 6.1 Resumen del día (obligatorio, contexto)

**Propósito:** dar contexto antes de las acciones.

**Datos:**
- Ventas de hoy: número de ventas y total cobrado (`dateKey` = hoy en `TIMEZONE`).
- Productos sin stock: conteo de productos con `availability = 0`.
- Productos con poco stock: conteo con `availability` ≤ 3.

**Acciones:** cada indicador es un enlace a su bloque correspondiente (sin stock y poco stock llevan a Reabastecer).

**Por qué aporta valor:** resume la salud del negocio en tres números y evita que el administrador escanee toda la pantalla.

**Escritorio:** fila de 3 tarjetas. **Móvil:** 3 tarjetas en fila compacta, en 2 columnas si no caben.

### 6.2 Reabastecer (obligatorio, urgente)

**Propósito:** que el administrador vea de inmediato qué puede agotarse o ya está agotado.

**Datos:** productos con `availability` ≤ 3 (S3), ordenados primero los que tienen 0.

**Campos por fila:** imagen miniatura, nombre, existencia actual con color (rojo = 0, ámbar = 1 a 3), categoría.

**Acciones:**
- **Reabastecer** → abre la edición del producto con el foco en el campo "Disponibilidad". Requiere la edición existente; no crea un ajuste rápido en esta versión.
- Un enlace secundario "Ver todos" lleva al inventario filtrado por stock bajo (ver sección 9).

**Estados:**
- Cargando: 3 filas esqueleto.
- Vacío (sin productos con poco stock): "Todo el inventario está por encima de 3 unidades." Icono de confirmación, no de alerta.
- Error: "No pudimos cargar el inventario." con botón Reintentar.

**Por qué aporta valor:** convierte la falta de stock en una acción directa antes de perder una venta.

### 6.3 Más vendidos (obligatorio, promocionar)

**Propósito:** identificar los productos con más unidades vendidas para decidir qué mostrar o promocionar.

**Datos:** agregado de `items` de las ventas de los últimos 30 días (S4), sumando `quantity` por `id`. Top 5.

**Campos por fila:** posición (1 a 5), imagen, nombre, unidades vendidas, ingresos del periodo.

**Acciones:**
- **Promocionar** → crea una oferta con ese producto (ver sección 7). Mientras no exista el modelo de ofertas, la acción queda deshabilitada con la leyenda "Próximamente".
- **Editar** → abre la edición del producto.

**Estados:**
- Cargando: 5 filas esqueleto.
- Vacío (sin ventas en 30 días): "Aún no hay ventas en los últimos 30 días." con enlace "Ir a la tienda".
- Error: mensaje y Reintentar, sin afectar a otros bloques.

**Por qué aporta valor:** muestra lo que el cliente ya compra, base para decidir promociones sin adivinar.

### 6.4 Ofertas vigentes (obligatorio, promocionar)

**Propósito:** que el administrador vea qué promociones están activas hoy y cuándo terminan.

**Datos:** ofertas con estado activo y fecha actual dentro de su vigencia (modelo de la sección 7).

**Campos por tarjeta:** nombre de la oferta, producto o categoría, descuento, vigencia ("Termina en 3 días"), código de cupón asociado.

**Acciones:**
- **Editar** → abre la oferta (fuera de alcance de esta landing; se define en la especificación de ofertas).
- **Desactivar** → requiere confirmación.

**Estados:**
- Cargando: 2 tarjetas esqueleto.
- Vacío: "No hay ofertas activas." con CTA "Crear oferta" si el módulo existe; si no existe, solo el texto informativo.
- Por vencer (menos de 48 h): etiqueta ámbar "Vence pronto".
- Error: mensaje y Reintentar.

**Por qué aporta valor:** evita que una promoción vencida siga activa sin que nadie lo note.

### 6.5 Últimos agregados (obligatorio, verificar)

**Propósito:** confirmar que los productos recién cargados aparecieron correctamente en el catálogo.

**Datos:** los 6 productos con `createdAt` más reciente.

**Campos por tarjeta:** imagen, nombre, precio, existencia, fecha de alta ("Hace 2 días").

**Acciones:** **Editar** y **Ver en tienda** (abre la tienda en una pestaña nueva con la búsqueda por nombre aplicada).

**Estados:**
- Cargando: 6 tarjetas esqueleto.
- Vacío: "Todavía no has agregado productos." con CTA "Agregar producto".
- Error: mensaje y Reintentar.

**Por qué aporta valor:** valida la carga de inventario sin tener que buscar en el catálogo completo.

---

## 7. Modelo de ofertas (propuesta para cubrir S5)

Hoy los cupones (`server/src/config/coupons.js`) solo tienen código, porcentaje y bandera `active`. Para que "Ofertas vigentes" tenga datos reales, se propone extenderlos:

```js
{
  code: "VERANO10",          // código que aplica el cliente
  name: "Verano 10 %",       // nombre visible para el administrador
  percentage: 0.1,
  active: true,
  startsAt: "2026-06-01",    // YYYY-MM-DD, inicio inclusivo
  endsAt: "2026-08-31",      // YYYY-MM-DD, fin inclusivo
  productIds: []             // vacío = aplica a todo el catálogo
}
```

Reglas:
- Una oferta está vigente si `active` es verdadero y la fecha actual en `TIMEZONE` está entre `startsAt` y `endsAt`.
- El servidor es la fuente de verdad (ya es así para los cupones). La landing solo muestra.
- Esta propuesta no modifica el cálculo de totales. Solo agrega fechas y alcance.

**Alternativa si no quieren cambiar la configuración:** guardar ofertas en una colección `offers` con CRUD en el admin. Más trabajo y, a cambio, editable sin desplegar el backend.

---

## 8. Contrato de datos (backend)

Para evitar que el cliente descargue todo el historial, se propone un endpoint agregado:

`GET /api/dashboard/summary` (solo `admin`)

Respuesta:

```json
{
  "data": {
    "generatedAt": "2026-10-29T18:00:00.000Z",
    "today": { "salesCount": 12, "total": 8450.5 },
    "stock": { "outOfStock": 2, "lowStock": 5, "lowStockThreshold": 3 },
    "lowStockProducts": [{ "id": "p1", "name": "...", "availability": 0, "image": "...", "category": 1 }],
    "topSellers": [{ "id": "p2", "name": "...", "image": "...", "unitsSold": 34, "revenue": 16966 }],
    "activeOffers": [{ "code": "VERANO10", "name": "...", "percentage": 0.1, "endsAt": "2026-08-31", "productIds": [] }],
    "recentProducts": [{ "id": "p3", "name": "...", "price": 499, "availability": 8, "createdAt": "..." }]
  }
}
```

Notas de implementación:
- `topSellers` se calcula en el servidor con una consulta de ventas por rango de `dateKey` (últimos 30 días), sumando `items`.
- Si el volumen crece (S2), mover la agregación a un documento diario `dailySummaries/{dateKey}` actualizado en la misma transacción del checkout.
- Los bloques pueden cargar por separado si se prefiere. La recomendación es un solo endpoint para reducir peticiones en móvil.

---

## 9. Diseño responsivo

### Escritorio (≥ 1024 px)

```text
┌────────────────────────────────────────────────────────────┐
│ Header: Logo · Inicio · Productos · Ventas · Cuenta        │
├────────────────────────────────────────────────────────────┤
│ Hola, Admin · Jueves 29 oct · Actualizado hace 1 min       │
│ [ Ventas hoy ]   [ Sin stock ]   [ Poco stock ]            │
├───────────────────────────────┬────────────────────────────┤
│ Reabastecer (urgente)         │ Más vendidos (30 días)     │
│ fila · fila · fila · ver todos│ 1 · 2 · 3 · 4 · 5          │
├───────────────────────────────┼────────────────────────────┤
│ Ofertas vigentes              │ (espacio libre)            │
├───────────────────────────────┴────────────────────────────┤
│ Últimos agregados  [tarjeta][tarjeta][tarjeta][tarjeta]…   │
└────────────────────────────────────────────────────────────┘
```

- Contenido máximo de 1280 px, como el resto de la app.
- Columna izquierda 3/5 y derecha 2/5 en la zona de bloques.
- "Últimos agregados" ocupa el ancho completo en una fila de 6 tarjetas (o 4 si el ancho es menor).

### Móvil (< 640 px)

Una sola columna, en el orden de la sección 6:

1. Resumen en 2 columnas (Ventas hoy ocupa el ancho completo).
2. Reabastecer: lista compacta, máximo 5 filas y "Ver todos".
3. Más vendidos: lista compacta, máximo 5.
4. Ofertas: tarjetas apiladas.
5. Últimos agregados: carrusel horizontal con scroll táctil.

Navegación: el encabezado se convierte en barra inferior con 3 iconos (Inicio, Productos, Ventas). Esta barra reemplaza al menú superior.

Diferencias clave:
- En móvil no se muestra el cálculo del "Actualizado hace X" en el encabezado; va debajo del título.
- Las acciones pasan a ser botones de al menos 44 px de alto.
- Se muestran menos filas por bloque (5 en lugar de 10) para conservar el scroll útil.

---

## 10. Estados globales

| Estado | Comportamiento |
| --- | --- |
| Primera carga | Esqueleto en cada bloque. El resumen aparece primero. |
| Refresco | Botón "Actualizar" en el encabezado. Los datos anteriores se mantienen visibles mientras carga. |
| Error parcial | Solo el bloque afectado muestra error y Reintentar. |
| Error total | Banner en la parte superior: "No pudimos cargar el inventario. Revisa tu conexión." |
| Negocio nuevo | Si no hay productos, la landing muestra un solo mensaje grande: "Empieza agregando tu primer producto", con botón. Los bloques se ocultan. |
| Sin sesión admin | Redirige a login, como hoy. |

Regla de datos antiguos: si los datos tienen más de 10 minutos, mostrar "Actualizado hace X" en amarillo.

---

## 11. Accesibilidad

- Cada bloque es una sección con encabezado (`h2`) y `aria-labelledby`.
- Los estados de carga usan `aria-busy` y los errores usan `role="alert"`.
- Los indicadores de color (rojo/ámbar) siempre llevan texto, no solo color.
- Contraste mínimo WCAG AA en todas las etiquetas.
- Orden de tabulación igual al orden visual.
- Respetar `prefers-reduced-motion` (ya configurado en `main.css`).

---

## 12. Analítica (propuesta)

Eventos a registrar para validar las métricas de la sección 1:

| Evento | Cuándo |
| --- | --- |
| `home_viewed` | Entra a la landing |
| `home_block_action` | Clic en una acción de un bloque (incluye `block` y `action`) |
| `home_restock_clicked` | Clic en Reabastecer |
| `home_empty_cta_clicked` | Clic en un CTA de estado vacío |

No se registran datos de clientes finales. Solo acciones del administrador.

---

## 13. Criterios de aceptación

1. Al entrar como admin se muestra `/admin/inicio` con los cinco bloques en el orden indicado.
2. El resumen del día coincide con la pantalla de Ventas para la misma fecha.
3. Los productos con 0 o 1 a 3 unidades aparecen en Reabastecer, con 0 primero.
4. El top 5 de "Más vendidos" coincide con el cálculo manual sobre las ventas de 30 días.
5. Una oferta vencida no aparece en "Ofertas vigentes".
6. Si falla un bloque, los demás siguen mostrando datos.
7. En móvil, la navegación inferior es visible sin hacer scroll.
8. Todos los estados (carga, vacío, error) están implementados en los cinco bloques.
9. No se muestran precios ni datos de clientes en la landing más allá de los necesarios.

---

## 14. Fuera de alcance (esta versión)

- Gráficas históricas y reportes exportables.
- Ajuste rápido de stock desde la landing (requiere endpoint dedicado).
- Crear o editar ofertas (se especifica por separado).
- Comparativas entre periodos.
- Multitienda.

---

## 15. Dependencias y preguntas abiertas

| # | Pregunta | Quién responde | Impacto |
| --- | --- | --- | --- |
| P1 | ¿Ya existen ofertas o promociones fuera del sistema? | Negocio | Define el modelo de la sección 7. |
| P2 | ¿El umbral de poco stock (3) es correcto? | Negocio | Ajusta la sección 6.2. |
| P3 | ¿Los cajeros deben ver alguna información de esta landing? | Negocio | Ajusta roles y rutas. |
| P4 | ¿Cuántas ventas por mes se esperan en el primer año? | Negocio | Confirma S2 y la necesidad de agregados diarios. |
| P5 | ¿Se requiere ajuste rápido de stock desde la landing? | Producto | Agrega endpoint y componente dedicado. |

Dependencias técnicas:
- Endpoint `GET /api/dashboard/summary` (sección 8).
- Modelo de ofertas (sección 7), si se aprueba.
- Ruta `/admin/inicio` y pestaña "Inicio" en `AdminNav`.
- Componentes existentes reutilizables: `StateMessage`, `RetryBanner`, `ProductCard` (versión compacta nueva), `ProductRow`.

---

## 16. Orden sugerido de implementación

1. Endpoint `GET /api/dashboard/summary` con pruebas de agregación y de ventana de 30 días.
2. Ruta `/admin/inicio` con el resumen del día y el bloque Reabastecer (los datos ya existen).
3. Bloque Últimos agregados (datos existentes).
4. Bloque Más vendidos (depende del endpoint).
5. Modelo de ofertas y bloque Ofertas vigentes (depende de P1).
6. Analítica y ajustes de accesibilidad.
