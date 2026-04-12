export interface SeoIssue {
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface HtmlError {
  message: string;
  type?: 'error' | 'warning' | 'info';
  line?: number;
  column?: number;
  subType?: string;
}

export interface CssError {
  message: string;
  level: 'error' | 'warning';
  line?: number;
  context?: string;
  property?: string;
}

export interface AnalyzeResult {
  url: string;
  seo_score: number;
  seo_issues: SeoIssue[];
  html_errors: HtmlError[];
  css_errors: CssError[];
}
