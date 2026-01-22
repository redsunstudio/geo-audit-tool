'use client';

import { useState } from 'react';

interface GEOCheck {
  name: string;
  category: string;
  passed: boolean;
  score: number;
  maxScore: number;
  details: string;
  recommendation?: string;
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
}

const categories = [
  { name: 'Schema Markup', key: 'schema' },
  { name: 'Content Structure', key: 'content' },
  { name: 'E-E-A-T Signals', key: 'eeat' },
  { name: 'Meta & Technical', key: 'meta' },
  { name: 'AI Snippet Optimization', key: 'ai' },
];

function ScoreDisplay({ score, maxScore, grade }: { score: number; maxScore: number; grade: string }) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <div className="text-center">
      <div className="text-8xl md:text-9xl font-light tracking-tighter">
        {percentage}
      </div>
      <div className="text-zinc-500 uppercase tracking-[0.3em] text-sm mt-2">
        Score
      </div>
    </div>
  );
}

function CheckItem({ check }: { check: GEOCheck }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border-b border-zinc-900 last:border-b-0 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            check.passed ? 'bg-white' : check.score > 0 ? 'bg-zinc-500' : 'bg-zinc-700'
          }`} />
          <div className="min-w-0">
            <h4 className="font-medium truncate">{check.name}</h4>
            <p className="text-zinc-500 text-sm truncate">{check.details}</p>
          </div>
        </div>
        <div className="text-right shrink-0 flex items-center gap-4">
          <span className={`font-mono text-sm ${
            check.passed ? 'text-white' : 'text-zinc-500'
          }`}>
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
        <div className="pb-5 pl-6 pr-4">
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

  return (
    <div className="border border-zinc-900 rounded-none">
      <div className="p-6 border-b border-zinc-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{category.name}</h3>
          <div className="flex items-center gap-4">
            <div className="w-32 h-[2px] bg-zinc-900 overflow-hidden">
              <div
                className="h-full bg-white animate-progress"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="font-mono text-sm text-zinc-500 w-12 text-right">{percentage}%</span>
          </div>
        </div>
      </div>
      <div className="divide-y divide-zinc-900">
        {categoryChecks.map((check, idx) => (
          <CheckItem key={idx} check={check} />
        ))}
      </div>
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
                <p className="mt-4 text-zinc-500 text-sm">{error}</p>
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
                  <span className="text-white font-mono">{analysis.summary.passed}</span>
                  <span className="text-zinc-600 ml-2">passed</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono">{analysis.summary.warnings}</span>
                  <span className="text-zinc-600 ml-2">warnings</span>
                </div>
                <div>
                  <span className="text-zinc-700 font-mono">{analysis.summary.failed}</span>
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
