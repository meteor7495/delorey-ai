import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { IdentityService } from './identity.service';

class SignupDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  workspaceName!: string;
}

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.identity.signup(dto.email, dto.password, dto.workspaceName);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.identity.login(dto.email, dto.password);
  }
}
