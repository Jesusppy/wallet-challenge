import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createServer, Server } from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as soap from 'soap';
import { WalletSoapService } from './soap/wallet-soap.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const server: Server = createServer(app.getHttpAdapter().getInstance());

  const distWsdl = path.join(__dirname, 'wsdl', 'wallet.wsdl');
  const srcWsdl = path.join(process.cwd(), 'src', 'wsdl', 'wallet.wsdl');
  const wsdlPath = fs.existsSync(distWsdl) ? distWsdl : srcWsdl;
  const wsdl = fs.readFileSync(wsdlPath, 'utf8');

  const svc = app.get<WalletSoapService>(WalletSoapService);

  const serviceDef: any = {
    WalletService: {
      WalletPort: {
        RegisterClient: svc.RegisterClient.bind(svc),
        TopUpWallet: svc.TopUpWallet.bind(svc),
        InitiatePayment: svc.InitiatePayment.bind(svc),
        ConfirmPayment: svc.ConfirmPayment.bind(svc),
        GetBalance: svc.GetBalance.bind(svc),
      },
    },
  };

  soap.listen(server, '/wsdl', serviceDef, wsdl, () => {
    console.log('SOAP mounted at /wsdl');
  });

  const port = Number(process.env.PORT || 3001);
  server.listen(port, '0.0.0.0', () =>
    console.log(`SOAP service listening on ${port} (WSDL at /wsdl?wsdl)`),
  );
}

void bootstrap();