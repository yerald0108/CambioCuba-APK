# CambioCuba — Documentación del Proyecto

Aplicación móvil multiplataforma de intercambio P2P (peer-to-peer) de divisas para usuarios cubanos. Permite el intercambio de **CUP ↔ USDT** directamente entre personas, sin intermediarios que toquen el dinero. La app conecta compradores y vendedores, gestiona el proceso de intercambio con un chat en tiempo real y garantiza la confianza mediante verificación de identidad (KYC) y un sistema de reputación.

---

## Stack Tecnológico

| Categoría | Tecnología |
|---|---|
| Framework | React Native + Expo SDK 53 |
| Lenguaje | TypeScript (strict mode) |
| Estilos | NativeWind v4 (Tailwind para RN) |
| Estado global | Zustand v5 |
| Caché servidor | TanStack Query v5 |
| Base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth |
| Storage | Supabase Storage |
| Tiempo real | Supabase Realtime |
| Navegación | Expo Router v3 (file-based) |
| Formularios | React Hook Form + Zod |
| Iconos | Lucide React Native |
| Listas | @shopify/flash-list |
| Animaciones | React Native Reanimated v4 |
| Gestos | React Native Gesture Handler |
| Imágenes | Expo Image Picker |
| Notificaciones | Expo Notifications |
| Almacenamiento seguro | Expo SecureStore |

---

## Roles de Usuario

| Rol | Descripción |
|---|---|
| **Admin** | Panel completo dentro de la app. Login con Gmail + contraseña vía Supabase. Aprueba KYC, gestiona disputas y sanciona usuarios. |
| **Usuario** | KYC básico aprobado. Puede buscar ofertas, filtrarlas y tomar una para iniciar un intercambio. |
| **Trapichero** | KYC avanzado aprobado. Puede publicar ofertas de compra/venta además de todo lo que hace un Usuario. |

---

## Reglas de Negocio Clave

- Nadie puede tener más de **1 orden activa** a la vez (Trapichero incluido).
- Un Trapichero puede tener **N ofertas publicadas** simultáneamente.
- Cada orden tiene un **timer de 20 minutos**. Si expira, se cancela automáticamente y la oferta vuelve al mercado.
- Las **calificaciones son obligatorias** para cerrar una orden completada.
- Cualquiera puede abrir una **disputa** durante una orden — esta se bloquea hasta que el Admin intervenga.
- Las cancelaciones quedan registradas en el historial del usuario.
- La app **nunca toca el dinero** — solo conecta a las partes.

---

## Flujo de una Orden P2P

```
1. Usuario elige cantidad de USDT dentro del rango de la oferta
2. Ambos confirman "Listo" ✅  →  Inicia el timer de 20 min
3. Comprador paga por fuera de la app (Transfermóvil / EnZona / MiTransfer)
4. Comprador sube foto del comprobante en el chat de la orden
5. Vendedor confirma recibo ✅
6. Orden completada → calificación mutua obligatoria (1-5 estrellas)
```

---

## Arquitectura del Proyecto

