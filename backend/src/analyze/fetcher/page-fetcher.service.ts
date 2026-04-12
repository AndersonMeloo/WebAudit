import { Injectable, BadGatewayException } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

export interface FetchedPage {
  html: string;
  finalUrl: string;
  status: number;
  contentType: string;
}

@Injectable()
export class PageFetcherService {
  private readonly timeoutMs = 15000;

  private readonly headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };

  async fetch(url: string): Promise<FetchedPage> {
    try {
      const response: AxiosResponse<string> = await axios.get(url, {
        headers: this.headers,
        timeout: this.timeoutMs,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
        responseType: 'text',
      });

      if (response.status >= 400) {
        throw new BadGatewayException(
          `Falha ao buscar a pagina: HTTP ${response.status} para ${url}`,
        );
      }

      const contentType = response.headers['content-type'] || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new BadGatewayException(
          `A URL nao retorna conteudo HTML (Content-Type: ${contentType})`,
        );
      }

      return {
        html: response.data,
        finalUrl: response.request?.res?.responseUrl ?? response.config.url ?? url,
        status: response.status,
        contentType,
      };
    } catch (error: unknown) {
      if (error instanceof BadGatewayException) throw error;
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
          throw new BadGatewayException(`Tempo limite excedido ao acessar ${url}`);
        }
        if (error.code === 'ENOTFOUND') {
          throw new BadGatewayException(`Falha na resolucao de DNS para ${url}`);
        }
      }
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      throw new BadGatewayException(`Falha ao buscar ${url}: ${message}`);
    }
  }
}
