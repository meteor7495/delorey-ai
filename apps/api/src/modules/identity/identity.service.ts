import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { MemoryStore } from '../platform/memory.store';

@Injectable()
export class IdentityService {
  constructor(private readonly store: MemoryStore) {}

  async signup(email: string, password: string, workspaceName: string) {
    const normalized = email.trim().toLowerCase();
    if (this.store.usersByEmail.has(normalized)) {
      throw new ConflictException('Email already registered');
    }
    const userId = uuid();
    const tenantId = uuid();
    const passwordHash = await bcrypt.hash(password, 10);
    this.store.users.set(userId, {
      id: userId,
      email: normalized,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    this.store.usersByEmail.set(normalized, userId);
    this.store.tenants.set(tenantId, {
      id: tenantId,
      name: workspaceName,
      ownerUserId: userId,
      createdAt: new Date().toISOString(),
    });
    this.store.memberships.push({ userId, tenantId, role: 'owner' });
    this.store.provisionTenantDefaults(tenantId);
    return this.issueSession(userId, tenantId);
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const userId = this.store.usersByEmail.get(normalized);
    if (!userId) throw new UnauthorizedException('Invalid credentials');
    const user = this.store.users.get(userId);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const membership = this.store.memberships.find((m) => m.userId === userId);
    if (!membership) throw new UnauthorizedException('No workspace');
    return this.issueSession(userId, membership.tenantId);
  }

  private issueSession(userId: string, tenantId: string) {
    const token = uuid();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    this.store.sessions.set(token, { token, userId, tenantId, expiresAt });
    const tenant = this.store.tenants.get(tenantId);
    const user = this.store.users.get(userId);
    return {
      token,
      expiresAt,
      user: { id: userId, email: user?.email },
      tenant: { id: tenantId, name: tenant?.name },
    };
  }
}
