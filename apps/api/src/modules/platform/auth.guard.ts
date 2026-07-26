import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { DataStore } from './data.store';

export type AuthContext = {
  userId: string;
  tenantId: string;
  email: string;
};

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly store: DataStore) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      auth?: AuthContext;
    }>();
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('Missing session');
    const session = await this.store.findSession(token);
    if (!session || new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedException('Invalid session');
    }
    const user = await this.store.findUserById(session.userId);
    if (!user) throw new UnauthorizedException('User missing');
    req.auth = {
      userId: session.userId,
      tenantId: session.tenantId,
      email: user.email,
    };
    return true;
  }
}

export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const req = ctx.switchToHttp().getRequest<{ auth?: AuthContext }>();
    if (!req.auth) throw new UnauthorizedException();
    return req.auth;
  },
);
