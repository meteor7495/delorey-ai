import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { AccessService } from './access.service';

class AccessRequestDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @MinLength(5)
  email!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  @MinLength(2)
  shopName!: string;

  @IsString()
  plan!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

@Controller('public/access-requests')
export class AccessController {
  constructor(private readonly access: AccessService) {}

  @Post()
  submit(@Body() dto: AccessRequestDto) {
    return this.access.submitRequest(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.access.getRequest(id);
  }

  @Post(':id/confirm-payment')
  confirm(@Param('id') id: string) {
    return this.access.confirmPayment(id);
  }
}
