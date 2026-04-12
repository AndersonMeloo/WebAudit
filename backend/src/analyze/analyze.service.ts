import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { PageFetcherService } from './fetcher/page-fetcher.service';
import { HtmlParserService } from './parser/html-parser.service';
import { SeoAnalyzerService } from './seo/seo-analyzer.service';
import { W3cValidatorService } from './validator/w3c-validator.service';
import { AnalyzeResult } from './interfaces/analyze-result.interface';

interface CachePayload {
  seo_score: number;
  seo_issues: AnalyzeResult['seo_issues'];
  html_errors: AnalyzeResult['html_errors'];
  css_errors: AnalyzeResult['css_errors'];
}

@Injectable()
export class AnalyzeService {
  private logger = new Logger(AnalyzeService.name);

  constructor(
    private readonly cache: CacheService,
    private readonly fetcher: PageFetcherService,
    private readonly parser: HtmlParserService,
    private readonly seo: SeoAnalyzerService,
    private readonly validator: W3cValidatorService,
  ) {}

  async analyze(url: string): Promise<AnalyzeResult> {
    const cacheKey = `analyze:${url}`;

    return this.cache.deduplicate(cacheKey, async () => {
      this.logger.log(`Analisando ${url} (cache vazio ou primeira requisicao)`);

      // 1. Buscar a página
      const page = await this.fetcher.fetch(url);
      const effectiveUrl = page.finalUrl;

      // 2. Processar o HTML
      const parsed = this.parser.parse(page.html, effectiveUrl);

      // 3. Executar analise de SEO
      const { score, issues } = this.seo.analyze(parsed);

      // 4. Executar validações W3C em paralelo
      const [htmlErrors, cssErrors] = await Promise.all([
        this.validator.validateHtml(effectiveUrl),
        this.validator.validateCss(effectiveUrl),
      ]);

      const result: AnalyzeResult = {
        url: effectiveUrl,
        seo_score: score,
        seo_issues: issues,
        html_errors: htmlErrors,
        css_errors: cssErrors,
      };

      this.logger.log(
        `Analise concluida para ${effectiveUrl}: score=${score}, html_errors=${htmlErrors.length}, css_errors=${cssErrors.length}`,
      );

      return result;
    });
  }
}
