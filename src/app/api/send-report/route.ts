import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
  seoMetrics?: {
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
  };
}

function getScoreColor(percentage: number): string {
  if (percentage >= 70) return '#34d399'; // emerald
  if (percentage >= 40) return '#fbbf24'; // amber
  return '#f87171'; // red
}

function generateEmailHTML(analysis: GEOAnalysis): string {
  const percentage = Math.round((analysis.overallScore / analysis.maxScore) * 100);
  const scoreColor = getScoreColor(percentage);

  const categories = [
    { name: 'Schema Markup', key: 'Schema Markup' },
    { name: 'Content Structure', key: 'Content Structure' },
    { name: 'E-E-A-T Signals', key: 'E-E-A-T Signals' },
    { name: 'Meta & Technical', key: 'Meta & Technical' },
    { name: 'AI Snippet Optimization', key: 'AI Snippet Optimization' },
  ];

  const categoryHTML = categories.map(cat => {
    const catChecks = analysis.checks.filter(c => c.category === cat.key);
    if (catChecks.length === 0) return '';

    const catScore = catChecks.reduce((acc, c) => acc + c.score, 0);
    const catMax = catChecks.reduce((acc, c) => acc + c.maxScore, 0);
    const catPercentage = Math.round((catScore / catMax) * 100);
    const catColor = getScoreColor(catPercentage);

    const checksHTML = catChecks.map(check => {
      const checkPercentage = Math.round((check.score / check.maxScore) * 100);
      const checkColor = getScoreColor(checkPercentage);
      const status = check.passed ? 'PASS' : (check.score > 0 ? 'PARTIAL' : 'FAIL');

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #27272a;">
            <div style="display: flex; align-items: center;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${checkColor}; margin-right: 12px;"></span>
              <strong>${check.name}</strong>
            </div>
            <div style="color: #71717a; font-size: 13px; margin-top: 4px;">${check.details}</div>
            ${check.recommendation ? `<div style="color: #fbbf24; font-size: 13px; margin-top: 4px;">Recommendation: ${check.recommendation}</div>` : ''}
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #27272a; text-align: right; color: ${checkColor}; font-family: monospace;">
            ${check.score}/${check.maxScore}
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div style="margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 500;">${cat.name}</h3>
          <span style="color: ${catColor}; font-family: monospace;">${catPercentage}%</span>
        </div>
        <div style="height: 4px; background: #27272a; border-radius: 2px; margin-bottom: 16px;">
          <div style="height: 100%; width: ${catPercentage}%; background: ${catColor}; border-radius: 2px;"></div>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          ${checksHTML}
        </table>
      </div>
    `;
  }).join('');

  const seoMetricsHTML = analysis.seoMetrics ? `
    <div style="background: #0a0a0a; border: 1px solid #27272a; padding: 24px; margin-bottom: 32px;">
      <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 500;">Search Intelligence</h3>
      <table style="width: 100%;">
        <tr>
          ${analysis.seoMetrics.domainRank !== undefined ? `
            <td style="padding: 8px 0;">
              <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Domain Rank</div>
              <div style="font-size: 24px; font-family: monospace;">${analysis.seoMetrics.domainRank.toLocaleString()}</div>
            </td>
          ` : ''}
          ${analysis.seoMetrics.organicTraffic !== undefined ? `
            <td style="padding: 8px 0;">
              <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Est. Traffic</div>
              <div style="font-size: 24px; font-family: monospace;">${analysis.seoMetrics.organicTraffic.toLocaleString()}</div>
            </td>
          ` : ''}
          ${analysis.seoMetrics.organicKeywords !== undefined ? `
            <td style="padding: 8px 0;">
              <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Keywords</div>
              <div style="font-size: 24px; font-family: monospace;">${analysis.seoMetrics.organicKeywords.toLocaleString()}</div>
            </td>
          ` : ''}
          ${analysis.seoMetrics.onPageScore !== undefined ? `
            <td style="padding: 8px 0;">
              <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">On-Page Score</div>
              <div style="font-size: 24px; font-family: monospace; color: ${getScoreColor(analysis.seoMetrics.onPageScore)};">${analysis.seoMetrics.onPageScore}</div>
            </td>
          ` : ''}
        </tr>
      </table>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 48px;">
          <h1 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 400; color: #71717a; text-transform: uppercase; letter-spacing: 0.2em;">GEO Audit Report</h1>
          <div style="font-size: 13px; color: #52525b;">${analysis.url}</div>
        </div>

        <!-- Score -->
        <div style="text-align: center; margin-bottom: 48px;">
          <div style="font-size: 72px; font-weight: 300; color: ${scoreColor}; line-height: 1;">
            ${percentage}<span style="font-size: 32px; color: #52525b;">/100</span>
          </div>
          <div style="color: #71717a; text-transform: uppercase; letter-spacing: 0.3em; font-size: 12px; margin-top: 8px;">GEO Score</div>
        </div>

        <!-- Summary -->
        <div style="display: flex; justify-content: center; gap: 32px; margin-bottom: 48px; text-align: center;">
          <div>
            <div style="font-size: 24px; color: #34d399;">${analysis.summary.passed}</div>
            <div style="font-size: 11px; color: #71717a; text-transform: uppercase;">Passed</div>
          </div>
          <div>
            <div style="font-size: 24px; color: #fbbf24;">${analysis.summary.warnings}</div>
            <div style="font-size: 11px; color: #71717a; text-transform: uppercase;">Warnings</div>
          </div>
          <div>
            <div style="font-size: 24px; color: #f87171;">${analysis.summary.failed}</div>
            <div style="font-size: 11px; color: #71717a; text-transform: uppercase;">Failed</div>
          </div>
        </div>

        <!-- SEO Metrics -->
        ${seoMetricsHTML}

        <!-- Categories -->
        ${categoryHTML}

        <!-- Footer -->
        <div style="text-align: center; margin-top: 48px; padding-top: 32px; border-top: 1px solid #27272a;">
          <p style="color: #71717a; font-size: 13px; margin: 0 0 16px 0;">Need help improving your GEO score?</p>
          <a href="https://johnisaacson.co.uk/#contact" style="display: inline-block; padding: 12px 24px; background: #ffffff; color: #000000; text-decoration: none; font-size: 14px;">Get in Touch</a>
          <p style="color: #52525b; font-size: 11px; margin-top: 32px;">
            Powered by GEO Audit Tool<br>
            <a href="https://geo-audit-tool-production.up.railway.app" style="color: #71717a;">geo-audit-tool-production.up.railway.app</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const { email, analysis } = await request.json();

    if (!email || !analysis) {
      return NextResponse.json({ error: 'Email and analysis data required' }, { status: 400 });
    }

    // Check for Gmail credentials
    const gmailUser = process.env.GMAIL_USER;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailAppPassword) {
      console.error('Gmail credentials not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    // Generate email HTML
    const htmlContent = generateEmailHTML(analysis);
    const percentage = Math.round((analysis.overallScore / analysis.maxScore) * 100);

    // Send email
    await transporter.sendMail({
      from: `"GEO Audit Tool" <${gmailUser}>`,
      to: email,
      subject: `Your GEO Audit Report: ${percentage}/100 - ${analysis.url}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
