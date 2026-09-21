# nodejs-msa (bản thu gọn – dự án thực tập)

Hệ thống Microservices thu gọn gồm 4 service độc lập (Auth, User, Product, Cart) và một API Gateway,
xây dựng bằng Node.js/Express, MongoDB, Redis, JWT.

## Chạy toàn bộ hệ thống

```bash
docker-compose up --build
```

- Gateway:  http://localhost:4000
- Auth:     http://localhost:4001/api-docs (Swagger)
- User:     http://localhost:4002/api-docs
- Product:  http://localhost:4003/api-docs
- Cart:     http://localhost:4004/api-docs

## Chạy test + coverage cho từng service

```bash
cd auth-service && npm install && npm test -- --coverage
cd user-service && npm install && npm test -- --coverage
cd product-service && npm install && npm test -- --coverage
cd cart-service && npm install && npm test -- --coverage
```
