import { ApiProperty } from '@nestjs/swagger';

export class TopUpWalletDto {
  @ApiProperty() document: string;
  @ApiProperty() phone: string;
  @ApiProperty({ example: 50000 }) amount: number;
}