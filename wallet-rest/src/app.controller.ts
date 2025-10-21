import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { SoapClient, StandardResponse } from './soap/soap.client';
import { ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RegisterClientDto } from './dto/register-client.dto';
import { TopUpWalletDto } from './dto/topup-wallet.dto';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { BalanceDataDto, ClientIdDataDto, InitiateDataDto, StandardResponseDto } from './dto/standard-response.dto';

type ClientIdData = { client_id: string };
type BalanceData = { balance: string };
type InitiateData = { session_id: string; message: string };

@ApiTags('Wallet')
@Controller()
export class AppController {
  private soap = new SoapClient(process.env.SOAP_URL!, process.env.API_KEY);

  @Post('clients/register')
  @ApiOperation({ summary: 'Registrar cliente' })
  @ApiBody({ type: RegisterClientDto })
  @ApiOkResponse({ description: 'Respuesta estándar', type: StandardResponseDto<ClientIdDataDto> as any })
  async register(@Body() body: RegisterClientDto): Promise<StandardResponse<ClientIdData>> {
    return this.soap.call<ClientIdData>('RegisterClient', body as any);
  }

  @Post('wallet/topup')
  @ApiOperation({ summary: 'Recargar billetera' })
  @ApiBody({ type: TopUpWalletDto })
  @ApiOkResponse({ description: 'Respuesta estándar', type: StandardResponseDto<BalanceDataDto> as any })
  async topup(@Body() body: TopUpWalletDto): Promise<StandardResponse<BalanceData>> {
    return this.soap.call<BalanceData>('TopUpWallet', body as any);
  }

  @Post('payments/initiate')
  @ApiOperation({ summary: 'Iniciar pago (envía token por email)' })
  @ApiBody({ type: InitiatePaymentDto })
  @ApiOkResponse({ description: 'Respuesta estándar', type: StandardResponseDto<InitiateDataDto> as any })
  async initiate(@Body() body: InitiatePaymentDto): Promise<StandardResponse<InitiateData>> {
    return this.soap.call<InitiateData>('InitiatePayment', body as any);
  }

  @Post('payments/confirm')
  @ApiOperation({ summary: 'Confirmar pago con token' })
  @ApiBody({ type: ConfirmPaymentDto })
  @ApiOkResponse({ description: 'Respuesta estándar', type: StandardResponseDto<BalanceDataDto> as any })
  async confirm(@Body() body: ConfirmPaymentDto): Promise<StandardResponse<BalanceData>> {
    return this.soap.call<BalanceData>('ConfirmPayment', body as any);
  }

  @Get('wallet/balance')
  @ApiOperation({ summary: 'Consultar saldo' })
  @ApiQuery({ name: 'document', type: String })
  @ApiQuery({ name: 'phone', type: String })
  @ApiOkResponse({ description: 'Respuesta estándar', type: StandardResponseDto<BalanceDataDto> as any })
  async balance(
    @Query('document') document: string,
    @Query('phone') phone: string,
  ): Promise<StandardResponse<BalanceData>> {
    return this.soap.call<BalanceData>('GetBalance', { document, phone });
  }
}