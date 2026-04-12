import { Controller, Post, Body, Logger } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { AnalyzeDto } from './dto/analyze.dto';

@Controller('')
export class AnalyzeController {
  private logger = new Logger(AnalyzeController.name);

  constructor(private readonly analyzeService: AnalyzeService) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeDto) {
    this.logger.log(`Requisicao de analise recebida para: ${dto.url}`);
    return this.analyzeService.analyze(dto.url);
  }
}
