import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generatePDFReport } from '@/lib/pdf-generator';

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
  if (percentage >= 70) return '#34d399';
  if (percentage >= 40) return '#fbbf24';
  return '#f87171';
}

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 40) return 'Needs Work';
  return 'Poor';
}

export async function POST(request: NextRequest) {
  try {
    const { email, analysis } = await request.json();

    if (!email || !analysis) {
      return NextResponse.json({ error: 'Email and analysis data required' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error('Resend API key not configured');
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const resend = new Resend(resendApiKey);

    // Generate PDF report
    const pdfBuffer = generatePDFReport(analysis as GEOAnalysis);
    const percentage = Math.round((analysis.overallScore / analysis.maxScore) * 100);
    const scoreColor = getScoreColor(percentage);
    const grade = getGrade(percentage);

    // Simple, clean email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #000000; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 500px; margin: 0 auto; padding: 40px 20px;">

    <div style="text-align: center; margin-bottom: 32px;">
      <p style="margin: 0; font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 0.2em;">GEO Audit Report</p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 64px; font-weight: 300; color: ${scoreColor}; line-height: 1;">
        ${percentage}<span style="font-size: 24px; color: #52525b;">/100</span>
      </div>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #71717a; text-transform: uppercase; letter-spacing: 0.2em;">${grade}</p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <p style="margin: 0 0 4px 0; font-size: 13px; color: #71717a;">Analysis for</p>
      <p style="margin: 0; font-size: 14px; color: #ffffff;">${analysis.url}</p>
    </div>

    <div style="background: #0a0a0a; border: 1px solid #27272a; padding: 20px; text-align: center; margin-bottom: 32px;">
      <p style="margin: 0 0 4px 0; font-size: 11px; color: #71717a; text-transform: uppercase;">Summary</p>
      <p style="margin: 0; font-size: 14px;">
        <span style="color: #34d399;">${analysis.summary.passed} passed</span>
        <span style="color: #52525b;"> · </span>
        <span style="color: #fbbf24;">${analysis.summary.warnings} warnings</span>
        <span style="color: #52525b;"> · </span>
        <span style="color: #f87171;">${analysis.summary.failed} failed</span>
      </p>
    </div>

    <div style="text-align: center; margin-bottom: 32px;">
      <p style="margin: 0; font-size: 13px; color: #71717a;">Your full report is attached as a PDF.</p>
    </div>

    <div style="text-align: center; border-top: 1px solid #27272a; padding-top: 24px;">
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #71717a;">Need help improving your GEO score?</p>
      <a href="https://johnisaacson.co.uk/#contact" style="display: inline-block; padding: 12px 24px; background: #ffffff; color: #000000; text-decoration: none; font-size: 13px; font-weight: 500;">Get in Touch</a>
      <p style="margin-top: 24px; font-size: 11px; color: #52525b;">
        Powered by GEO Audit Tool
      </p>
    </div>

  </div>
</body>
</html>
    `;

    // Extract domain from URL for filename
    let domain = 'website';
    try {
      domain = new URL(analysis.url).hostname.replace('www.', '');
    } catch {
      // Use default
    }

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: 'GEO Audit <onboarding@resend.dev>',
      to: email,
      subject: `Your GEO Audit Report: ${percentage}/100 - ${domain}`,
      html: emailHtml,
      attachments: [
        {
          filename: `geo-audit-${domain}-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    console.log('Email sent successfully:', data?.id);
    return NextResponse.json({ success: true, id: data?.id });

  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
