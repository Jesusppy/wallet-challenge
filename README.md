````markdown
# Wallet Challenge - EPayco

Este proyecto es una solución completa a la prueba técnica para un Desarrollador Backend. Implementa una billetera virtual utilizando una arquitectura de microservicios con un servicio **SOAP** (la fuente de verdad) y un servicio **REST** (el puente para los clientes).

Todo el sistema está contenedorizado con **Docker**, incluyendo una base de datos **MySQL** y un servidor de correo para pruebas **Mailhog**, lo que garantiza un entorno de desarrollo y evaluación 100% reproducible.

[![Build Status](https://img.shields.io/badge/status-completed-brightgreen)](./)
[![Stack](https://img.shields.io/badge/stack-NestJS_|_SOAP_|_REST_|_MySQL-blue)](./)

---

## 🚀 Arquitectura y Flujo

El sistema se compone de dos microservicios independientes:

1.  **`wallet-soap` (NestJS):** Es el **cerebro** de la aplicación.
    *   **Único con acceso a la base de datos** (MySQL con TypeORM).
    *   Contiene toda la lógica de negocio (registrar, recargar, pagar, etc.).
    *   Expone sus funcionalidades a través de un **contrato SOAP (WSDL)**.
    *   Está protegido por una API Key interna (`X-API-KEY`).

2.  **`wallet-rest` (NestJS):** Es el **puente** moderno para los clientes.
    *   Expone una **API RESTful documentada interactivamente con Swagger**.
    *   **No tiene acceso a la base de datos.** Su única función es recibir peticiones JSON, llamar al servicio `wallet-soap`, y devolver la respuesta.

**Flujo de una petición:**
`Cliente` → `Petición JSON` → `API REST` → `Llamada SOAP/XML` → `Servicio SOAP` → `Lógica + SQL` → `Base de Datos`

```mermaid
graph LR
    A[Cliente via Postman/Swagger] -- Petición JSON --> B[wallet-rest (API REST)]
    B -- Llamada SOAP con API Key --> C[wallet-soap (Lógica de Negocio)]
    C -- Consultas con TypeORM --> D[(MySQL DB)]
    E[Mailhog] -- Atrapa Emails para el Token --> C
```

---

## 🛠️ Stack Tecnológico

| Componente      | Tecnología        | Propósito                                        |
| --------------- | ----------------- | ------------------------------------------------ |
| **Servicio SOAP** | NestJS, TypeORM   | Lógica de negocio, acceso a datos, seguridad.    |
| **Servicio REST** | NestJS, Swagger   | Puente moderno, documentación interactiva.         |
| **Base de Datos** | MySQL 8.0         | Persistencia de clientes y sesiones de pago.    |
| **Email Testing** | Mailhog           | Atrapa y muestra emails (token de confirmación). |
| **Orquestación**  | Docker Compose    | Levanta y conecta todos los servicios.           |

---

## ▶️ Cómo Ejecutar el Proyecto

### Requisitos
*   Docker & Docker Compose

### 1. Clonar y Configurar
```bash
git clone <URL_DEL_REPO>
cd wallet-challenge

# Copiar archivos de entorno de ejemplo
cp wallet-rest/.env.example wallet-rest/.env
cp wallet-soap/.env.example wallet-soap/.env
```
_**Nota:** Las contraseñas y claves en los archivos `.env` ya están configuradas para funcionar con Docker Compose._

### 2. Levantar los Servicios
Este único comando construirá las imágenes y arrancará todos los contenedores en segundo plano.
```bash
docker compose up -d --build
```

### 3. Verificar que todo funciona
Espera unos 30 segundos mientras la base de datos se inicializa. Luego, revisa los siguientes URLs en tu navegador:

*   **REST API (Swagger):** [http://localhost:3000/docs](http://localhost:3000/docs)  ➡️  *Tu interfaz de pruebas principal.*
*   **SOAP Service (WSDL):** [http://localhost:3001/wsdl?wsdl](http://localhost:3001/wsdl?wsdl) ➡️ *Verifica que el servicio SOAP está exponiendo su contrato.*
*   **Mailhog UI (Correos):** [http://localhost:8025](http://localhost:8025) ➡️ *Aquí verás los emails con los tokens de confirmación.*

---

## ✅ Flujo de Prueba Recomendado (End-to-End)

Usa la interfaz de **Swagger** en `http://localhost:3000/docs` para realizar las siguientes operaciones en orden:

1.  **Registrar un Cliente:**
    *   Usa `POST /clients/register` con los datos de un nuevo cliente.
    *   Verifica que la respuesta sea `success: true` y `cod_error: '00'`.

2.  **Recargar Saldo:**
    *   Llama a `POST /wallet/topup` usando el `document` y `phone` del cliente recién creado. Añade un monto, por ejemplo, `50000`.
    *   La respuesta debe mostrar el nuevo `balance`.

3.  **Iniciar un Pago:**
    *   Ejecuta `POST /payments/initiate` con los mismos datos del cliente y un monto menor al saldo (ej. `20000`).
    *   La respuesta te dará una `session_id`. **Cópiala.**

4.  **Verificar el Token:**
    *   Ve a la interfaz de **Mailhog** (`http://localhost:8025`).
    *   Abre el correo que ha llegado y **copia el token de 6 dígitos**.

5.  **Confirmar el Pago:**
    *   Usa `POST /payments/confirm` con la `session_id` que copiaste del paso 3 y el `token` del paso 4.
    *   Verifica que la respuesta muestre el `balance` final descontado.

6.  **Consultar Saldo:**
    *   Verifica el nuevo saldo llamando a `GET /wallet/balance` con el `document` y `phone` del cliente. El valor debe coincidir con el del paso anterior.

---

## 💡 Decisiones de Diseño Clave

*   **Arquitectura de Puente (REST sobre SOAP):** Cumple con el requisito de la prueba y aísla la lógica de negocio (SOAP) de la capa de presentación (REST), permitiendo que evolucionen de forma independiente y segura.
*   **Idempotencia y Transaccionalidad:** La tabla `payment_sessions` y los estados (`PENDING`, `CONFIRMED`, `EXPIRED`) garantizan que un pago no se pueda confirmar dos veces y que el ciclo de vida de la transacción sea robusto.
*   **Seguridad Interna:** La `X-API-KEY` (configurable en los `.env`) asegura que solo el servicio REST autorizado pueda comunicarse con el servicio SOAP, protegiendo el acceso directo a la lógica de negocio.
*   **Entorno de Desarrollo Completo:** El uso de Docker, Healthchecks y Mailhog crea un entorno de desarrollo y pruebas profesional, robusto y fácil de usar para cualquier miembro del equipo.
*   **ORM (TypeORM):** Cumple con la valoración de usar un ORM y proporciona una capa de abstracción segura y fuertemente tipada para la interacción con la base de datos, previniendo errores comunes como inyecciones SQL.