```
cambiocuba/
├── app/                              # Expo Router — rutas file-based
│   ├── (auth)/                       # Rutas públicas (sin autenticación)
│   │   ├── _layout.tsx               # Guard: redirige si ya está autenticado
│   │   ├── login.tsx                 # ✅ Pantalla de login
│   │   └── register.tsx              # ✅ Pantalla de registro
│   ├── (app)/                        # Rutas privadas (requieren sesión)
│   │   ├── _layout.tsx               # Guard de autenticación y ban
│   │   ├── (tabs)/                   # Tab bar principal
│   │   │   ├── _layout.tsx           # Configuración de tabs con iconos Lucide
│   │   │   ├── index.tsx             # ✅ Marketplace de ofertas
│   │   │   ├── orders.tsx            # 🔲 Mis órdenes (Fase 7)
│   │   │   └── profile.tsx           # ✅ Perfil + KYC + Logout
│   │   ├── offer/
│   │   │   ├── [id].tsx              # ✅ Detalle de oferta + formulario de orden
│   │   │   └── create.tsx            # ✅ Crear oferta (solo Trapicheros)
│   │   ├── order/
│   │   │   ├── [id].tsx              # 🔲 Orden activa + chat (Fase 7)
│   │   │   └── create.tsx            # 🔲 Confirmar y crear orden (Fase 7)
│   │   └── kyc/
│   │       ├── basic.tsx             # ✅ Flujo KYC básico completo
│   │       └── advanced.tsx          # 🔲 KYC avanzado (Fase 5 — pendiente de diseño)
│   ├── (admin)/                      # Rutas exclusivas del Admin
│   │   ├── _layout.tsx               # Guard de rol admin
│   │   ├── dashboard.tsx             # 🔲 Panel admin (Fase 12)
│   │   ├── kyc-review.tsx            # 🔲 Revisión de KYC (Fase 12)
│   │   └── disputes.tsx              # 🔲 Gestión de disputas (Fase 12)
│   ├── _layout.tsx                   # ✅ Root layout con providers globales
│   └── index.tsx                     # ✅ Redirector inteligente por rol
│
└── src/
    ├── components/
    │   ├── offer/
    │   │   ├── OfferCard.tsx         # ✅ Card de oferta para el marketplace
    │   │   └── OfferFilters.tsx      # ✅ Panel de filtros con chips
    │   ├── shared/
    │   │   ├── EmptyState.tsx        # ✅ Estado vacío reutilizable
    │   │   ├── ErrorState.tsx        # ✅ Estado de error con reintento
    │   │   ├── LoadingScreen.tsx     # ✅ Pantalla de carga global
    │   │   └── NotificationToast.tsx # ✅ Sistema de toasts in-app
    │   └── ui/
    │       ├── Badge.tsx             # ✅ Etiqueta de estado (5 variantes)
    │       ├── Button.tsx            # ✅ Botón (4 variantes + loading + haptic)
    │       ├── Input.tsx             # ✅ Campo de texto con foco, error, toggle password
    │       ├── KeyboardAvoidingScreen.tsx # ✅ Wrapper para formularios con teclado
    │       ├── PhotoPicker.tsx       # ✅ Selector de fotos (cámara + galería)
    │       └── ScreenHeader.tsx      # ✅ Header de pantalla con botón atrás
    ├── constants/
    │   └── theme.ts                  # ✅ SAGRADO — Sistema de diseño completo
    ├── hooks/
    │   ├── useAuth.ts                # ✅ Hook de autenticación y logout
    │   ├── useKyc.ts                 # ✅ Hook de estado y envío KYC
    │   └── useOffers.ts              # ✅ Hook del marketplace y mis ofertas
    ├── lib/
    │   ├── queryClient.ts            # ✅ TanStack Query + QueryKeys centralizados
    │   └── supabase.ts               # ✅ Cliente Supabase con SecureStore
    ├── services/
    │   ├── auth.service.ts           # ✅ Login, registro, logout, perfil
    │   ├── kyc.service.ts            # ✅ Subida de imágenes KYC y gestión de docs
    │   └── offers.service.ts         # ✅ CRUD de ofertas con filtros
    ├── stores/
    │   ├── auth.store.ts             # ✅ Estado global de sesión + selector hooks
    │   └── notifications.store.ts    # ✅ Toasts in-app + helper notify.*
    ├── styles/
    │   └── global.css                # ✅ Punto de entrada NativeWind v4
    ├── types/
    │   ├── chat.types.ts             # ✅ ChatMessage, MessageType
    │   ├── offer.types.ts            # ✅ Offer, OfferFilters, CreateOfferForm
    │   ├── order.types.ts            # ✅ Order, OrderStatus (state machine), OrderRating
    │   └── user.types.ts             # ✅ UserProfile, UserRole, KycStatus
    └── utils/
        ├── format.ts                 # ✅ formatUSDT, formatCUP, formatRate, formatReputation...
        └── validators.ts             # ✅ Schemas Zod para auth y ofertas
```

---

## Base de Datos — Supabase

**Proyecto:** `cambiocuba` · **ID:** `mdjzjkkpbxtnuyjmzgcu` · **Región:** us-east-1

### Tablas

