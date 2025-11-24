# Orders, Voucher & Promotion Management System (NestJS)

This is a demo for creating and managing **orders**, **vouchers**, and **promotions**, with **automatic discount rules**, **usage tracking**, **expiry enforcement**, and **transaction-safe order creation**.

The project includes full **Swagger API documentation**, **Supabase PostgreSQL integration**, **JWT Authentication** and is deployed to **Render**.

---

## Overview & Architecture

### What the system does

- Allows creation, update, and deletion of **vouchers** and **promotions** with flexible discount rules.
- Creates **orders** while safely applying voucher & promotion business logic:
  - Expiry validation
  - Usage limit tracking for promotions and vouchers
  - Minimum order value restrictions
  - Eligible SKU handling for promotions
  - Max discount cap of 50% of order value

- Ensures **atomic updates** for order creation and voucher / using database transactions so no partial order creation occurs.
- Generates a complete **Swagger UI** to test APIs.
- All the above functionalities are **only** accessible after **JST based Authentication** is successful.

### Architecture components

| Component           | Responsibility                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NestJS              | Backend REST API                                                                                                                                             |
| TypeORM             | Database ORM & migrations                                                                                                                                    |
| Supabase PostgreSQL | Persistent storage                                                                                                                                           |
| Throttler           | Rate limiting per IP (**50** API calls for `Get` request per minute per IP and **10** API calls for `POST`, `DELETE` and `PATCH` requests per minute per IP) |
| JWT Auth            | Authentication and API protection                                                                                                                            |
| Swagger             | OpenAPI documentation UI                                                                                                                                     |
| Render              | Cloud deployment                                                                                                                                             |

---

## Key Tech Stack

- **NestJS**
- **TypeScript**
- **TypeORM**
- **Supabase PostgreSQL**
- **JWT Authentication**
- **Swagger / OpenAPI**
- **Render Deployment**
- **Throttler rate-limiting**

---

## Environment Variables (.env)

Create an `.env` file in the project root:

```
PORT=3000
DATABASE_URL=<your-supabase-postgres-connection-string>
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=1d
```

---

## Connecting Supabase Database

1. Sign in to Supabase: [https://supabase.com](https://supabase.com)
2. Create a new project or select an existing one
3. Navigate to:

```
Project Settings → Database → Connection String → URI
```

4. Copy the connection string (format):

```
postgres://postgres:<password>@<host>:5432/postgres
```

5. Paste into `.env`:

```
DATABASE_URL=postgres://postgres:<password>@<host>:5432/postgres
```

---

## Running Migrations

Generate migration files based on entity changes:

```
npm run migration:generate src/migrations/Migration
```

Run pending migrations:

```
npm run migration:run
```

Revert last migration:

```
npm run migration:revert
```

---

## Modules Overview

| Module    | Description                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Voucher   | Manages voucher lifecycle with discount rules, expiry validation, min order restriction, and usage limit tracking |
| Promotion | Manages promotion lifecycle with eligible SKUs validation, expiry rules, and usage deduction                      |
| Orders    | Creates orders with transaction-safe business logic applying vouchers and promotions                              |

---

## API Endpoints

### Auth API

| Method | Endpoint      | Description                                                                                                       |
| ------ | ------------- | ----------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/login` | Authenticate statically, via username: "admin" and password: "password123", other username or password will fail. |

---

### Voucher APIs

| Method | Endpoint          | Description               |
| ------ | ----------------- | ------------------------- |
| POST   | `/voucher`        | Create a new voucher      |
| GET    | `/voucher`        | Get all vouchers          |
| GET    | `/voucher/{id}`   | Get voucher by ID         |
| PATCH  | `/voucher/{code}` | Update voucher using code |
| DELETE | `/voucher/{id}`   | Delete voucher by ID      |

---

### Promotion APIs

| Method | Endpoint            | Description                 |
| ------ | ------------------- | --------------------------- |
| POST   | `/promotion`        | Create a new promotion      |
| GET    | `/promotion`        | Get all promotions          |
| GET    | `/promotion/{id}`   | Get promotion by ID         |
| PATCH  | `/promotion/{code}` | Update promotion using code |
| DELETE | `/promotion/{id}`   | Delete promotion by ID      |

---

### Order APIs

| Method | Endpoint      | Description                                    |
| ------ | ------------- | ---------------------------------------------- |
| POST   | `/order`      | Create a new order and apply voucher/promotion |
| GET    | `/order`      | Fetch all orders                               |
| GET    | `/order/{id}` | Get order by ID                                |
| DELETE | `/order/{id}` | Delete order by ID                             |

---

## Local Development

```
npm install
npm run start:dev
```

Verify DB connectivity:

```
npm run migration:run
```

---

## Swagger / API Docs

After starting the server on local machine, open on **browser**:

```
http://localhost:3000/api-docs
```

To access live version deployed on **Render** (this may take a minute to start as it is hosted on free tier):

```
https://order-management-system-7qfp.onrender.com/api-docs
```

---

## Deployment (Render using existing Supabase DB)

1. Push project to GitHub
2. Create a new Web Service in Render
3. Select “Public GitHub Repository”
4. Set startup command:

```
npm run start:prod
```

5. Add environment variables in Render Dashboard exactly as in your local `.env` file.
6. Do **not** enable Render PostgreSQL because Supabase DB will be used
7. Deploy

---

## Run test cases (this runs all test cases for vouchers, promotions and orders):

```
npm run test
```

---

## How to test the APIs with authentication (both local and live deployed version):

1. From the Swagger API documentation access the api `auth/login` and pass the authentication details. Do not pass any other details as this is just a sample authentication API and any other details will result in `Unauthorized` data:

```
{
  "username": "admin",
  "password": "password123"
}

```

2. This gives a success message with data such as:

```
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzYzOTU3NTEzLCJleHAiOjE3NjQwNDM5MTN9.bW7fXwQNEzoYdg8dkv5ZJkYD5Tm9vz3ndsYIZYtP9mM",
  "message": "copy this access token and paste in above Authorize section to access other APIs"
}

```

3. Copy the `access_token` and click on the Swagger's **Authorize** button and paste it in the value section. This enables access to all other APIs and is valid for 1 hour. You can also click on **Logout** within the Swagger's **Authorize** section to remove this `access_token` and invalidate authentication.

4. You can now access all other API.

---

## Database Schema Diagram for TypeORM Migrations table, Vouchers table, Promotions table and Orders table.

![Database ERD](docs/supabase-schema-yjzeerhgxmrbisbxcrjz.png)

## Output Behavior Summary

| Component  | Auto-Handled Functionality                                    |
| ---------- | ------------------------------------------------------------- |
| Vouchers   | Usage limit countdown, validation, min order rule             |
| Promotions | Eligible SKU rule, usage decrement, expiry                    |
| Orders     | Pessimistic locking, transaction safety, max 50% discount cap |

---
