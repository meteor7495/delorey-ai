import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthContext } from '../platform/auth.guard';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ auth?: AuthContext }>();
    const email = req.auth?.email;
    const list = (this.config.get<string>('PLATFORM_ADMIN_EMAILS') ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!email || list.length === 0 || !list.includes(email.toLowerCase())) {
      throw new ForbiddenException('دسترسی مدیریت پلتفرم ندارید');
    }
    return true;
  }
}
