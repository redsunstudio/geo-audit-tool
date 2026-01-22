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
  { name: 'Schema Markup', icon: '🏗️', description: 'Structured data for AI understanding' },
  { name: 'Content Structure', icon: '📝', description: 'Headings, lists, and formatting' },
  { name: 'E-E-A-T Signals', icon: '🏆', description: 'Experience, Expertise, Authority, Trust' },
  { name: 'Meta & Technical', icon: '⚙️', description: 'Technical SEO foundations' },
  { name: 'AI Snippet Optimization', icon: '🤖', description: 'Quotable content for AI responses' },
];

function ScoreCircle({ score, maxScore, grade }: { score: number; maxScore: number; grade: string }) {
  const percentage = Math.round((score / maxScore) * 100);
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-emerald-500';
    if (grade === 'B') return 'text-lime-500';
    if (grade === 'C') return 'text-yellow-500';
    if (grade === 'D') return 'text-orange-500';
    return 'text-red-500';
  };

  const getStrokeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#10b981';
    if (grade === 'B') return '#84cc16';
    if (grade === 'C') return '#eab308';
    if (grade === 'D') return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="relative w-36 h-36">
      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#1f2937"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={getStrokeColor(grade)}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${getGradeColor(grade)}`}>{grade}</span>
        <span className="text-sm text-gray-400">{percentage}%</span>
      </div>
    </div>
  );
}

function CheckCard({ check }: { check: GEOCheck }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        check.passed
          ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10'
          : check.score > 0
          ? 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10'
          : 'border-red-500/30 bg-red-500/5 hover:bg-red-500/10'
      }`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
              check.passed
                ? 'bg-emerald-500 text-white'
                : check.score > 0
                ? 'bg-yellow-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {check.passed ? '✓' : check.score > 0 ? '!' : '✕'}
          </div>
          <div>
            <h4 className="font-medium text-white">{check.name}</h4>
            <p className="text-sm text-gray-400">{check.details}</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-lg font-bold ${check.passed ? 'text-emerald-400' : check.score > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
            {check.score}/{check.maxScore}
          </span>
        </div>
      </div>
      {isExpanded && check.recommendation && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-sm text-gray-300">
            <span className="font-semibold text-blue-400">Recommendation:</span> {check.recommendation}
          </p>
        </div>
      )}
    </div>
  );
}

function CategorySection({ category, checks }: { category: typeof categories[0]; checks: GEOCheck[] }) {
  const categoryChecks = checks.filter(c => c.category === category.name);
  const categoryScore = categoryChecks.reduce((acc, c) => acc + c.score, 0);
  const categoryMax = categoryChecks.reduce((acc, c) => acc + c.maxScore, 0);
  const percentage = Math.round((categoryScore / categoryMax) * 100);

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{category.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-white">{category.name}</h3>
            <p className="text-sm text-gray-400">{category.description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-white">{categoryScore}</span>
          <span className="text-gray-400">/{categoryMax}</span>
          <div className="text-sm text-gray-400">{percentage}%</div>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="space-y-3">
        {categoryChecks.map((check, idx) => (
          <CheckCard key={idx} check={check} />
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
    // In production, this would send to your email service
    console.log('Lead captured:', email, analysis.url);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 rounded-xl p-6 border border-emerald-500/30 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-xl font-semibold text-white mb-2">Report Sent!</h3>
        <p className="text-gray-400">Check your inbox for the full PDF report with actionable insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/30">
      <h3 className="text-xl font-semibold text-white mb-2">Get Your Full Report</h3>
      <p className="text-gray-400 mb-4">Enter your email to receive a detailed PDF report with prioritized recommendations.</p>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Send Report
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">
              G
            </div>
            <span className="font-semibold text-lg">GEO Audit Tool</span>
          </div>
          <a
            href="https://johnisaacson.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            by John Isaacson
          </a>
        </div>
      </header>

      {/* Hero Section */}
      {!analysis && (
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm font-medium mb-6">
              Free AI Search Optimization Audit
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Is Your Website Ready for AI Search?
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Discover how well your content is optimized for Google AI Overviews, ChatGPT, and other AI search engines with our free GEO audit.
            </p>

            <form onSubmit={handleAnalyze} className="max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your website URL..."
                  className="flex-1 px-5 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-lg whitespace-nowrap"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze Now'
                  )}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <div className="mt-12 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              {categories.map((cat) => (
                <div key={cat.name} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <span className="text-2xl">{cat.icon}</span>
                  <p className="text-sm text-gray-400 mt-2">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <section className="py-20 px-6">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Analyzing Your Website</h2>
            <p className="text-gray-400">Checking schema markup, content structure, E-E-A-T signals, and more...</p>
          </div>
        </section>
      )}

      {/* Results */}
      {analysis && !loading && (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Score Overview */}
            <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700 mb-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ScoreCircle score={analysis.overallScore} maxScore={analysis.maxScore} grade={analysis.grade} />
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-2xl font-bold mb-2 truncate" title={analysis.title}>
                    {analysis.title || 'Untitled Page'}
                  </h2>
                  <p className="text-gray-400 mb-4 truncate" title={analysis.url}>
                    {analysis.url}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                      <span className="text-gray-300">{analysis.summary.passed} Passed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="text-gray-300">{analysis.summary.warnings} Warnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      <span className="text-gray-300">{analysis.summary.failed} Failed</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={() => {
                      setAnalysis(null);
                      setUrl('');
                    }}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Analyze Another URL
                  </button>
                </div>
              </div>
            </div>

            {/* Lead Capture */}
            <div className="mb-8">
              <LeadCapture analysis={analysis} />
            </div>

            {/* Category Breakdown */}
            <div className="grid gap-6">
              {categories.map((category) => (
                <CategorySection key={category.name} category={category} checks={analysis.checks} />
              ))}
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold mb-3">Need Help Improving Your GEO Score?</h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                I help businesses optimize their content for AI search engines. Get a personalized strategy session to improve your AI visibility.
              </p>
              <a
                href="https://johnisaacson.co.uk/#contact"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Book a Strategy Call
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} John Isaacson. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://johnisaacson.co.uk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">
              Main Website
            </a>
            <a href="https://johnisaacson.co.uk/blog" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">
              Blog
            </a>
            <a href="https://johnisaacson.co.uk/#contact" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
