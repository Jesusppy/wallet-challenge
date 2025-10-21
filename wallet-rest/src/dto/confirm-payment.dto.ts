import { ApiProperty } from '@nestjs/swagger';

export class ConfirmPaymentDto {
  @ApiProperty() session_id: string;
  @ApiProperty({ example: '123456', description: 'Token de 6 dígitos' }) token: string;
}