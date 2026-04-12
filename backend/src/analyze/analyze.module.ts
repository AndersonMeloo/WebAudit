import { Module } from '@nestjs/common';
import { AnalyzeController } from './analyze.controller';
import { AnalyzeService } from './analyze.service';
import { PageFetcherService } from './fetcher/page-fetcher.service';
import { HtmlParserService } from './parser/html-parser.service';
import { SeoAnalyzerService } from './seo/seo-analyzer.service';
import { W3cValidatorService } from './validator/w3c-validator.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [AnalyzeController],
  providers: [
    AnalyzeService,
    PageFetcherService,
    HtmlParserService,
    SeoAnalyzerService,
    W3cValidatorService,
  ],
  exports: [AnalyzeService],
})
export class AnalyzeModule {}
