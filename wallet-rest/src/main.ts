import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Wallet REST API')
    .setDescription('Endpoints REST que consumen el servicio SOAP de Wallet')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
  // eslint-disable-next-line no-console
  console.log(`Swagger disponible en http://localhost:${process.env.PORT ?? 3000}/docs`);
}
bootstrap();