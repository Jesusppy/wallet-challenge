import { ApiProperty } from '@nestjs/swagger';

export class RegisterClientDto {
  @ApiProperty() document: string;
  @ApiProperty() names: string;
  @ApiProperty() email: string;
  @ApiProperty() phone: string;
}