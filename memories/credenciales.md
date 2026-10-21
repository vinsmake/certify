# Credenciales de desarrollo

> Solo para el entorno local. No usar en produccion.

## Usuario admin (lo crea el seed a partir de `SEED_ADMIN_*` en `.env`)

| Campo | Valor |
|---|---|
| Email | vinsmakedev@gmail.com |
| Password | @Vinsmake2121 |
| Rol | admin (sin dependencia: ve todo) |

## Base de datos

Las credenciales son las de `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` en `.env`
(no versionado). Acceso directo:

```bash
docker compose exec database sh -c 'psql -U $POSTGRES_USER -d $POSTGRES_DB'
```

O visualmente con Prisma Studio: `npm run db:studio` y abrir http://localhost:5555.

## Obtener un token JWT

```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vinsmakedev@gmail.com","password":"@Vinsmake2121"}'
```

Usar el `token` de la respuesta en `Authorization: Bearer <token>`. Expira en `JWT_EXPIRATION` (8h).
