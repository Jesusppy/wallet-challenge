import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../entities/Client';
import { PaymentSession } from '../entities/PaymentSession';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { createHash, randomInt, randomUUID } from 'crypto';

type StandardResponse<T = unknown> = {
  success: boolean;
  cod_error: string;
  message_error: string;
  data: T;
};

function ok<T = unknown>(data: T): StandardResponse<T> {
  return { success: true, cod_error: '00', message_error: '', data };
}
function err<T = unknown>(code: string, message: string): StandardResponse<T> {
  return { success: false, cod_error: code, message_error: message, data: {} as T };
}

@Injectable()
export class WalletSoapService {
  private mailer: Transporter;

  constructor(
    @InjectRepository(Client) private clients: Repository<Client>,
    @InjectRepository(PaymentSession) private sessions: Repository<PaymentSession>,
    private cfg: ConfigService,
  ) {
    this.mailer = createTransport({
      host: this.cfg.get<string>('MAIL_HOST'),
      port: Number(this.cfg.get<string>('MAIL_PORT') || 1025),
    });
  }

  private authorize(req?: any): StandardResponse<never> | null {
    const expected = this.cfg.get<string>('API_KEY');
    if (!expected) return null;
    const header =
      req?.headers?.['x-api-key'] ??
      req?.headers?.['X-API-KEY'] ??
      req?.headers?.['x-api_key'] ??
      req?.headers?.['x-apiKey'];
    if (header === expected) return null;
    return err('07', 'No autorizado') as unknown as StandardResponse<never>;
  }

  // Registro Clientes
  async RegisterClient(
    args: {
      document: string;
      names: string;
      email: string;
      phone: string;
    },
    _cb?: unknown,
    _headers?: unknown,
    req?: any,
  ): Promise<StandardResponse<{ client_id: string }>> {
    const unauthorized = this.authorize(req);
    if (unauthorized) return unauthorized as unknown as StandardResponse<{ client_id: string }>;

    const { document, names, email, phone } = args || ({} as any);
    if (!document || !names || !email || !phone) return err('01', 'Campos requeridos faltantes');

    const exists = await this.clients.findOne({ where: [{ document, phone }, { email }] as any });
    if (exists) return err('02', 'Cliente ya existe');

    const c = this.clients.create({ document, names, email, phone, balance: '0.00' });
    await this.clients.save(c);
    return ok({ client_id: c.id });
  }

  // Recarga Billetera
  async TopUpWallet(
    args: {
      document: string;
      phone: string;
      amount: number;
    },
    _cb?: unknown,
    _headers?: unknown,
    req?: any,
  ): Promise<StandardResponse<{ balance: string }>> {
    const unauthorized = this.authorize(req);
    if (unauthorized) return unauthorized as unknown as StandardResponse<{ balance: string }>;

    const { document, phone, amount } = args || ({} as any);
    if (!document || !phone || !amount || Number(amount) <= 0) return err('01', 'Parámetros inválidos');

    const c = await this.clients.findOne({ where: { document, phone } });
    if (!c) return err('03', 'Cliente no encontrado');

    c.balance = (Number(c.balance) + Number(amount)).toFixed(2);
    await this.clients.save(c);

    return ok({ balance: c.balance });
  }

  // Iniciar pago (genera token y envía email)
  async InitiatePayment(
    args: {
      document: string;
      phone: string;
      amount: number;
      description?: string;
    },
    _cb?: unknown,
    _headers?: unknown,
    req?: any,
  ): Promise<StandardResponse<{ session_id: string; message: string }>> {
    const unauthorized = this.authorize(req);
    if (unauthorized) return unauthorized as unknown as StandardResponse<{ session_id: string; message: string }>;

    const { document, phone, amount } = args || ({} as any);
    if (!document || !phone || !amount || Number(amount) <= 0) return err('01', 'Parámetros inválidos');

    const c = await this.clients.findOne({ where: { document, phone } });
    if (!c) return err('03', 'Cliente no encontrado');
    if (Number(c.balance) < Number(amount)) return err('04', 'Fondos insuficientes');

    const token = String(randomInt(0, 999999)).padStart(6, '0');
    const token_hash = createHash('sha256').update(token).digest('hex');
    const session_id = randomUUID();
    const ttlMin = Number(this.cfg.get('TOKEN_TTL_MINUTES') || 10);
    const expires_at = new Date(Date.now() + ttlMin * 60_000);

    const s = this.sessions.create({
      session_id,
      client: c,
      amount: String(amount),
      token_hash,
      expires_at,
      status: 'PENDING',
    });
    await this.sessions.save(s);

    await this.mailer.sendMail({
      from: this.cfg.get('MAIL_FROM') || 'no-reply@wallet.local',
      to: c.email,
      subject: 'Token de confirmación',
      text: `Tu token es: ${token}`,
    });

    return ok({ session_id, message: 'Se envió el token a su correo' });
  }

  // Confirmar pago
  async ConfirmPayment(
    args: {
      session_id: string;
      token: string;
    },
    _cb?: unknown,
    _headers?: unknown,
    req?: any,
  ): Promise<StandardResponse<{ balance: string }>> {
    const unauthorized = this.authorize(req);
    if (unauthorized) return unauthorized as unknown as StandardResponse<{ balance: string }>;

    const { session_id, token } = args || ({} as any);
    if (!session_id || !token) return err('01', 'Parámetros inválidos');

    const s = await this.sessions.findOne({
      where: { session_id },
      relations: { client: true },
    });
    if (!s) return err('03', 'Sesión no encontrada');
    if (s.status !== 'PENDING') return err('06', 'Estado de sesión inválido');

    if (new Date() > new Date(s.expires_at)) {
      s.status = 'EXPIRED';
      await this.sessions.save(s);
      return err('06', 'Sesión expirada');
    }

    const token_hash = createHash('sha256').update(token).digest('hex');
    if (token_hash !== s.token_hash) return err('05', 'Token inválido');

    const c = s.client;
    const amount = Number(s.amount);
    if (Number(c.balance) < amount) return err('04', 'Fondos insuficientes');

    c.balance = (Number(c.balance) - amount).toFixed(2);
    await this.clients.save(c);

    s.status = 'CONFIRMED';
    await this.sessions.save(s);

    return ok({ balance: c.balance });
  }

  // Consultar saldo
  async GetBalance(
    args: {
      document: string;
      phone: string;
    },
    _cb?: unknown,
    _headers?: unknown,
    req?: any,
  ): Promise<StandardResponse<{ balance: string }>> {
    const unauthorized = this.authorize(req);
    if (unauthorized) return unauthorized as unknown as StandardResponse<{ balance: string }>;

    const { document, phone } = args || ({} as any);
    if (!document || !phone) return err('01', 'Parámetros inválidos');

    const c = await this.clients.findOne({ where: { document, phone } });
    if (!c) return err('03', 'Cliente no encontrado');

    return ok({ balance: c.balance });
  }
}