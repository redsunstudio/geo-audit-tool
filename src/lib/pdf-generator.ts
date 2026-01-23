import { jsPDF } from 'jspdf';

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

function getScoreColor(percentage: number): [number, number, number] {
  if (percentage >= 70) return [52, 211, 153]; // emerald #34d399
  if (percentage >= 40) return [251, 191, 36]; // amber #fbbf24
  return [248, 113, 113]; // red #f87171
}

export function generatePDFReport(analysis: GEOAnalysis): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  // Colors
  const black = '#000000';
  const white = '#ffffff';
  const gray = '#71717a';
  const darkGray = '#27272a';

  // Set black background
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Helper function to add new page with black background
  const addPage = () => {
    doc.addPage();
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    y = margin;
  };

  // Helper to check if we need a new page
  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - margin) {
      addPage();
    }
  };

  // Header
  doc.setFontSize(10);
  doc.setTextColor(113, 113, 122);
  doc.text('GEO AUDIT REPORT', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(8);
  doc.setTextColor(82, 82, 91);
  const urlText = analysis.url.length > 60 ? analysis.url.substring(0, 57) + '...' : analysis.url;
  doc.text(urlText, pageWidth / 2, y, { align: 'center' });
  y += 20;

  // Main score
  const percentage = Math.round((analysis.overallScore / analysis.maxScore) * 100);
  const scoreColor = getScoreColor(percentage);

  doc.setFontSize(64);
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(percentage.toString(), pageWidth / 2 - 10, y + 15, { align: 'center' });

  doc.setFontSize(24);
  doc.setTextColor(82, 82, 91);
  doc.text('/100', pageWidth / 2 + 20, y + 15, { align: 'center' });

  y += 25;

  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text('GEO SCORE', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Summary stats
  const statsY = y;
  const statWidth = (pageWidth - margin * 2) / 3;

  // Passed
  doc.setFontSize(20);
  doc.setTextColor(52, 211, 153);
  doc.text(analysis.summary.passed.toString(), margin + statWidth / 2, statsY, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('PASSED', margin + statWidth / 2, statsY + 6, { align: 'center' });

  // Warnings
  doc.setFontSize(20);
  doc.setTextColor(251, 191, 36);
  doc.text(analysis.summary.warnings.toString(), margin + statWidth * 1.5, statsY, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('WARNINGS', margin + statWidth * 1.5, statsY + 6, { align: 'center' });

  // Failed
  doc.setFontSize(20);
  doc.setTextColor(248, 113, 113);
  doc.text(analysis.summary.failed.toString(), margin + statWidth * 2.5, statsY, { align: 'center' });
  doc.setFontSize(7);
  doc.setTextColor(113, 113, 122);
  doc.text('FAILED', margin + statWidth * 2.5, statsY + 6, { align: 'center' });

  y += 20;

  // SEO Metrics if available
  if (analysis.seoMetrics) {
    checkPageBreak(40);

    // Box background
    doc.setFillColor(10, 10, 10);
    doc.setDrawColor(39, 39, 42);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 35, 2, 2, 'FD');

    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Search Intelligence', margin + 8, y);
    y += 10;

    const metrics: { label: string; value: string | number }[] = [];
    if (analysis.seoMetrics.domainRank !== undefined) {
      metrics.push({ label: 'Domain Rank', value: analysis.seoMetrics.domainRank.toLocaleString() });
    }
    if (analysis.seoMetrics.organicTraffic !== undefined) {
      metrics.push({ label: 'Est. Traffic', value: analysis.seoMetrics.organicTraffic.toLocaleString() });
    }
    if (analysis.seoMetrics.organicKeywords !== undefined) {
      metrics.push({ label: 'Keywords', value: analysis.seoMetrics.organicKeywords.toLocaleString() });
    }
    if (analysis.seoMetrics.onPageScore !== undefined) {
      metrics.push({ label: 'On-Page Score', value: analysis.seoMetrics.onPageScore });
    }

    const metricWidth = (pageWidth - margin * 2 - 16) / metrics.length;
    metrics.forEach((metric, i) => {
      const x = margin + 8 + metricWidth * i + metricWidth / 2;
      doc.setFontSize(6);
      doc.setTextColor(113, 113, 122);
      doc.text(metric.label.toUpperCase(), x, y, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.text(metric.value.toString(), x, y + 8, { align: 'center' });
    });

    y += 25;
  }

  // Categories
  const categories = [
    { name: 'Schema Markup', key: 'Schema Markup' },
    { name: 'Content Structure', key: 'Content Structure' },
    { name: 'E-E-A-T Signals', key: 'E-E-A-T Signals' },
    { name: 'Meta & Technical', key: 'Meta & Technical' },
    { name: 'AI Snippet Optimization', key: 'AI Snippet Optimization' },
  ];

  categories.forEach(cat => {
    const catChecks = analysis.checks.filter(c => c.category === cat.key);
    if (catChecks.length === 0) return;

    const catScore = catChecks.reduce((acc, c) => acc + c.score, 0);
    const catMax = catChecks.reduce((acc, c) => acc + c.maxScore, 0);
    const catPercentage = Math.round((catScore / catMax) * 100);
    const catColor = getScoreColor(catPercentage);

    // Check space needed
    checkPageBreak(15 + catChecks.length * 20);

    y += 10;

    // Category header
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(cat.name, margin, y);

    doc.setTextColor(catColor[0], catColor[1], catColor[2]);
    doc.text(`${catPercentage}%`, pageWidth - margin, y, { align: 'right' });

    y += 5;

    // Progress bar background
    doc.setFillColor(39, 39, 42);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 3, 1, 1, 'F');

    // Progress bar fill
    const barWidth = ((pageWidth - margin * 2) * catPercentage) / 100;
    doc.setFillColor(catColor[0], catColor[1], catColor[2]);
    doc.roundedRect(margin, y, barWidth, 3, 1, 1, 'F');

    y += 8;

    // Individual checks
    catChecks.forEach(check => {
      checkPageBreak(18);

      const checkPercentage = Math.round((check.score / check.maxScore) * 100);
      const checkColor = getScoreColor(checkPercentage);

      // Status dot
      doc.setFillColor(checkColor[0], checkColor[1], checkColor[2]);
      doc.circle(margin + 2, y + 1, 1.5, 'F');

      // Check name
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(check.name, margin + 8, y + 2);

      // Score
      doc.setTextColor(checkColor[0], checkColor[1], checkColor[2]);
      doc.text(`${check.score}/${check.maxScore}`, pageWidth - margin, y + 2, { align: 'right' });

      y += 6;

      // Details (truncated if too long)
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
      const maxDetailWidth = pageWidth - margin * 2 - 10;
      const detailLines = doc.splitTextToSize(check.details, maxDetailWidth);
      doc.text(detailLines.slice(0, 2), margin + 8, y);
      y += detailLines.slice(0, 2).length * 4;

      // Recommendation if exists
      if (check.recommendation) {
        doc.setTextColor(251, 191, 36);
        const recLines = doc.splitTextToSize(`→ ${check.recommendation}`, maxDetailWidth);
        doc.text(recLines.slice(0, 2), margin + 8, y);
        y += recLines.slice(0, 2).length * 4;
      }

      y += 3;
    });
  });

  // Footer
  checkPageBreak(30);
  y = pageHeight - 25;

  doc.setDrawColor(39, 39, 42);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(113, 113, 122);
  doc.text('Need help improving your GEO score?', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setTextColor(255, 255, 255);
  doc.text('johnisaacson.co.uk', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(6);
  doc.setTextColor(82, 82, 91);
  doc.text('Powered by GEO Audit Tool', pageWidth / 2, y, { align: 'center' });

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
