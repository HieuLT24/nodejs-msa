/** OpenAPI spec cho toàn bộ MSA qua API Gateway */
module.exports = {
  openapi: '3.0.0',
  info: {
    title: 'Node.js MSA API Gateway',
    version: '1.0.0',
    description:
      'Tài liệu API tập trung qua Gateway. Authorize bằng Access Token (Bearer JWT) lấy từ /api/auth/login.',
  },
  servers: [{ url: 'http://localhost:4000', description: 'API Gateway' }],
  tags: [
    { name: 'Auth', description: 'Đăng ký / đăng nhập / refresh token' },
    { name: 'User', description: 'Hồ sơ người dùng' },
    { name: 'Product', description: 'Danh sách & chi tiết sản phẩm' },
    { name: 'Cart', description: 'Giỏ hàng' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng ký tài khoản mới',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Tạo tài khoản thành công' },
          400: { description: 'Thiếu thông tin bắt buộc' },
          409: { description: 'Email đã tồn tại' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng nhập và nhận Access/Refresh Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Đăng nhập thành công — trả accessToken & refreshToken' },
          401: { description: 'Sai email hoặc mật khẩu' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Cấp lại Access Token từ Refresh Token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Access token mới' },
          401: { description: 'Refresh token không hợp lệ' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Đăng xuất, thu hồi Refresh Token',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          204: { description: 'Đăng xuất thành công' },
        },
      },
    },
    '/api/users/{id}': {
      get: {
        tags: ['User'],
        summary: 'Lấy thông tin hồ sơ người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Thông tin người dùng' },
          401: { description: 'Chưa đăng nhập hoặc token không hợp lệ' },
          404: { description: 'Không tìm thấy người dùng' },
        },
      },
      put: {
        tags: ['User'],
        summary: 'Cập nhật hồ sơ người dùng',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                minProperties: 1,
                properties: {
                  name: { type: 'string', minLength: 2, maxLength: 100 },
                  phone: { type: 'string', example: '0901234567' },
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Cập nhật thành công' },
          400: { description: 'Dữ liệu không hợp lệ' },
          401: { description: 'Chưa đăng nhập hoặc token không hợp lệ' },
          409: { description: 'Email đã tồn tại' },
        },
      },
    },
    '/api/products': {
      get: {
        tags: ['Product'],
        summary: 'Danh sách sản phẩm (phân trang, tìm kiếm, lọc)',
        parameters: [
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
          { in: 'query', name: 'search', schema: { type: 'string' } },
          { in: 'query', name: 'category', schema: { type: 'string' } },
          { in: 'query', name: 'minPrice', schema: { type: 'number' } },
          { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
        ],
        responses: {
          200: { description: 'Danh sách sản phẩm kèm meta phân trang' },
        },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Product'],
        summary: 'Chi tiết một sản phẩm',
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Chi tiết sản phẩm' },
          404: { description: 'Không tìm thấy sản phẩm' },
        },
      },
    },
    '/api/cart': {
      get: {
        tags: ['Cart'],
        summary: 'Xem giỏ hàng hiện tại',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Giỏ hàng kèm tổng tiền' },
          401: { description: 'Chưa đăng nhập hoặc token không hợp lệ' },
        },
      },
    },
    '/api/cart/items': {
      post: {
        tags: ['Cart'],
        summary: 'Thêm sản phẩm vào giỏ hàng',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['productId', 'quantity'],
                properties: {
                  productId: { type: 'string' },
                  quantity: { type: 'integer', minimum: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Giỏ hàng sau khi thêm' },
          401: { description: 'Chưa đăng nhập hoặc token không hợp lệ' },
          422: { description: 'Vượt quá tồn kho' },
        },
      },
    },
    '/api/cart/items/{productId}': {
      put: {
        tags: ['Cart'],
        summary: 'Cập nhật số lượng một sản phẩm trong giỏ',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['quantity'],
                properties: {
                  quantity: { type: 'integer', minimum: 0, description: '0 = xóa khỏi giỏ' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Giỏ hàng sau khi cập nhật' },
          401: { description: 'Chưa đăng nhập hoặc token không hợp lệ' },
        },
      },
      delete: {
        tags: ['Cart'],
        summary: 'Xóa một sản phẩm khỏi giỏ hàng',
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Giỏ hàng sau khi xóa' },
          401: { description: 'Chưa đăng nhập hoặc token không hợp lệ' },
        },
      },
    },
  },
};
