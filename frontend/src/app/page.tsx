'use client';

import { useState } from 'react';
import { AnalyzeResult, SeoIssue, HtmlError, CssError } from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type AnalysisStatus = 'idle' | 'loading' | 'error' | 'success';

function validateUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return 'Informe uma URL';
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'A URL deve usar http:// ou https://';
    }
    return null;
  } catch {
    return 'Informe uma URL valida (ex.: https://example.com)';
  }
}

function getSeverityClass(severity: string): string {
  switch (severity) {
    case 'error':
      return 'sev-error';
    case 'warning':
      return 'sev-warning';
    case 'info':
      return 'sev-info';
    default:
      return 'sev-info';
  }
}

function EmptyState() {

  return (

    <div className="empty-state">
      <svg
        width="64"
        height="64"
        fill="none"
        viewBox="0 0 24 24"
        stroke="var(--text-muted)"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <p>Informe uma URL acima e clique em Analisar para comecar.</p>
    </div>
    
  );
}

function ResultsSection<T>({
  title,
  items,
  severityOf,
  messageOf,
  suggestionOf,
  lineOf,
}: {
  title: string;
  items: T[];
  severityOf: (item: T) => string;
  messageOf: (item: T) => string;
  suggestionOf?: (item: T) => string | undefined;
  lineOf?: (item: T) => string | undefined;
}) {
  const [open, setOpen] = useState(true);

  const errors = items.filter((i) => severityOf(i) === 'error').length;
  const warnings = items.filter((i) => severityOf(i) === 'warning').length;

  let badgeText: string;
  let badgeClass: string;
  if (items.length === 0) {
    badgeText = 'Sem problemas';
    badgeClass = 'badge-ok';
  } else if (errors > 0) {
    badgeText = `${errors} erro${errors > 1 ? 's' : ''}`;
    badgeClass = 'badge-error';
  } else {
    badgeText = `${warnings} aviso${warnings > 1 ? 's' : ''}`;
    badgeClass = 'badge-warning';
  }

  return (
    <div className="results-section">
      <div className="section-header" onClick={() => setOpen(!open)}>
        <span className="section-title">{title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`section-badge ${badgeClass}`}>{badgeText}</span>
          <span className={`section-chevron ${open ? 'open' : ''}`}>&#9660;</span>
        </div>
      </div>
      {open && (
        <div className="issue-list">
          {items.length === 0 ? (
            <div
              style={{
                padding: '1.25rem',
                textAlign: 'center',
                color: 'var(--success)',
              }}
            >
              Tudo certo! Nenhum problema encontrado.
            </div>
          ) : (
            items.map((item, idx) => (
              <div className="issue-item" key={idx}>
                <div
                  className={`issue-severity ${getSeverityClass(severityOf(item))}`}
                />
                <div className="issue-content">
                  <div className="issue-message">{messageOf(item)}</div>
                  {lineOf && lineOf(item) && (
                    <div className="issue-line">{lineOf(item)}</div>
                  )}
                  {suggestionOf && suggestionOf(item) && (
                    <div className="issue-suggestion">{suggestionOf(item)}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [serverError, setServerError] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError('');
    setInputError(null);

    const err = validateUrl(url);
    if (err) {
      setInputError(err);
      return;
    }

    setStatus('loading');
    setAnalyzing(true);

    try {
      const res = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.message || `O servidor respondeu com status ${res.status}`
        );
      }

      const data: AnalyzeResult = await res.json();
      setResult(data);
      setStatus('success');
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Erro desconhecido');
      setStatus('error');
    } finally {
      setAnalyzing(false);
    }
  }

  function getScoreColor(score: number): string {
    if (score >= 80) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--error)';
  }

  return (
    <main className="container">
      <header>
        <h1>WebAudit</h1>
        <p>Analisador de SEO, HTML e CSS com validadores reais do W3C</p>
      </header>

      <form className="search-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (inputError) setInputError(null);
          }}
          disabled={analyzing}
        />
        <button type="submit" disabled={analyzing}>
          {analyzing ? 'Analisando…' : 'Analisar'}
        </button>
      </form>

      {inputError && <p className="input-error">{inputError}</p>}

      {serverError && (
        <div className="server-error">
          <strong>Falha na analise:</strong> {serverError}
        </div>
      )}

      {status === 'loading' && (
        <div className="loading">
          <div className="spinner" />
          <p>
            Analisando pagina… Buscando conteudo e consultando os validadores do W3C.
          </p>
        </div>
      )}

      {status === 'idle' && <EmptyState />}

      {status === 'success' && result && (
        <>
          <div className="score-section">
            <div className="score-label">Pontuação SEO</div>
            <div className="score-bar-outer">
              <div
                className="score-bar-inner"
                style={{
                  width: `${result.seo_score}%`,
                  background: getScoreColor(result.seo_score),
                }}
              />
            </div>
            <div className="score-sub">
              {result.seo_score} / 100 &middot; {result.url}
            </div>
          </div>

          {/* Problemas de SEO */}
          <ResultsSection
            title="Problemas de SEO"
            items={result.seo_issues}
            severityOf={(item: SeoIssue) => item.severity}
            messageOf={(item: SeoIssue) => item.message}
            suggestionOf={(item: SeoIssue) => item.suggestion}
          />

          {/* Erros de HTML */}
          <ResultsSection
            title="Validacao HTML"
            items={result.html_errors}
            severityOf={(item: HtmlError) => item.type || 'error'}
            messageOf={(item: HtmlError) => item.message}
            lineOf={(item: HtmlError) =>
              item.line ? `Linha ${item.line}` : undefined
            }
          />

          {/* Erros de CSS */}
          <ResultsSection
            title="Validacao CSS"
            items={result.css_errors}
            severityOf={(item: CssError) => item.level}
            messageOf={(item: CssError) => item.message}
            lineOf={(item: CssError) =>
              item.line ? `Linha ${item.line}` : undefined
            }
          />
        </>
      )}
    </main>
  );
}
