import { Module, forwardRef } from '@nestjs/common';
import { HsmService } from './hsm.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [forwardRef(() => IntegrationsModule)],
  providers: [HsmService],
  exports: [HsmService],
})
export class HsmModule {}
