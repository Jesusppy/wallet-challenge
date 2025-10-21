import { ApiProperty } from '@nestjs/swagger';

export class ClientIdDataDto {
  @ApiProperty() client_id: string;
}

export class BalanceDataDto {
  @ApiProperty() balance: string;
}

export class InitiateDataDto {
  @ApiProperty() session_id: string;
  @ApiProperty() message: string;
}

export class StandardResponseDto<TData> {
  @ApiProperty() success: boolean;
  @ApiProperty() cod_error: string;
  @ApiProperty() message_error: string;
  @ApiProperty({ required: false }) data: TData;
}