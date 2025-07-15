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
    components?: any;
    security?: any[];
  }

  interface SwaggerOptions {
    definition: SwaggerDefinition;
    apis: string[];
  }

  function swaggerJsdoc(options: SwaggerOptions): any;
  export = swaggerJsdoc;
}

declare module 'swagger-ui-express' {
  import { RequestHandler } from 'express';
  
  export const serve: RequestHandler[];
  export function setup(swaggerDoc: any, options?: any): RequestHandler;
}