# Wallet Challenge - EPayco

Este proyecto resuelve la prueba técnica de un Desarrollador Backend implementando una billetera virtual con:
- Servicio SOAP (fuente de verdad y único con acceso a la BD).
- Servicio REST (puente moderno que expone JSON y documenta con Swagger).
- MySQL (persistencia) y Mailhog (emails de prueba).
- Orquestación completa con Docker Compose.

[![Status](https://img.shields.io/badge/status-completed-brightgreen)](./)
[![Stack](https://img.shields.io/badge/stack-NestJS%20%7C%20SOAP%20%7C%20REST%20%7C%20MySQL-blue)](./)

---

## Arquitectura y flujo

Componentes:
- wallet-soap (NestJS + TypeORM + MySQL): lógica de negocio, contrato WSDL y validación de X-API-KEY. ÚNICO que accede a BD.
- wallet-rest (NestJS/Express): recibe JSON, llama al SOAP y devuelve la misma estructura de respuesta.
- MySQL 8: almacenamiento de clientes y sesiones de pago.
- Mailhog: captura correos (token de 6 dígitos).
- Docker Compose: levanta todo y define healthchecks.

Flujo (REST → SOAP):

```
Cliente (Postman/Swagger)
        |
        v
  wallet-rest (JSON)
        |
        v
  Llamada SOAP (XML + X-API-KEY)
        |
        v
  wallet-soap (lógica + TypeORM)
        |
        v
        MySQL
```

---

## Endpoints y URLs

- Swagger (REST): http://localhost:3000/docs
- Health (REST): http://localhost:3000/health
- WSDL (SOAP): http://localhost:3001/wsdl?wsdl
- Mailhog UI: http://localhost:8025

---

## Requisitos

- Docker y Docker Compose
- Puertos libres: 3000, 3001, 3306, 8025, 1025

---

## Configuración

Copia los archivos de entorno de ejemplo:

```
cp wallet-rest/.env.example wallet-rest/.env
cp wallet-soap/.env.example wallet-soap/.env
```

Variables clave (ya preparadas para Docker):
- wallet-soap/.env: `API_KEY=supersecret`, `DB_HOST=mysql`, `MAIL_HOST=mailhog`
- wallet-rest/.env: `SOAP_URL=http://wallet-soap:3001/wsdl?wsdl`, `SOAP_ENDPOINT=http://wallet-soap:3001/wsdl`, `API_KEY=supersecret`

Nota: la `API_KEY` debe coincidir en REST y SOAP.

---

## Cómo ejecutar

Construir y levantar:
```
docker compose up -d --build
```

Verificar estados (healthy):
```
docker ps --format "table {{.Names}}\t{{.Status}}"
```

Abrir en el navegador:
- Swagger: http://localhost:3000/docs
- Mailhog: http://localhost:8025
- WSDL: http://localhost:3001/wsdl?wsdl

---

## Flujo de prueba (end-to-end)

Usa Swagger (http://localhost:3000/docs) y sigue este orden:

1) Registrar cliente
- POST /clients/register
- Body: { document, names, email, phone }
- Esperado: `success=true`, `cod_error="00"`, `data.client_id`

2) Recargar billetera
- POST /wallet/topup
- Body: { document, phone, amount: 50000 }
- Esperado: `data.balance` actualizado

3) Iniciar pago
- POST /payments/initiate
- Body: { document, phone, amount: 20000 }
- Esperado: `data.session_id` + mensaje “token enviado”
- Abre Mailhog y copia el token de 6 dígitos

4) Confirmar pago
- POST /payments/confirm
- Body: { session_id, token }
- Esperado: `data.balance` con el descuento aplicado

5) Consultar saldo
- GET /wallet/balance?document=...&phone=...
- Esperado: `data.balance`

Estructura de respuesta (SOAP y REST):
```
{
  "success": boolean,
  "cod_error": "00" | "01" | "02" | "03" | "04" | "05" | "06" | "07",
  "message_error": string,
  "data": { ... }
}
```

---

## Decisiones de diseño

- Separación de responsabilidades: SOAP contiene lógica y BD; REST es la interfaz moderna para clientes.
- Seguridad interna: REST envía `X-API-KEY` y SOAP la valida en cada operación.
- Robustez del pago: `PaymentSession` con estados `PENDING/CONFIRMED/EXPIRED` y token por correo (Mailhog).
- DX: Swagger para probar, healthchecks para observar.

---

## Troubleshooting

- REST intentando “localhost” para SOAP:
  - Revisa `SOAP_ENDPOINT=http://wallet-soap:3001/wsdl` (ya configurado).
- Healthchecks en “unhealthy”:
  - Espera 20–30s. Verifica: http://localhost:3000/health y http://localhost:3001/wsdl?wsdl
  - Logs: `docker compose logs -f wallet-rest` y `docker compose logs -f wallet-soap`
- JSON malformado en Windows (cURL):
  - En Git Bash usa comillas simples por fuera del JSON o escapa las internas.

---
