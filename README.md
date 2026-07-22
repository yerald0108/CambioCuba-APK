# CambioCuba

Aplicación móvil P2P para coordinar intercambios de **CUP ↔ USDT** entre usuarios cubanos. La plataforma no custodia dinero: organiza las ofertas, la orden, el chat, los comprobantes, la reputación, las notificaciones y la moderación.

> Estado documentado a partir del código actual del repositorio (22 de julio de 2026). No equivale a una auditoría de producción de Supabase ni a una prueba en dispositivos físicos.

## Estado actual

| Área | Estado | Alcance actual |
|---|---|---|
| Base de la app | Implementado | Expo Router, TypeScript estricto, tema Vault Dark, NativeWind, Zustand y TanStack Query. |
| Autenticación | Implementado | Registro, inicio/cierre de sesión, sesión persistente y guards por sesión/rol. |
| KYC básico | Implementado | Captura y carga de documentos, consulta de estado y revisión por administrador. |
| Marketplace | Implementado | Listado, filtros, detalle y creación de ofertas para trapicheros. |
| Órdenes P2P | Implementado | Creación desde una oferta, confirmación de ambas partes, timer, cancelación, disputa, pago y confirmación de recibo. |
| Chat y comprobantes | Implementado | Mensajes en tiempo real, envío de comprobantes y visualización en la orden. |
| Calificaciones | Implementado | Calificación mutua y consulta de reputación. |
| Notificaciones | Implementado | Registro de push token, notificaciones in-app, contador de no leídas y navegación desde la notificación. |
| Administración | Parcial | Dashboard, revisión de KYC y resolución de disputas. La capa de servicio contempla búsqueda/baneo, pero no hay una pantalla de usuarios expuesta. |
| KYC avanzado | Pendiente | La ruta existe, pero es un placeholder. |
| Fase 13 | En curso | Onboarding, skeletons, manejo offline, compresión KYC, animaciones, gestión de ofertas y perfiles EAS implementados; falta validación en Android físico. |

## Stack

| Categoría | Tecnología |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 (`~54.0.34`) |
| Navegación | Expo Router 6, rutas basadas en archivos |
| Lenguaje | TypeScript 5.9, modo estricto |
| Estilos | NativeWind 4 + sistema de diseño propio |
| Estado local | Zustand 5 |
| Datos remotos | TanStack Query 5 + Supabase |
| Formularios | React Hook Form + Zod 4 |
| Listas | FlashList 2 |
| Animación y gestos | Reanimated 4 + Gesture Handler |
| Media | Expo Image, Image Picker y File System |
| Seguridad | Expo SecureStore |
| Notificaciones | Expo Notifications |

## Roles y reglas de negocio

| Rol | Capacidades |
|---|---|
| Admin | Revisa KYC, visualiza métricas y resuelve disputas. |
| Usuario | Con KYC básico aprobado puede explorar y tomar ofertas. |
| Trapichero | Con KYC avanzado aprobado puede publicar ofertas, además de las capacidades de usuario. |

- Un usuario solo puede tener una orden activa a la vez.
- Cada orden inicia un plazo de 20 minutos cuando ambas partes confirman estar listas.
- El pago ocurre fuera de CambioCuba (Transfermóvil, EnZona o MiTransfer).
- Las disputas bloquean la orden hasta la intervención administrativa.
- La finalización contempla calificaciones mutuas y el historial conserva las cancelaciones.

## Flujo P2P implementado

1. El usuario selecciona una oferta y define el importe dentro de sus límites.
2. La orden se crea desde el detalle de la oferta y ambas partes confirman estar listas.
3. El comprador paga por el canal externo acordado y puede adjuntar su comprobante en el chat.
4. El vendedor confirma la recepción, o cualquiera de las partes cancela/abre una disputa.
5. Al completarse, la aplicación solicita la calificación de cada participante.

## Arquitectura

```text
app/
├── (auth)/                 # Registro y login
├── (app)/
│   ├── (tabs)/             # Marketplace, órdenes, notificaciones y perfil
│   ├── offer/              # Crear y consultar ofertas
│   ├── order/              # Detalle de orden, chat y acciones de la orden
│   └── kyc/                # KYC básico y placeholder de KYC avanzado
├── (admin)/                # Dashboard, KYC y disputas
├── _layout.tsx             # Providers, sesión y push notifications
└── index.tsx               # Redirección según sesión y rol

src/
├── components/             # UI común, ofertas, chat y calificaciones
├── constants/theme.ts      # Tokens del diseño Vault Dark y reglas de negocio
├── hooks/                  # Auth, KYC, ofertas, órdenes, chat, rating, admin y push
├── lib/                    # Cliente Supabase y QueryClient
├── services/               # Acceso a Supabase encapsulado por dominio
├── stores/                 # Estado de autenticación y toasts
├── types/                  # Tipos del dominio
└── utils/                  # Formateo y validación
```