| Tabla | Descripción | RLS |
|---|---|---|
| `profiles` | Usuarios con rol, KYC y métricas de reputación | ✅ |
| `kyc_documents` | Documentos de verificación (fotos carnet + selfie) | ✅ |
| `offers` | Ofertas de compra/venta publicadas por Trapicheros | ✅ |
| `orders` | Órdenes P2P con state machine completa | ✅ |
| `chat_messages` | Mensajes de texto, imagen y sistema por orden | ✅ |
| `order_ratings` | Calificaciones mutuas (1-5) al completar | ✅ |
| `notifications` | Notificaciones persistidas en BD | ✅ |

### ENUMs

```sql
user_role:        admin | user | trapichero
kyc_level:        none | basic | advanced
kyc_status:       none | pending | approved | rejected
offer_type:       buy | sell
offer_status:     active | paused | in_order | completed | cancelled
order_status:     pending | both_confirmed | buyer_paid | completed |
                  disputed | cancelled | expired
message_type:     text | image | system
payment_method:   transfermovil | enzona | mitransfer
notification_type: order_created | order_confirmed | order_paid |
                   order_completed | order_cancelled | order_expired |
                   dispute_opened | dispute_resolved | kyc_approved |
                   kyc_rejected | new_message
```

### Triggers Automáticos

| Trigger | Descripción |
|---|---|
| `on_auth_user_created` | Crea el perfil en `public.profiles` al registrarse |
| `set_*_updated_at` | Actualiza `updated_at` automáticamente en todas las tablas |
| `on_order_both_confirmed` | Registra `confirmed_at` y calcula `expires_at` (+20 min) |
| `on_order_completed` | Incrementa `successful_trades` de ambos usuarios y descuenta USDT de la oferta |
| `on_order_cancelled` | Incrementa `cancelled_trades` del que canceló y libera la oferta |
| `on_kyc_status_changed` | Al aprobar KYC avanzado, cambia el `role` a `trapichero` automáticamente |

### Storage Buckets

| Bucket | Acceso | Uso |
|---|---|---|
| `kyc-documents` | Privado | Fotos de carnet e identidad |
| `payment-proofs` | Semi-privado (solo participantes) | Comprobantes de pago |
| `avatars` | Público | Fotos de perfil |

### Realtime habilitado en
`chat_messages`, `orders`, `notifications`, `offers`

---

## Sistema de Diseño — "Vault Dark"

Inspirado en el mundo financiero: oscuro y denso como una bóveda, con acentos dorados que evocan valor real.

**Archivo sagrado:** `src/constants/theme.ts` — fuente única de verdad para todos los tokens. Nunca usar valores hardcoded de color, tipografía o espaciado en los componentes.

### Paleta de colores

| Token | Valor | Uso |
|---|---|---|
| `background` | `#0A0E1A` | Fondo principal |
| `surface` | `#111827` | Cards y paneles |
| `surfaceRaised` | `#1C2536` | Inputs y elementos elevados |
| `accent` | `#F59E0B` | Dorado — CTAs, activo, ventas |
| `success` | `#10B981` | Verde — completado, compras |
| `danger` | `#EF4444` | Rojo — error, disputa |
| `warning` | `#F59E0B` | Amarillo — pendiente, timer |
| `info` | `#3B82F6` | Azul — sistema, informativo |
| `textPrimary` | `#F9FAFB` | Texto principal |
| `textSecondary` | `#9CA3AF` | Texto secundario |
| `border` | `#1F2D45` | Bordes sutiles |

---

## Variables de Entorno

Crear el archivo `.env` en la raíz del proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://mdjzjkkpbxtnuyjmzgcu.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Instalación y Configuración

```bash
# 1. Crear el proyecto
npx create-expo-app@latest cambiocuba --template blank-typescript
cd cambiocuba

# 2. Instalar dependencias
npx expo install expo-router expo-linking expo-constants expo-status-bar
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
npm install nativewind@^4.0.1
npm install --save-dev tailwindcss@3.4.0
npm install zustand @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install date-fns lucide-react-native react-native-svg
npx expo install @shopify/flash-list
npx expo install react-native-reanimated react-native-gesture-handler react-native-worklets
npx expo install expo-image-picker expo-file-system expo-image
npx expo install expo-notifications expo-device
npx expo install expo-secure-store expo-haptics expo-clipboard
npx expo install react-native-safe-area-context react-native-screens

# 3. Cambiar el main en package.json
# "main": "expo-router/entry"

# 4. Crear el archivo .env con las credenciales de Supabase

# 5. Arrancar
npx expo start --clear
```

