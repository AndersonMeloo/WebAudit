import { Module } from '@nestjs/common';
import { AnalyzeModule } from './analyze/analyze.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AnalyzeModule],
})
export class AppModule {}