Los componentes no deben acceder a Supabase directamente: las operaciones viven en `src/services/` y los hooks coordinan caché, estados de carga y mutaciones.

## Integración Supabase

El cliente usa SecureStore para persistir la sesión y declara estos buckets:

- `kyc-documents`
- `payment-proofs`
- `avatars`

El código usa las entidades `profiles`, `kyc_documents`, `offers`, `orders`, `chat_messages`, `order_ratings` y `notifications`. Para ejecutar la app se requieren las variables públicas de Supabase; no se incluyen secretos en este repositorio.

```env
EXPO_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

## Ejecutar el proyecto

```bash
npm install
npx expo start
```

Comandos definidos actualmente:

```bash
npm run start
npm run android
npm run ios
npm run web
```

La configuración de Expo está en `app.json`: esquema `cambiocuba`, orientación vertical, tema oscuro y plugins para Router, SecureStore, Image Picker y Notifications.

## Estado por fases

| Fase | Estado | Notas |
|---|---|---|
| 1. Setup, arquitectura y diseño | Hecha | Configuración Expo SDK 54, tema, aliases, cliente Supabase, caché y navegación. |
| 2. Schema de Supabase | Integrado | Tipos, servicios y buckets están conectados desde la app; las migraciones no están versionadas en este repositorio. |
| 3. Autenticación | Hecha | Registro, login, logout, persistencia y guards. |
| 4. KYC básico y perfil | Hecha | Carga de documentos, estado y perfil. |
| 5. KYC avanzado | Pendiente | `app/(app)/kyc/advanced.tsx` es un placeholder. |
| 6. Ofertas | Hecha | Consulta, filtros, creación, pausa/cancelación a nivel de hook/servicio. |
| 7. Órdenes y timer | Hecha | Flujo funcional en el detalle de oferta y de orden. `order/create.tsx` sigue como placeholder y no es el flujo activo. |
| 8. Chat en tiempo real | Hecha | Suscripción Realtime y mensajes de orden. |
| 9. Comprobantes de pago | Hecha | Carga y burbuja de comprobante dentro del chat. |
| 10. Reputación | Hecha | Modal de calificación, envío y consulta. |
| 11. Notificaciones | Hecha | Push token, feed, badge y navegación a órdenes/KYC. |
| 12. Administración | Parcial | Dashboard, KYC y disputas; falta una interfaz de gestión de usuarios. |
| 13. Pulido final y UX | En curso | La mayor parte del alcance está implementada; queda la validación en dispositivos físicos. |

## Fase 13 — estado y cierre pendiente

- Hecho: onboarding de tres pantallas, skeletons para marketplace y órdenes, transiciones de estado y celebración de orden completada.
- Hecho: gestión de ofertas desde el perfil del trapichero; permite pausar, reactivar y eliminar cuando el estado lo admite.
- Hecho: banner offline que sincroniza React Query con la conectividad del dispositivo y conserva los datos en caché.
- Hecho: compresión y redimensionamiento de imágenes KYC antes de la subida.
- Hecho: navegación desde notificaciones de orden, chat, KYC y disputa; también atiende la respuesta que abrió la app.
- Hecho: `eas.json`, perfil `preview` para APK y scripts `npm run build:apk` / `npm run build:android`.
- Pendiente: pruebas en dispositivos Android físicos, credenciales/inicialización del proyecto EAS y ejecución del build remoto.
- Pendiente de producto: completar KYC avanzado y decidir si se elimina o implementa la ruta placeholder `order/create`.

## Verificación pendiente

`npx tsc --noEmit` pasa correctamente. Aún no hay scripts de pruebas automatizadas definidos ni una validación documentada en dispositivos Android físicos, por lo que ambas siguen siendo requisitos antes de declarar un release de producción.

## Convenciones

- Usar los aliases configurados (`@constants`, `@services`, `@hooks`, etc.) en lugar de imports relativos profundos.
- Mantener los tokens visuales en `src/constants/theme.ts`; evitar valores visuales nuevos sin centralizarlos allí.
- Escribir comentarios de código en español.
- Usar iconos de Lucide en la interfaz, no emojis.

## Autoría

Desarrollado por **Yerald** para el mercado cubano de intercambio P2P de divisas.
