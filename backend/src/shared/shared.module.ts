import { Module } from '@nestjs/common';
import { SchedulerLockService } from './scheduler-lock.service';

@Module({
  providers: [SchedulerLockService],
  exports: [SchedulerLockService],
})
export class SharedModule {}
