declare module 'swagger-jsdoc' {
  interface SwaggerDefinition {
    openapi?: string;
    info: {
      title: string;
      version: string;
      description?: string;
    };
    servers?: Array<{
      url: string;
      description?: string;
    }>;
    components?: Record<string, unknown>;
    security?: Record<string, unknown>[];
  }

  interface SwaggerOptions {
    definition: SwaggerDefinition;
    apis: string[];
  }

  function swaggerJsdoc(options: SwaggerOptions): Record<string, unknown>;
  export = swaggerJsdoc;
}

declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  
  export const serve: RequestHandler[];
  export function setup(swaggerDoc: Record<string, unknown>, options?: Record<string, unknown>): RequestHandler;
}