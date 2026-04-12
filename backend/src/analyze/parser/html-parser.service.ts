import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface ParsedData {
  title: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  images: { src: string; alt: string | undefined }[];
  links: { href: string; text: string; isExternal: boolean }[];
  inlineStyles: { css: string; line?: number }[];
}

@Injectable()
export class HtmlParserService {
  parse(html: string, baseUrl: string): ParsedData {
    const $ = cheerio.load(html);

    const title = $('head title').first().text().trim();
    const metaDescription =
      $('head meta[name="description"]').first().attr('content')?.trim() ?? '';

    const headings: { level: string; text: string }[] = [];
    $('h1, h2, h3, h4, h5, h6').each((_, el) => {
      const tag = el.tagName.toLowerCase();
      const text = $(el).text().trim();
      if (text) headings.push({ level: tag, text });
    });

    const images: { src: string; alt: string | undefined }[] = [];
    $('img').each((_, el) => {
      images.push({
        src: $(el).attr('src') || '',
        alt: $(el).attr('alt'),
      });
    });

    const baseHost = this.extractHost(baseUrl);
    const links: { href: string; text: string; isExternal: boolean }[] = [];
    $('a').each((_, el) => {
      const href = $(el).attr('href') || '';
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const linkHost = this.extractHost(href);
        links.push({
          href,
          text: $(el).text().trim(),
          isExternal: linkHost !== baseHost,
        });
      }
    });

    // Extrai blocos inline <style> para validacao de CSS
    const inlineStyles: { css: string; line?: number }[] = [];
    $('style').each((_, el) => {
      inlineStyles.push({ css: $(el).html() || '' });
    });

    // Extrai atributos inline style
    $('[style]').each((_, el) => {
      inlineStyles.push({ css: $(el).attr('style') || '' });
    });

    return { title, metaDescription, headings, images, links, inlineStyles };
  }

  private extractHost(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
}
