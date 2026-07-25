import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentAuth, SessionAuthGuard } from '../platform/auth.guard';
import type { AuthContext } from '../platform/auth.guard';
import { WorkspaceService } from './workspace.service';

@Controller('workspace')
@UseGuards(SessionAuthGuard)
export class WorkspaceController {
  constructor(private readonly workspace: WorkspaceService) {}

  @Get('me')
  me(@CurrentAuth() auth: AuthContext) {
    return this.workspace.getHome(auth.tenantId, auth.email);
  }
}
