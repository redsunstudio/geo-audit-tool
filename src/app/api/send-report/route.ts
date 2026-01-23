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

    // Get critical issues (failed checks with score 0)
    const criticalIssues = analysis.checks.filter((c: GEOCheck) => !c.passed && c.score === 0);
    const topIssues = criticalIssues.slice(0, 3);

    // Extract domain from URL for filename
    let domain = 'website';
    try {
      domain = new URL(analysis.url).hostname.replace('www.', '');
    } catch {
      // Use default
    }

    // Build the issues list HTML
    const issuesListHtml = topIssues.length > 0
      ? `
        <p style="margin: 0 0 16px 0; color: #a1a1aa;">Here are the top things that need your attention:</p>
        <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #ffffff;">
          ${topIssues.map((issue: GEOCheck) => `
            <li style="margin-bottom: 12px;">
              <strong>${issue.name}</strong><br>
              <span style="color: #a1a1aa; font-size: 14px;">${issue.recommendation || issue.details}</span>
            </li>
          `).join('')}
        </ul>
      `
      : '';

    // Personal email from John
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">

    <p style="margin: 0 0 24px 0; color: #ffffff;">Hey,</p>

    <p style="margin: 0 0 24px 0; color: #ffffff;">Thanks for checking out the GEO Audit Tool. I've had a look at <strong>${domain}</strong> and your full report is attached to this email.</p>

    <p style="margin: 0 0 24px 0; color: #ffffff;">
      Your site scored <strong style="color: ${percentage >= 70 ? '#34d399' : percentage >= 40 ? '#fbbf24' : '#f87171'};">${percentage}/100</strong> for AI search optimisation.
      ${percentage >= 70
        ? "That's a solid score - you're doing a lot of things right."
        : percentage >= 40
          ? "There's definitely room for improvement here."
          : "There are some important issues that need addressing."}
    </p>

    ${issuesListHtml}

    <p style="margin: 0 0 24px 0; color: #ffffff;">Whether you decide to work with us or not, here are some quick wins you can action today:</p>

    <ul style="margin: 0 0 24px 0; padding-left: 20px; color: #a1a1aa;">
      <li style="margin-bottom: 8px;">Make sure your content directly answers questions people are asking</li>
      <li style="margin-bottom: 8px;">Add structured data (schema markup) to help AI understand your content</li>
      <li style="margin-bottom: 8px;">Include author information and credentials where relevant</li>
    </ul>

    <p style="margin: 0 0 24px 0; color: #ffffff;">If you'd like help improving your GEO score or have any questions about the report, feel free to reply to this email or shoot me a message on WhatsApp:</p>

    <p style="margin: 0 0 32px 0;">
      <a href="https://wa.me/447446945578" style="color: #34d399; text-decoration: none; font-weight: 500;">+44 7446 945578</a>
    </p>

    <p style="margin: 0 0 8px 0; color: #ffffff;">Speak soon,</p>
    <p style="margin: 0 0 32px 0; color: #ffffff;"><strong>John</strong></p>

    <div style="border-top: 1px solid #27272a; padding-top: 24px; margin-top: 24px;">
      <p style="margin: 0; font-size: 13px; color: #52525b;">
        John Isaacson<br>
        <a href="https://johnisaacson.co.uk" style="color: #71717a; text-decoration: none;">johnisaacson.co.uk</a>
      </p>
    </div>

  </div>
</body>
</html>
    `;

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: 'John from GEO Audit <onboarding@resend.dev>',
      to: email,
      subject: `Your GEO Audit: ${percentage}/100 for ${domain}`,
      html: emailHtml,
      replyTo: 'hello@johnisaacson.co.uk',
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