---

## Estado del Proyecto por Fases

---

### ✅ Fase 1 — Setup + Arquitectura + Sistema de Diseño

**Objetivo:** Establecer las bases del proyecto con la arquitectura correcta desde el inicio.

**Lo que se hizo:**

- Creación del proyecto Expo con TypeScript en modo strict.
- Configuración de `babel.config.js` para NativeWind v4 (solo el preset `babel-preset-expo` con `jsxImportSource: 'nativewind'`, sin plugin separado).
- Configuración de `metro.config.js` con `withNativeWind` apuntando al CSS global.
- `tailwind.config.js` con la paleta completa "Vault Dark" sincronizada con `theme.ts`.
- `tsconfig.json` con path aliases para evitar imports relativos profundos (`@constants/`, `@lib/`, `@stores/`, `@hooks/`, etc.).
- `src/constants/theme.ts` — el archivo más importante del proyecto. Contiene todos los tokens de diseño (Colors, Typography, Spacing, BorderRadius, Shadows, Animation), clases Tailwind reutilizables (`TW`) y las constantes de negocio (métodos de pago, monedas, tipos de oferta).
- `src/lib/supabase.ts` — cliente Supabase con adaptador SecureStore para persistir tokens de forma segura.
- `src/lib/queryClient.ts` — TanStack Query con `QueryKeys` centralizados y estrategia de caché diseñada para P2P (30s stale time, no retry en mutaciones).
- `src/stores/auth.store.ts` — store Zustand con campos de estado planos y selector hooks exportados (`useIsAdmin`, `useIsTrapichero`, etc.) para evitar conflictos de tipos de TypeScript.
- `src/stores/notifications.store.ts` — sistema de toasts in-app con auto-dismiss y helper `notify.success/error/warning/info()`.
- `src/types/` — interfaces TypeScript para User, Offer, Order y Chat que reflejan exactamente la estructura de Supabase.
- `src/utils/format.ts` — helpers de formateo (formatUSDT, formatCUP, formatRate, formatReputation, formatCountdown, etc.).
- Navegación completa con Expo Router: root layout con listener de sesión Supabase, redirector inteligente por rol, guards en cada grupo de rutas y tab bar con iconos Lucide.
- `src/components/shared/NotificationToast.tsx` — sistema de notificaciones in-app animadas con borde lateral semántico.

**Archivos clave:** `theme.ts`, `supabase.ts`, `queryClient.ts`, `auth.store.ts`, `app/_layout.tsx`, `app/index.tsx`

---

### ✅ Fase 2 — Schema de Base de Datos en Supabase

**Objetivo:** Construir toda la estructura de datos con seguridad desde el inicio.

**Lo que se hizo:**

- Se eliminó el schema anterior incompleto (tablas con estructura incorrecta, ENUMs en español, campos faltantes).
- Se crearon **9 ENUMs** tipados en inglés para coincidir exactamente con los tipos TypeScript.
- Se crearon **7 tablas** con todas sus columnas, restricciones `CHECK`, índices de rendimiento y comentarios de documentación.
- La tabla `orders` implementa la **state machine completa** con los 7 estados del ciclo de vida de una orden.
- Se habilitó **Row Level Security** en todas las tablas con **24 políticas RLS** granulares (usuarios ven solo sus datos, admins ven todo, participantes de una orden ven el chat, etc.).
- Se crearon **6 funciones y triggers** automáticos:
  - `handle_new_user()` — crea el perfil al registrarse.
  - `set_updated_at()` — mantiene `updated_at` actualizado en todas las tablas.
  - `handle_order_both_confirmed()` — registra `confirmed_at` y calcula `expires_at = confirmed_at + 20 min`.
  - `handle_order_completed()` — actualiza reputación de ambos usuarios y descuenta USDT de la oferta.
  - `handle_order_cancelled()` — incrementa cancelaciones y libera la oferta.
  - `handle_kyc_approved()` — al aprobar KYC avanzado, promueve automáticamente el rol a `trapichero`.
