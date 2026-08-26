import { Module, forwardRef } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module';
import { AuditModule } from '../audit/audit.module';
import { EmployeeModule } from '../employee/employee.module';
import { McpModule } from '../mcp/mcp.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { OperatingModeService } from './operating-mode.service';
import { EmployeePermissionService } from './employee-permission.service';
import { AiActivityService } from './ai-activity.service';
import { DecisionService } from './decision.service';
import { OpportunityService } from './opportunity.service';
import { CustomerMemoryService } from './customer-memory.service';
import { CartRecoveryService } from './cart-recovery.service';
import { CommandCenterService } from './command-center.service';
import { AiOpsController } from './ai-ops.controller';

@Module({
  imports: [
    PlatformModule,
    AuditModule,
    EmployeeModule,
    forwardRef(() => McpModule),
    AnalyticsModule,
  ],
  controllers: [AiOpsController],
  providers: [
    OperatingModeService,
    EmployeePermissionService,
    AiActivityService,
    DecisionService,
    OpportunityService,
    CustomerMemoryService,
    CartRecoveryService,
    CommandCenterService,
  ],
  exports: [
    OperatingModeService,
    EmployeePermissionService,
    AiActivityService,
    DecisionService,
    OpportunityService,
    CustomerMemoryService,
    CartRecoveryService,
    CommandCenterService,
  ],
})
export class AiOpsModule {}
