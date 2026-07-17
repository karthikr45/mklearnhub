import 'reflect-metadata'

import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { securityHeaders } from '@learnhub/compliance'

import { AppModule } from './app.module'

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  )

  const config = app.get(ConfigService)
  const logger = new Logger('Bootstrap')

  // Security headers
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false,
  })

  const extraHeaders = securityHeaders({
    isProduction: config.get<string>('NODE_ENV') === 'production',
  })
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onSend', (_req, reply, payload, done) => {
      for (const [name, value] of Object.entries(extraHeaders)) {
        reply.header(name, value)
      }
      done(null, payload)
    })

  // CORS from a comma-separated whitelist (defaults to the frontend URL)
  const origins = (
    process.env.CORS_ORIGINS ??
    config.get<string>('FRONTEND_URL', 'http://localhost:3000')
  )
    .split(',')
    .map((o) => o.trim())
  app.enableCors({ origin: origins, credentials: true })

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )

  app.enableShutdownHooks()

  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('LearnHub API')
      .setDescription('LearnHub REST API')
      .setVersion('1.0')
      .addBearerAuth()
      .build()
    const document = SwaggerModule.createDocument(app, swaggerConfig)
    SwaggerModule.setup('api/docs', app, document)
  }

  const port = config.get<number>('PORT', 3001)
  await app.listen(port, '0.0.0.0')
  logger.log(`🚀 API running on http://localhost:${port}/api/v1`)
  logger.log(`📚 Swagger docs on http://localhost:${port}/api/docs`)
}

void bootstrap()
