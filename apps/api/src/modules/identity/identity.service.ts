import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';

@Injectable()
export class IdentityService {
  constructor(private readonly store: DataStore) {}

  async signup(email: string, password: string, workspaceName: string) {
    const normalized = email.trim().toLowerCase();
    if (await this.store.findUserByEmail(normalized)) {
      throw new ConflictException('Email already registered');
    }
    const userId = uuid();
    const tenantId = uuid();
    const passwordHash = await bcrypt.hash(password, 10);
    await this.store.createUser({
      id: userId,
      email: normalized,
      passwordHash,
    });
    await this.store.createTenant({
      id: tenantId,
      name: workspaceName,
      ownerUserId: userId,
    });
    await this.store.addMembership({ userId, tenantId, role: 'owner' });
    await this.store.provisionTenantDefaults(tenantId);
    return this.issueSession(userId, tenantId);
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.store.findUserByEmail(normalized);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const membership = await this.store.findMembershipByUser(user.id);
    if (!membership) throw new UnauthorizedException('No workspace');
    return this.issueSession(user.id, membership.tenantId);
  }

  private async issueSession(userId: string, tenantId: string) {
    const token = uuid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await this.store.createSession({ token, userId, tenantId, expiresAt });
    const tenant = await this.store.findTenant(tenantId);
    const user = await this.store.findUserById(userId);
    return {
      token,
      expiresAt,
      user: { id: userId, email: user?.email },
      tenant: { id: tenantId, name: tenant?.name },
    };
  }
}
