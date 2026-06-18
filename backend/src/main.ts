import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // OWASP Mitigations
  app.use(helmet());
  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // Swagger OpenAPI 3.0 Documentation
  const config = new DocumentBuilder()
    .setTitle('QuantumTrust Core API')
    .setDescription('Quantum-Safe Encrypted Storage and Auditing Platform API Specifications.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
}
bootstrap();