- Se crearon **3 buckets** en Storage (`kyc-documents`, `payment-proofs`, `avatars`) con políticas de acceso correctas.
- Se habilitó **Realtime** en `chat_messages`, `orders`, `notifications` y `offers`.

**Archivos clave:** Migraciones aplicadas directamente en Supabase vía MCP.

---

### ✅ Fase 3 — Autenticación Completa

**Objetivo:** Registro, login, sesión persistente y logout funcionando end-to-end.

**Lo que se hizo:**

- `src/utils/validators.ts` — schemas Zod para registro (nombre, email, contraseña con mayúscula y número, confirmación) y login.
- `src/services/auth.service.ts` — encapsula todas las llamadas a Supabase Auth. Traduce los mensajes de error del inglés al español. Los componentes nunca llaman a Supabase directamente.
- `src/components/ui/Button.tsx` — botón reutilizable con 4 variantes (primary/secondary/danger/ghost), spinner de carga y haptic feedback con Expo Haptics.
- `src/components/ui/Input.tsx` — campo de texto con manejo de foco (borde dorado al enfocar), estado de error (borde rojo + icono + mensaje), toggle de contraseña y soporte para icono izquierdo.
- `src/components/ui/KeyboardAvoidingScreen.tsx` — wrapper que combina `KeyboardAvoidingView` + `ScrollView` para que el teclado nunca tape los campos.
- `src/components/ui/ScreenHeader.tsx` — header reutilizable con título, subtítulo opcional y botón atrás.
- `src/hooks/useAuth.ts` — hook que expone el estado del store y las acciones (logout, updateProfile) de forma conveniente.
- `src/components/shared/LoadingScreen.tsx`, `EmptyState.tsx`, `ErrorState.tsx` — estados no-happy-path listos para usar en todas las fases.
- `app/(auth)/login.tsx` — pantalla con diseño Vault Dark completo, validación en tiempo real, navegación entre campos con teclado, aviso de seguridad P2P y redirección por rol al iniciar sesión.
- `app/(auth)/register.tsx` — formulario completo con los 4 campos, validación Zod, aviso legal y link al login.
- `app/_layout.tsx` actualizado con `LoadingScreen` durante la verificación de sesión y listener de eventos de Supabase Auth.

**Decisión técnica importante:** Los getters del store Zustand (`isAdmin`, `isTrapichero`, etc.) se implementaron como **selector hooks** exportados (`useIsAdmin`, `useIsTrapichero`) en lugar de funciones dentro del store, para evitar el conflicto de TypeScript entre `boolean` y `() => boolean`.

**Archivos clave:** `auth.service.ts`, `auth.store.ts`, `login.tsx`, `register.tsx`, `Button.tsx`, `Input.tsx`

---

### ✅ Fase 4 — Flujo KYC Básico

**Objetivo:** Verificación de identidad obligatoria para poder operar.

**Lo que se hizo:**

- `src/services/kyc.service.ts` — sube las 3 imágenes al bucket `kyc-documents` con rutas `{userId}/id_card_front`, `{userId}/id_card_back`, `{userId}/selfie_with_id`. Usa `upsert` en la BD para permitir reenvíos tras un rechazo. Incluye callback de progreso paso a paso.
- `src/hooks/useKyc.ts` — combina TanStack Query (caché del estado KYC) con la mutación de envío. Actualiza el store de auth cuando el estado cambia a `pending`.
- `src/components/ui/Badge.tsx` — etiqueta de estado con 5 variantes semánticas (success/danger/warning/info/neutral). Se usa en toda la app para estados de KYC, órdenes y tipos de oferta.
- `src/components/ui/PhotoPicker.tsx` — selector de fotos con doble opción (cámara/galería), manejo de permisos con alertas amigables, preview con botón de eliminar y cambiar.
- `app/(app)/kyc/basic.tsx` — pantalla con los **4 estados completamente resueltos**:
  - `none` → formulario para subir las 3 fotos.
  - `pending` → mensaje de espera con checklist de documentos enviados.
  - `approved` → pantalla de éxito con acceso al marketplace.
  - `rejected` → banner rojo con motivo de rechazo + opción de reenvío.
  - Barra de progreso durante la subida (4 pasos).
  - Aviso de privacidad.
  - Validación de que las 3 fotos estén seleccionadas antes de habilitar el botón.

