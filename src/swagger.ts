import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ackee Box API',
      version: '1.0.0',
      description: 'RESTful API for package delivery box management system with geospatial search capabilities',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /mock-sso/quick-token or OAuth flow'
        }
      },
      schemas: {
        Box: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique box identifier',
              example: 'B115'
            },
            code: {
              type: 'string',
              description: 'Box code displayed on physical box',
              example: 'B115'
            },
            name: {
              type: 'string',
              description: 'Human-readable box name',
              example: 'Prague Center Box'
            },
            address: {
              type: 'string',
              description: 'Physical address of the box',
              example: 'Wenceslas Square 1, Prague'
            },
            location: {
              type: 'object',
              properties: {
                lat: {
                  type: 'number',
                  description: 'Latitude coordinates',
                  example: 50.0875
                },
                lng: {
                  type: 'number',
                  description: 'Longitude coordinates',
                  example: 14.4210
                }
              }
            },
            status: {
              type: 'string',
              nullable: true,
              description: 'Box operational status',
              example: 'active'
            },
            distance: {
              type: 'number',
              description: 'Distance from search point in meters',
              example: 287.5
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Order ID',
              example: 1
            },
            externalOrderId: {
              type: 'string',
              description: 'External order identifier',
              example: 'EXT-2024-001'
            },
            customerId: {
              type: 'string',
              description: 'Customer identifier',
              example: 'customer-123'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_transit', 'delivered', 'picked_up'],
              description: 'Order status',
              example: 'pending'
            },
            pickupPin: {
              type: 'string',
              nullable: true,
              description: 'PIN for customer pickup',
              example: '123456'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
              example: 'Missing lat or lng query parameters'
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'], // Path to the API docs
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs }; 