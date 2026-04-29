import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TorvoSmsService } from './torvo-sms.service';

@Module({
  imports: [ConfigModule],
  providers: [TorvoSmsService],
  exports: [TorvoSmsService],
})
export class SmsModule {}