**Flujo técnico:** PhotoPicker → URI local → `fetch(uri)` → Blob → `supabase.storage.upload()` → path guardado en `kyc_documents` → trigger actualiza `profiles.kyc_status = 'pending'`.

**Archivos clave:** `kyc.service.ts`, `useKyc.ts`, `PhotoPicker.tsx`, `kyc/basic.tsx`

---

### ✅ Fase 4.5 — Pantalla de Perfil

**Objetivo:** Hub central donde el usuario ve su estado, accede al KYC y puede cerrar sesión.

**Lo que se hizo:**

- `app/(app)/(tabs)/profile.tsx` — pantalla completa con:
  - Cabecera con avatar (iniciales), nombre, email y badge de Trapichero si aplica.
  - Estadísticas de reputación: total de operaciones, porcentaje de éxito y completadas.
  - Sección de verificación KYC con icono dinámico según el estado (pendiente/aprobado/rechazado) y acceso directo a `kyc/basic`.
  - Acceso a KYC avanzado visible solo si tiene KYC básico aprobado y aún no es Trapichero.
  - Botón de cerrar sesión que llama a `logout()` del hook `useAuth` (limpia store + caché + redirige al login).
  - Versión de la app al pie.

---

### 🔲 Fase 5 — KYC Avanzado (PENDIENTE — En diseño)

**Objetivo:** Convertir un Usuario con KYC básico aprobado en Trapichero.

**Estado:** Pendiente. El flujo y los datos requeridos están siendo evaluados para maximizar la seguridad anti-fraude en el contexto cubano.

**Propuesta inicial en evaluación:**
- Verificación de número de teléfono Cubacel (código SMS o confirmación manual del Admin).
- Declaración de actividad (campo de texto: por qué quiere ser Trapichero).
- Aceptación explícita de términos y condiciones de operación.
- Revisión manual del Admin del historial de la cuenta (sin disputas perdidas, sin cancelaciones excesivas).

**Lo que falta construir:**
- `app/(app)/kyc/advanced.tsx` — pantalla con el flujo completo.
- Lógica de verificación de teléfono en Supabase.
- Panel del Admin para aprobar/rechazar KYC avanzado.

---

### ✅ Fase 6 — Módulo de Ofertas

**Objetivo:** Marketplace completo de compra/venta de USDT.

**Lo que se hizo:**

- `src/services/offers.service.ts` — 6 operaciones: listar con filtros (tipo, método de pago, tasa, monto), detalle por ID, mis ofertas del Trapichero, crear, pausar/reactivar y cancelar (eliminación lógica). Los filtros usan `.contains()` para buscar en el array de `payment_methods`.
- `src/hooks/useOffers.ts` — dos hooks especializados:
  - `useOffers` para el marketplace con estado de filtros reactivo y refetch automático.
  - `useMyOffers` para el Trapichero con mutaciones de crear/pausar/cancelar e invalidación de caché tras cada operación.
- `src/components/offer/OfferCard.tsx` — card con borde izquierdo dorado (venta) o verde (compra), tasa prominente, montos disponibles, métodos de pago como pills y reputación del Trapichero.
- `src/components/offer/OfferFilters.tsx` — chips horizontales scrolleables para tipo y método de pago. Botón de limpiar visible solo con filtros activos.
- `app/(app)/(tabs)/index.tsx` — marketplace con FlashList, pull-to-refresh, banner de KYC si no está verificado, botón "Nueva oferta" solo para Trapicheros, estados vacío y error resueltos.
- `app/(app)/offer/[id].tsx` — detalle completo con tasa prominente, perfil y reputación del Trapichero, formulario de cantidad con validación en tiempo real, selector de método de pago, cálculo automático del total en CUP y guards de negocio (no puedes tomar tu propia oferta, redirige al KYC si no está verificado).
- `app/(app)/offer/create.tsx` — formulario completo para Trapicheros: selector visual de tipo (Venta/Compra), cantidad total, tasa, límites por orden, multi-selección de métodos de pago, nota opcional, total estimado en CUP calculado en tiempo real.

