'use client';

import { useState, useEffect } from 'react';

interface GEOCheck {
  name: string;
  category: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
  recommendation?: string;
}

interface SEOMetrics {
  domainRank?: number;
  organicTraffic?: number;
  organicKeywords?: number;
  onPageScore?: number;
  pageLoadTime?: number;
  topKeywords?: Array<{
    keyword: string;
    position: number;
    searchVolume: number;
  }>;
}

interface GEOAnalysis {
  url: string;
  title: string;
  overallScore: number;
  maxScore: number;
  grade: string;
  checks: GEOCheck[];
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
  seoMetrics?: SEOMetrics;
}

const categories = [
  { name: 'Schema Markup', key: 'schema' },
  { name: 'Content Structure', key: 'content' },
  { name: 'E-E-A-T Signals', key: 'eeat' },
  { name: 'Meta & Technical', key: 'meta' },
  { name: 'AI Snippet Optimization', key: 'ai' },
];

// Traffic light color helper
function getScoreColor(percentage: number) {
  if (percentage >= 70) return { text: 'text-emerald-400', bg: 'bg-emerald-400', border: 'border-emerald-400/30' };
  if (percentage >= 40) return { text: 'text-amber-400', bg: 'bg-amber-400', border: 'border-amber-400/30' };
  return { text: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400/30' };
}

function ScoreDisplay({ score, maxScore }: { score: number; maxScore: number; grade: string }) {
  const percentage = Math.round((score / maxScore) * 100);
  const colors = getScoreColor(percentage);

  return (
    <div className="text-center">
      <div className="flex items-baseline justify-center gap-2">
        <span className={`text-8xl md:text-9xl font-light tracking-tighter ${colors.text}`}>
          {percentage}
        </span>
        <span className="text-3xl md:text-4xl font-light text-zinc-600">/100</span>
      </div>
      <div className="text-zinc-500 uppercase tracking-[0.3em] text-sm mt-2">
        GEO Score
      </div>
    </div>
  );
}

function CheckItem({ check }: { check: GEOCheck }) {
  const [expanded, setExpanded] = useState(false);

  // Determine color based on pass/partial/fail
  const getCheckColor = () => {
    if (check.passed) return { dot: 'bg-emerald-400', text: 'text-emerald-400' };
    if (check.score > 0) return { dot: 'bg-amber-400', text: 'text-amber-400' };
    return { dot: 'bg-red-400', text: 'text-red-400' };
  };

  const colors = getCheckColor();

  return (
    <div
      className="border-b border-zinc-900 last:border-b-0 cursor-pointer hover:bg-zinc-900/30 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="py-5 px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
          <div className="min-w-0">
            <h4 className="font-medium truncate">{check.name}</h4>
            <p className="text-zinc-500 text-sm truncate">{check.details}</p>
          </div>
        </div>
        <div className="text-right shrink-0 flex items-center gap-4">
          <span className={`font-mono text-sm ${colors.text}`}>
            {check.score}/{check.maxScore}
          </span>
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {expanded && check.recommendation && (
        <div className="pb-5 px-6 pl-12">
          <p className="text-zinc-400 text-sm leading-relaxed">
            {check.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

function CategoryBlock({ category, checks }: { category: typeof categories[0]; checks: GEOCheck[] }) {
  const categoryChecks = checks.filter(c => c.category === category.name);
  const categoryScore = categoryChecks.reduce((acc, c) => acc + c.score, 0);
  const categoryMax = categoryChecks.reduce((acc, c) => acc + c.maxScore, 0);
  const percentage = Math.round((categoryScore / categoryMax) * 100);
  const colors = getScoreColor(percentage);

  return (
    <div className="border border-zinc-900">
      <div className="p-6 border-b border-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{category.name}</h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-[2px] bg-zinc-900 overflow-hidden">
              <div
                className={`h-full ${colors.bg} animate-progress`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className={`font-mono text-sm w-16 text-right ${colors.text}`}>{percentage}%</span>
          </div>
        </div>
      </div>
      <div>
        {categoryChecks.map((check, idx) => (
          <CheckItem key={idx} check={check} />
        ))}
      </div>
    </div>
  );
}

function SEOMetricsPanel({ metrics }: { metrics: SEOMetrics }) {
  return (
    <div className="border border-zinc-900 p-6">
      <h3 className="text-lg font-medium mb-6">Search Intelligence</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.domainRank !== undefined && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Domain Rank</p>
            <p className="text-2xl font-light font-mono">{metrics.domainRank.toLocaleString()}</p>
          </div>
        )}
        {metrics.organicTraffic !== undefined && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Est. Traffic</p>
            <p className="text-2xl font-light font-mono">{metrics.organicTraffic.toLocaleString()}</p>
          </div>
        )}
        {metrics.organicKeywords !== undefined && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Keywords</p>
            <p className="text-2xl font-light font-mono">{metrics.organicKeywords.toLocaleString()}</p>
          </div>
        )}
        {metrics.onPageScore !== undefined && (
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">On-Page Score</p>
            <p className={`text-2xl font-light font-mono ${getScoreColor(metrics.onPageScore).text}`}>
              {metrics.onPageScore}
            </p>
          </div>
        )}
      </div>

      {metrics.topKeywords && metrics.topKeywords.length > 0 && (
        <div className="mt-8">
          <p className="text-zinc-500 text-xs uppercase tracking-wider mb-4">Top Ranking Keywords</p>
          <div className="space-y-2">
            {metrics.topKeywords.map((kw, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-zinc-900 last:border-b-0">
                <span className="text-sm truncate flex-1">{kw.keyword}</span>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`font-mono text-sm ${kw.position <= 3 ? 'text-emerald-400' : kw.position <= 10 ? 'text-amber-400' : 'text-zinc-500'}`}>
                    #{kw.position}
                  </span>
                  <span className="text-zinc-500 text-sm font-mono w-20 text-right">
                    {kw.searchVolume.toLocaleString()} vol
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCapture({ analysis }: { analysis: GEOAnalysis }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Lead captured:', email, analysis.url);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="border border-zinc-800 p-8 text-center">
        <p className="text-zinc-400">Report sent. Check your inbox.</p>
      </div>
    );
  }

  return (
    <div className="border border-zinc-900 p-8">
      <h3 className="text-lg font-medium mb-2">Get Full Report</h3>
      <p className="text-zinc-500 text-sm mb-6">Receive a detailed PDF with prioritized recommendations.</p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          required
          className="flex-1 px-4 py-3 bg-transparent border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 font-mono text-sm"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-white text-black font-medium text-sm hover:bg-zinc-200 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GEOAnalysis | null>(null);
  const [error, setError] = useState('');

  // Scroll to top when analysis loads
  useEffect(() => {
    if (analysis) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [analysis]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium tracking-wide">GEO AUDIT</span>
          </div>
          <a
            href="https://johnisaacson.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-white text-sm tracking-wide"
          >
            JOHN ISAACSON
          </a>
        </div>
      </header>

      {/* Hero Section */}
      {!analysis && !loading && (
        <section className="min-h-screen flex flex-col justify-center px-6 pt-16">
          <div className="max-w-3xl mx-auto w-full">
            <div className="mb-16">
              <h1 className="text-5xl md:text-7xl font-light tracking-tight leading-none mb-6">
                Is your website<br />
                <span className="text-zinc-500">ready for AI?</span>
              </h1>
              <p className="text-zinc-500 text-lg max-w-xl">
                Check how well your content is optimized for Google AI Overviews, ChatGPT, and other AI search engines.
              </p>
            </div>

            <form onSubmit={handleAnalyze} className="mb-16">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL"
                  className="flex-1 px-6 py-4 bg-transparent border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-lg font-light"
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="px-10 py-4 bg-white text-black font-medium hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg"
                >
                  Analyze
                </button>
              </div>
              {error && (
                <p className="mt-4 text-red-400 text-sm">{error}</p>
              )}
            </form>

            <div className="grid grid-cols-5 gap-px bg-zinc-900">
              {categories.map((cat) => (
                <div key={cat.key} className="bg-black p-4 text-center">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <section className="min-h-screen flex flex-col justify-center items-center px-6 pt-16">
          <div className="text-center">
            <div className="w-px h-24 bg-zinc-800 mx-auto mb-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-white animate-pulse-slow" />
            </div>
            <p className="text-zinc-500 uppercase tracking-[0.3em] text-sm">Analyzing</p>
          </div>
        </section>
      )}

      {/* Results */}
      {analysis && !loading && (
        <section className="min-h-screen px-6 pt-24 pb-16">
          <div className="max-w-5xl mx-auto">
            {/* Score Header */}
            <div className="text-center mb-20">
              <ScoreDisplay
                score={analysis.overallScore}
                maxScore={analysis.maxScore}
                grade={analysis.grade}
              />
              <div className="mt-8 space-y-2">
                <h2 className="text-xl font-light truncate max-w-2xl mx-auto" title={analysis.title}>
                  {analysis.title || 'Untitled'}
                </h2>
                <p className="text-zinc-600 text-sm font-mono truncate max-w-xl mx-auto">
                  {analysis.url}
                </p>
              </div>
              <div className="flex justify-center gap-12 mt-8 text-sm">
                <div>
                  <span className="text-emerald-400 font-mono">{analysis.summary.passed}</span>
                  <span className="text-zinc-600 ml-2">passed</span>
                </div>
                <div>
                  <span className="text-amber-400 font-mono">{analysis.summary.warnings}</span>
                  <span className="text-zinc-600 ml-2">warnings</span>
                </div>
                <div>
                  <span className="text-red-400 font-mono">{analysis.summary.failed}</span>
                  <span className="text-zinc-600 ml-2">failed</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setAnalysis(null);
                  setUrl('');
                }}
                className="mt-8 text-zinc-500 hover:text-white text-sm underline underline-offset-4"
              >
                Analyze another URL
              </button>
            </div>

            {/* SEO Metrics (if available) */}
            {analysis.seoMetrics && (
              <div className="mb-12">
                <SEOMetricsPanel metrics={analysis.seoMetrics} />
              </div>
            )}

            {/* Lead Capture */}
            <div className="mb-12">
              <LeadCapture analysis={analysis} />
            </div>

            {/* Categories */}
            <div className="space-y-6">
              {categories.map((category) => (
                <CategoryBlock key={category.key} category={category} checks={analysis.checks} />
              ))}
            </div>

            {/* CTA */}
            <div className="mt-20 text-center border-t border-zinc-900 pt-20">
              <p className="text-zinc-500 uppercase tracking-[0.2em] text-xs mb-4">Need help?</p>
              <h3 className="text-2xl font-light mb-6">Improve your GEO score</h3>
              <a
                href="https://johnisaacson.co.uk/#contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 border border-white text-white hover:bg-white hover:text-black transition-colors text-sm tracking-wide"
              >
                Book a Strategy Call
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs tracking-wide">
            &copy; {new Date().getFullYear()} JOHN ISAACSON
          </p>
          <div className="flex items-center gap-8">
            <a href="https://johnisaacson.co.uk" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white text-xs tracking-wide transition-colors">
              WEBSITE
            </a>
            <a href="https://johnisaacson.co.uk/blog" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white text-xs tracking-wide transition-colors">
              BLOG
            </a>
            <a href="https://johnisaacson.co.uk/#contact" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-white text-xs tracking-wide transition-colors">
              CONTACT
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
