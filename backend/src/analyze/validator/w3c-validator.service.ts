import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ValidationError, CssError } from '../interfaces/analyze-result.interface';

@Injectable()
export class W3cValidatorService {
  private logger = new Logger(W3cValidatorService.name);

  async validateHtml(url: string): Promise<ValidationError[]> {
    const validatorUrl = `https://validator.w3.org/nu/?out=json&doc=${encodeURIComponent(url)}`;

    try {
      const response = await axios.get(validatorUrl, {
        headers: {
          'User-Agent': 'WebAudit/1.0',
        },
        maxRedirects: 5,
        timeout: 30000,
      });

      const messages = response.data.messages ?? [];

      return messages
        .filter((msg: { type?: string }) => msg.type === 'error' || msg.type === 'warning' || msg.type === 'info')
        .map((msg: { message: string; type: string; lastLine?: number; lastColumn?: number; subType?: string }) => ({
          message: this.stripHtmlTags(msg.message),
          type: msg.type,
          line: msg.lastLine,
          column: msg.lastColumn,
          subType: msg.subType,
        }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      this.logger.error(`Falha na validacao HTML para ${url}: ${message}`);
      return [{
        message: `Servico de validacao HTML indisponivel: ${message}`,
        type: 'warning',
      }];
    }
  }

  async validateCss(url: string): Promise<CssError[]> {
    const validatorUrl = `https://jigsaw.w3.org/css-validator/validator?uri=${encodeURIComponent(url)}&output=json`;

    try {
      const response = await axios.get(validatorUrl, {
        headers: {
          'User-Agent': 'WebAudit/1.0',
        },
        maxRedirects: 5,
        timeout: 30000,
      });

      const cssResult = response.data;
      const errors: CssError[] = [];

      // Processa erros de CSS retornados pelo validador
      const cssErrors = cssResult.css?.validation?.errors ?? [];
      for (const error of cssErrors) {
        errors.push({
          message: this.stripHtmlTags(error.message ?? 'Erro CSS desconhecido'),
          level: 'error',
          line: error.line,
          context: error.context || '',
          property: error.property,
        });
      }

      // Processa avisos de CSS
      const cssWarnings = cssResult.css?.validation?.warnings ?? [];
      for (const warning of cssWarnings) {
        errors.push({
          message: this.stripHtmlTags(warning.message ?? 'Aviso CSS desconhecido'),
          level: 'warning',
          line: warning.line,
          context: warning.context || '',
          property: warning.property,
        });
      }

      return errors;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      this.logger.error(`Falha na validacao CSS para ${url}: ${message}`);
      return [{
        message: `Servico de validacao CSS indisponivel: ${message}`,
        level: 'warning',
      }];
    }
  }

  private stripHtmlTags(text: string): string {
    return text.replace(/<[^>]*>/g, '').trim();
  }
}
