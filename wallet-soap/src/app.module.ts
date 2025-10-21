import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/Client';
import { PaymentSession } from './entities/PaymentSession';
import { WalletSoapService } from './soap/wallet-soap.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'mysql',
        host: cfg.get('DB_HOST'),
        port: parseInt(cfg.get('DB_PORT') || '3306', 10),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASSWORD'),
        database: cfg.get('DB_NAME'),
        entities: [Client, PaymentSession],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Client, PaymentSession]),
  ],
  providers: [WalletSoapService],
})
export class AppModule {} 