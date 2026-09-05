import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthContext } from './auth.guard';
import { DataStore } from './data.store';
import { hasAiEmployeeEntitlement } from './entitlements';

@Injectable()
export class AiEmployeeEntitlementGuard implements CanActivate {
  constructor(private readonly store: DataStore) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{ auth?: AuthContext }>();
    if (!req.auth?.tenantId) {
      throw new UnauthorizedException('Missing session');
    }
    const tenant = await this.store.findTenant(req.auth.tenantId);
    if (!hasAiEmployeeEntitlement(tenant?.plan)) {
      throw new ForbiddenException(
        'بسته دستیار هوشمند برای این فروشگاه فعال نیست',
      );
    }
    return true;
  }
}