**Guards implementados en `offer/[id].tsx`:**
- Si no tiene KYC básico → Alert con opción de ir a verificarse.
- Si es su propia oferta → Banner informativo, sin formulario.
- Si la oferta está `in_order` → Botón deshabilitado con mensaje explicativo.

**Archivos clave:** `offers.service.ts`, `useOffers.ts`, `OfferCard.tsx`, `marketplace/index.tsx`, `offer/[id].tsx`, `offer/create.tsx`

---

### 🔲 Fase 7 — Módulo de Órdenes + Timer

**Objetivo:** State machine completa de órdenes P2P con timer de 20 minutos.

**Lo que falta construir:**

- `src/services/orders.service.ts` — crear orden, confirmar listo (comprador y vendedor por separado), subir comprobante de pago, confirmar recibo, cancelar, abrir disputa, expirar automáticamente.
- `src/hooks/useOrder.ts` — estado de la orden con Supabase Realtime para actualizaciones en tiempo real.
- `app/(app)/order/create.tsx` — pantalla de confirmación: resumen de la orden, método de pago elegido, total en CUP, botón de confirmar.
- `app/(app)/order/[id].tsx` — pantalla de orden activa con:
  - Estado actual con indicador visual.
  - Timer de cuenta regresiva (MM:SS) con color rojo cuando quedan menos de 5 minutos.
  - Botones de acción según el estado (confirmar listo, subir comprobante, confirmar recibo, cancelar, abrir disputa).
  - Chat integrado en tiempo real.
- `app/(app)/(tabs)/orders.tsx` — historial de órdenes activas y pasadas.
- Lógica de expiración automática a los 20 minutos (función Supabase Edge Function o cron job).

**State machine a implementar:**
```
pending → both_confirmed → buyer_paid → completed
                        ↘ disputed (Admin interviene)
pending → cancelled
both_confirmed → cancelled
both_confirmed → expired (automático a los 20 min)
```

---

### 🔲 Fase 8 — Chat en Tiempo Real

**Objetivo:** Chat vinculado a la orden con mensajes de texto, imágenes y mensajes automáticos del sistema.

**Lo que falta construir:**

- `src/services/chat.service.ts` — enviar mensaje de texto, subir imagen al bucket `payment-proofs`, marcar imagen como comprobante oficial.
- `src/hooks/useChat.ts` — suscripción a Supabase Realtime en el canal de la orden. Los mensajes llegan en tiempo real sin polling.
- `src/components/chat/ChatBubble.tsx` — burbuja de mensaje con diseño diferenciado para: mensajes propios (derecha, fondo dorado), mensajes del otro (izquierda, fondo gris) y mensajes del sistema (centrado, texto en cursiva).
- `src/components/chat/ChatInput.tsx` — input con botón de envío y botón de adjuntar imagen.
- Mensajes automáticos del sistema en los cambios de estado:
  - "Ambos confirmaron que están listos. El timer de 20 minutos ha comenzado."
  - "El comprador subió el comprobante de pago."
  - "⚠️ Quedan 5 minutos para que expire la orden."
  - "El vendedor confirmó el recibo. ¡Orden completada!"
  - "La orden fue cancelada por [nombre]."

---

### 🔲 Fase 9 — Subida de Comprobante de Pago

**Objetivo:** El comprador sube la foto del comprobante dentro del chat de la orden.

**Lo que falta construir:**

- Integración del `PhotoPicker` dentro del chat.
- Subida al bucket `payment-proofs/{order_id}/{filename}`.
- Marcado de `is_payment_proof = true` en el mensaje.
- Actualización del estado de la orden a `buyer_paid`.
- El vendedor puede ver la imagen en el chat y decide confirmar o abrir disputa.

---

### 🔲 Fase 10 — Sistema de Calificaciones y Reputación

**Objetivo:** Calificación mutua obligatoria al completar una orden.

**Lo que falta construir:**

- `src/services/ratings.service.ts` — crear calificación, verificar si ya calificó.
- `src/hooks/useRating.ts` — estado de calificación pendiente.
- Modal/pantalla de calificación con estrellas (1-5) y comentario opcional.
- La pantalla de orden completada no cierra hasta que ambos califiquen.
- Visualización de la reputación en el perfil del usuario (ya preparado el campo en `profiles`).
- Visualización en las cards de oferta (ya implementado parcialmente en `OfferCard`).

