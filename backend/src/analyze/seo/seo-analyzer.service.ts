import { Injectable } from '@nestjs/common';
import { ParsedData } from '../parser/html-parser.service';
import { SeoIssue } from '../interfaces/analyze-result.interface';

@Injectable()
export class SeoAnalyzerService {
  analyze(data: ParsedData): { score: number; issues: SeoIssue[] } {
    const issues: SeoIssue[] = [];
    let deductions = 0;

    // Analise do titulo
    if (!data.title) {
      issues.push({
        rule: 'missing_title',
        message: 'A pagina não possui a tag <title>.',
        severity: 'error',
        suggestion: 'Adicione uma tag <title> dentro de <head>. O ideal e ter entre 30 e 60 caracteres.',
      });
      deductions += 20;
    } else {
      if (data.title.length < 30) {
        issues.push({
          rule: 'title_too_short',
          message: `O titulo possui apenas ${data.title.length} caracteres (< 30).`,
          severity: 'warning',
          suggestion: 'Aumente o titulo para ficar entre 30 e 60 caracteres e melhorar a visibilidade na busca.',
        });
        deductions += 5;
      }
      if (data.title.length > 60) {
        issues.push({
          rule: 'title_too_long',
          message: `O titulo possui ${data.title.length} caracteres (> 60) e pode ser truncado nos resultados de busca.`,
          severity: 'warning',
          suggestion: 'Reduza o titulo para 60 caracteres ou menos.',
        });
        deductions += 5;
      }
    }

    // Analise da meta description
    if (!data.metaDescription) {
      issues.push({
        rule: 'missing_meta_description',
        message: 'A pagina não possui a tag <meta name="description">.',
        severity: 'error',
        suggestion: 'Adicione uma meta description (120 a 160 caracteres) resumindo o conteudo da pagina.',
      });
      deductions += 15;
    } else if (data.metaDescription.length < 50) {
      issues.push({
        rule: 'meta_description_too_short',
        message: `A meta description possui apenas ${data.metaDescription.length} caracteres.`,
        severity: 'warning',
        suggestion: 'Aumente a meta description para 120 a 160 caracteres.',
      });
      deductions += 5;
    } else if (data.metaDescription.length > 160) {
      issues.push({
        rule: 'meta_description_too_long',
        message: `A meta description possui ${data.metaDescription.length} caracteres (> 160) e pode ser mudada.`,
        severity: 'warning',
        suggestion: 'Mantenha a meta description entre 120 e 160 caracteres.',
      });
      deductions += 5;
    }

    // Analise de H1
    const h1s = data.headings.filter((h) => h.level === 'h1');
    if (h1s.length === 0) {
      issues.push({
        rule: 'missing_h1',
        message: 'A pagina não possui a tag <h1>.',
        severity: 'error',
        suggestion: 'Adicione exatamente uma tag <h1> que descreva o tema principal da pagina.',
      });
      deductions += 15;
    } else if (h1s.length > 1) {
      issues.push({
        rule: 'multiple_h1',
        message: `A pagina possui ${h1s.length} tags <h1>. A boa pratica e ter apenas uma.`,
        severity: 'warning',
        suggestion: 'Use somente um <h1> por pagina. Rebaixe os demais para <h2> ou niveis inferiores.',
      });
      deductions += 10;
    }

    // Verificacao da hierarquia de headings
    if (data.headings.length > 0) {
      for (let i = 1; i < data.headings.length; i++) {
        const currentLevel = parseInt(data.headings[i].level.replace('h', ''), 10);
        const prevLevel = parseInt(data.headings[i - 1].level.replace('h', ''), 10);
        if (currentLevel > prevLevel + 1) {
          issues.push({
            rule: 'skipped_heading_level',
            message: `A hierarquia de headings pula niveis: <h${prevLevel}> seguido de <h${currentLevel}>.`,
            severity: 'warning',
            suggestion: 'não pule niveis de heading para manter a estrutura correta do documento.',
          });
          deductions += 3;
        }
      }
    }

    // Analise de alt nas imagens
    const imagesWithoutAlt = data.images.filter((img) => !img.alt && img.alt !== '');
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        rule: 'images_missing_alt',
        message: `${imagesWithoutAlt.length} imagem(ns) sem atributo "alt".`,
        severity: 'error',
        suggestion: 'Adicione texto alt descritivo em todas as imagens para acessibilidade e SEO.',
      });
      deductions += Math.min(imagesWithoutAlt.length * 2, 15);
    }

    // Verificacao de links vazios
    const emptyLinks = data.links.filter((l) => !l.text.trim());
    if (emptyLinks.length > 0) {
      issues.push({
        rule: 'empty_links',
        message: `${emptyLinks.length} link(s) não possuem texto visivel.`,
        severity: 'warning',
        suggestion: 'Adicione textos descritivos em todos os links para melhorar SEO e acessibilidade.',
      });
      deductions += Math.min(emptyLinks.length, 5);
    }

    const score = Math.max(0, 100 - deductions);

    return { score, issues };
  }
}
