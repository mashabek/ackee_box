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
      }
    }
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'], // Path to the API docs
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs }; 