**Fórmula de reputación:**
```
% éxito = (successful_trades / total_trades) × 100
```
Actualizado automáticamente por el trigger `on_order_completed`.

---

### 🔲 Fase 11 — Push Notifications + In-App Notifications

**Objetivo:** Notificaciones push cuando la app está cerrada + in-app cuando está abierta.

**Lo que falta construir:**

- Registro del token de push en Supabase al iniciar sesión.
- `src/services/notifications.service.ts` — marcar como leídas, obtener no leídas.
- Integración con Expo Notifications para recibir push.
- Badge de notificaciones no leídas en la tab bar.
- Pantalla de notificaciones o panel lateral.
- Envío de push desde Supabase Edge Functions en los eventos clave:
  - Nueva orden sobre tu oferta.
  - El otro usuario confirmó "listo".
  - El comprador subió el comprobante.
  - La orden se completó.
  - Se abrió una disputa.
  - Tu KYC fue aprobado/rechazado.

---

### 🔲 Fase 12 — Panel de Administración

**Objetivo:** Panel completo dentro de la app para que el Admin gestione todo.

**Lo que falta construir:**

- `app/(admin)/dashboard.tsx` — dashboard con estadísticas: total de usuarios, órdenes activas, KYC pendientes, disputas abiertas, volumen del día.
- `app/(admin)/kyc-review.tsx` — lista de KYC pendientes con fotos, opción de aprobar o rechazar con motivo.
- `app/(admin)/disputes.tsx` — lista de disputas activas con chat de la orden y opciones: completar orden (dar la razón al comprador), cancelar (dar la razón al vendedor) o sancionar a ambos.
- Panel de usuarios: buscar, ver historial, banear, desbanear.
- Herramientas de moderación: cancelar ofertas, ajustar estados de órdenes.

---

### 🔲 Fase 13 — Pulido Final y UX

**Objetivo:** Llevar la app al nivel premium antes del lanzamiento.

**Lo que falta construir:**

- Onboarding de bienvenida (3-4 pantallas explicando el funcionamiento).
- Skeleton loaders en lugar de spinners en las listas.
- Animaciones de transición entre estados de orden.
- Animación de celebración al completar una orden (confetti o similar con Reanimated).
- Gestión de mis ofertas desde el perfil del Trapichero (ver, pausar, eliminar).
- Deep linking para notificaciones (abrir directamente la orden o la disputa).
- Manejo de errores de red con modo offline amigable.
- Optimización de imágenes KYC antes de subir (compresión).
- Pruebas en dispositivos Android reales antes del build de producción.
- Configuración de EAS Build para generar el APK.

---

## Guía de Convenciones del Código

### Imports
Siempre usar path aliases, nunca rutas relativas profundas:
```typescript
// ✅ Correcto
import { Colors } from '@constants/theme';
import { supabase } from '@lib/supabase';
import { useAuthStore } from '@stores/auth.store';

// ❌ Incorrecto
import { Colors } from '../../../constants/theme';
```

### Servicios
Los componentes y hooks nunca llaman a Supabase directamente. Todo pasa por los servicios en `src/services/`:
```typescript
// ✅ Correcto — desde un hook
const { data } = await fetchOffers(filters);

// ❌ Incorrecto — desde un componente
const { data } = await supabase.from('offers').select('*');
```

### Stores Zustand
Usar selector hooks para evitar re-renders innecesarios:
```typescript
// ✅ Correcto — solo re-renderiza si user.id cambia
const userId = useAuthStore((s) => s.user?.id);

// ❌ Incorrecto — re-renderiza con cualquier cambio del store
const { user } = useAuthStore();
```

### Comentarios
Los comentarios del código se escriben en **español**.

### Sin emojis
No usar emojis en la UI. Usar únicamente iconos de **Lucide React Native**.

---

## Contacto y Autoría

**Desarrollador:** Yerald  
**Perfil público:** @yerald.dev  
**Plataforma:** Instagram y Facebook  
**Contexto:** Aplicación construida para el mercado cubano de intercambio P2P de divisas.
