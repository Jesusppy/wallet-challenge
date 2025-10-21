import { ApiProperty } from '@nestjs/swagger';

export class InitiatePaymentDto {
  @ApiProperty() document: string;
  @ApiProperty() phone: string;
  @ApiProperty({ example: 20000 }) amount: number;
  @ApiProperty({ required: false }) description?: string;
}