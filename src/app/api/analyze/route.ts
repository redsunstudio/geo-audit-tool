import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getDataForSEOMetrics, DataForSEOMetrics } from '@/lib/dataforseo';

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

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }

    // Fetch the webpage
    const response = await axios.get(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GEOAuditBot/1.0; +https://johnisaacson.co.uk)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 15000,
      maxRedirects: 5,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Fetch DataForSEO metrics in parallel (non-blocking)
    let seoMetrics: DataForSEOMetrics | null = null;
    const seoMetricsPromise = getDataForSEOMetrics(normalizedUrl).catch(err => {
      console.error('DataForSEO error:', err);
      return null;
    });

    const checks: GEOCheck[] = [];

    // ========================================
    // 1. SCHEMA MARKUP CHECKS (25 points max)
    // ========================================

    // Check for JSON-LD schema
    const jsonLdScripts = $('script[type="application/ld+json"]');
    let schemaTypes: string[] = [];
    let hasSchema = false;

    jsonLdScripts.each((_, el) => {
      try {
        const content = $(el).html();
        if (content) {
          const schema = JSON.parse(content);
          hasSchema = true;
          if (Array.isArray(schema)) {
            schema.forEach(s => {
              if (s['@type']) schemaTypes.push(s['@type']);
            });
          } else if (schema['@type']) {
            schemaTypes.push(schema['@type']);
          } else if (schema['@graph']) {
            schema['@graph'].forEach((s: { '@type'?: string }) => {
              if (s['@type']) schemaTypes.push(s['@type']);
            });
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    });

    checks.push({
      name: 'JSON-LD Schema Present',
      category: 'Schema Markup',
      passed: hasSchema,
      score: hasSchema ? 8 : 0,
      maxScore: 8,
      details: hasSchema
        ? `Found schema types: ${schemaTypes.join(', ') || 'Unknown'}`
        : 'No JSON-LD structured data found',
      recommendation: hasSchema ? undefined : 'Add JSON-LD schema markup to help AI understand your content structure',
    });

    // Check for FAQ schema
    const hasFAQSchema = schemaTypes.some(t => t.toLowerCase().includes('faq'));
    checks.push({
      name: 'FAQ Schema',
      category: 'Schema Markup',
      passed: hasFAQSchema,
      score: hasFAQSchema ? 7 : 0,
      maxScore: 7,
      details: hasFAQSchema
        ? 'FAQPage schema detected - excellent for AI Overviews'
        : 'No FAQ schema found',
      recommendation: hasFAQSchema ? undefined : 'Add FAQPage schema to increase chances of appearing in AI-generated answers',
    });

    // Check for Article/HowTo schema
    const hasArticleSchema = schemaTypes.some(t =>
      ['article', 'newsarticle', 'blogposting', 'howto'].includes(t.toLowerCase())
    );
    checks.push({
      name: 'Article/HowTo Schema',
      category: 'Schema Markup',
      passed: hasArticleSchema,
      score: hasArticleSchema ? 5 : 0,
      maxScore: 5,
      details: hasArticleSchema
        ? 'Article or HowTo schema detected'
        : 'No Article/HowTo schema found',
      recommendation: hasArticleSchema ? undefined : 'Add Article or HowTo schema for better content classification',
    });

    // Check for Author/Person schema
    const hasAuthorSchema = schemaTypes.some(t =>
      ['person', 'author', 'organization'].includes(t.toLowerCase())
    );
    checks.push({
      name: 'Author/Organization Schema',
      category: 'Schema Markup',
      passed: hasAuthorSchema,
      score: hasAuthorSchema ? 5 : 0,
      maxScore: 5,
      details: hasAuthorSchema
        ? 'Person/Organization schema detected - supports E-E-A-T'
        : 'No author or organization schema found',
      recommendation: hasAuthorSchema ? undefined : 'Add Person or Organization schema to establish authorship and credibility',
    });

    // ========================================
    // 2. CONTENT STRUCTURE CHECKS (25 points max)
    // ========================================

    // Check for question-based headings
    const headings = $('h1, h2, h3').map((_, el) => $(el).text()).get();
    const questionHeadings = headings.filter(h =>
      h.includes('?') ||
      /^(what|why|how|when|where|who|which|can|do|does|is|are|should|will|would)/i.test(h.trim())
    );
    const hasQuestionHeadings = questionHeadings.length >= 2;

    checks.push({
      name: 'Question-Based Headings',
      category: 'Content Structure',
      passed: hasQuestionHeadings,
      score: hasQuestionHeadings ? 8 : (questionHeadings.length > 0 ? 4 : 0),
      maxScore: 8,
      details: `Found ${questionHeadings.length} question-based headings${questionHeadings.length > 0 ? `: "${questionHeadings.slice(0, 3).join('", "')}"${questionHeadings.length > 3 ? '...' : ''}` : ''}`,
      recommendation: hasQuestionHeadings ? undefined : 'Use question-based H2 headings that match user search queries (e.g., "What is GEO?", "How does it work?")',
    });

    // Check heading hierarchy
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const hasGoodHeadingStructure = h1Count === 1 && h2Count >= 2;

    checks.push({
      name: 'Heading Hierarchy',
      category: 'Content Structure',
      passed: hasGoodHeadingStructure,
      score: hasGoodHeadingStructure ? 5 : (h1Count === 1 ? 3 : 0),
      maxScore: 5,
      details: `H1: ${h1Count}, H2: ${h2Count}, H3: ${$('h3').length}`,
      recommendation: hasGoodHeadingStructure ? undefined : 'Use exactly one H1 and multiple H2s to create clear content sections',
    });

    // Check for bullet points and lists
    const listItems = $('ul li, ol li').length;
    const hasLists = listItems >= 3;

    checks.push({
      name: 'Structured Lists',
      category: 'Content Structure',
      passed: hasLists,
      score: hasLists ? 5 : 0,
      maxScore: 5,
      details: `Found ${listItems} list items`,
      recommendation: hasLists ? undefined : 'Use bullet points and numbered lists to make content scannable for AI',
    });

    // Check paragraph length (short paragraphs are better for AI)
    const paragraphs = $('p').map((_, el) => $(el).text()).get().filter(p => p.trim().length > 20);
    const avgParagraphLength = paragraphs.length > 0
      ? paragraphs.reduce((acc, p) => acc + p.length, 0) / paragraphs.length
      : 0;
    const hasGoodParagraphLength = avgParagraphLength > 0 && avgParagraphLength < 500;

    checks.push({
      name: 'Paragraph Length',
      category: 'Content Structure',
      passed: hasGoodParagraphLength,
      score: hasGoodParagraphLength ? 4 : (avgParagraphLength < 700 ? 2 : 0),
      maxScore: 4,
      details: `Average paragraph: ${Math.round(avgParagraphLength)} characters (${paragraphs.length} paragraphs)`,
      recommendation: hasGoodParagraphLength ? undefined : 'Keep paragraphs under 3-4 sentences for better AI parsing',
    });

    // Check for table of contents / quick summary
    const hasTOC = $('[class*="toc"], [id*="toc"], [class*="contents"], [class*="summary"], .table-of-contents').length > 0;
    const hasKeyTakeaways = $('*').text().toLowerCase().includes('key takeaway') ||
                           $('*').text().toLowerCase().includes('quick summary') ||
                           $('*').text().toLowerCase().includes('tldr') ||
                           $('*').text().toLowerCase().includes('tl;dr');

    checks.push({
      name: 'Quick Summary / Key Takeaways',
      category: 'Content Structure',
      passed: hasTOC || hasKeyTakeaways,
      score: (hasTOC || hasKeyTakeaways) ? 3 : 0,
      maxScore: 3,
      details: hasTOC || hasKeyTakeaways
        ? 'Summary or key takeaways section detected'
        : 'No quick summary or key takeaways found',
      recommendation: (hasTOC || hasKeyTakeaways) ? undefined : 'Add a "Key Takeaways" or summary section at the top for AI to extract',
    });

    // ========================================
    // 3. E-E-A-T SIGNALS (20 points max)
    // ========================================

    // Check for author information
    const hasAuthorName = $('[class*="author"], [rel="author"], .author, .byline, [itemprop="author"]').length > 0 ||
                         /written by|author:|by\s+[A-Z][a-z]+\s+[A-Z][a-z]+/i.test($('body').text());

    checks.push({
      name: 'Author Attribution',
      category: 'E-E-A-T Signals',
      passed: hasAuthorName,
      score: hasAuthorName ? 5 : 0,
      maxScore: 5,
      details: hasAuthorName
        ? 'Author attribution detected'
        : 'No clear author attribution found',
      recommendation: hasAuthorName ? undefined : 'Add visible author name with "Written by" or author byline',
    });

    // Check for author bio
    const hasAuthorBio = $('[class*="author-bio"], [class*="about-author"], .author-description').length > 0 ||
                        /about the author|[A-Z][a-z]+ is a/i.test($('body').text());

    checks.push({
      name: 'Author Bio/Credentials',
      category: 'E-E-A-T Signals',
      passed: hasAuthorBio,
      score: hasAuthorBio ? 5 : 0,
      maxScore: 5,
      details: hasAuthorBio
        ? 'Author bio or credentials detected'
        : 'No author bio found',
      recommendation: hasAuthorBio ? undefined : 'Add an author bio with credentials and expertise to build trust',
    });

    // Check for external citations/sources
    const externalLinks = $('a[href^="http"]').filter((_, el) => {
      const href = $(el).attr('href') || '';
      try {
        const linkUrl = new URL(href);
        const pageUrl = new URL(normalizedUrl);
        return linkUrl.hostname !== pageUrl.hostname;
      } catch {
        return false;
      }
    }).length;
    const hasExternalCitations = externalLinks >= 2;

    checks.push({
      name: 'External Citations',
      category: 'E-E-A-T Signals',
      passed: hasExternalCitations,
      score: hasExternalCitations ? 5 : (externalLinks > 0 ? 2 : 0),
      maxScore: 5,
      details: `Found ${externalLinks} external links`,
      recommendation: hasExternalCitations ? undefined : 'Cite reputable external sources to demonstrate research and credibility',
    });

    // Check for dates/freshness
    const hasDate = $('time, [class*="date"], [class*="published"], [datetime]').length > 0 ||
                   /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2},?\s+\d{4}/i.test($('body').text()) ||
                   /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test($('body').text());

    checks.push({
      name: 'Publication Date',
      category: 'E-E-A-T Signals',
      passed: hasDate,
      score: hasDate ? 5 : 0,
      maxScore: 5,
      details: hasDate
        ? 'Publication or update date detected'
        : 'No visible date found',
      recommendation: hasDate ? undefined : 'Add visible publication and last updated dates to show content freshness',
    });

    // ========================================
    // 4. META & TECHNICAL (15 points max)
    // ========================================

    // Check meta description
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    const hasGoodMetaDescription = metaDescription.length >= 120 && metaDescription.length <= 160;

    checks.push({
      name: 'Meta Description',
      category: 'Meta & Technical',
      passed: hasGoodMetaDescription,
      score: hasGoodMetaDescription ? 4 : (metaDescription.length > 0 ? 2 : 0),
      maxScore: 4,
      details: metaDescription
        ? `${metaDescription.length} characters: "${metaDescription.substring(0, 80)}..."`
        : 'No meta description found',
      recommendation: hasGoodMetaDescription ? undefined : 'Add a compelling meta description between 120-160 characters',
    });

    // Check page title
    const pageTitle = $('title').text() || '';
    const hasGoodTitle = pageTitle.length >= 30 && pageTitle.length <= 60;

    checks.push({
      name: 'Page Title Optimization',
      category: 'Meta & Technical',
      passed: hasGoodTitle,
      score: hasGoodTitle ? 4 : (pageTitle.length > 0 ? 2 : 0),
      maxScore: 4,
      details: pageTitle
        ? `${pageTitle.length} chars: "${pageTitle}"`
        : 'No title tag found',
      recommendation: hasGoodTitle ? undefined : 'Optimize title tag to 30-60 characters with primary keyword',
    });

    // Check mobile viewport
    const hasViewport = $('meta[name="viewport"]').length > 0;

    checks.push({
      name: 'Mobile Viewport',
      category: 'Meta & Technical',
      passed: hasViewport,
      score: hasViewport ? 3 : 0,
      maxScore: 3,
      details: hasViewport
        ? 'Mobile viewport meta tag present'
        : 'No mobile viewport tag found',
      recommendation: hasViewport ? undefined : 'Add viewport meta tag for mobile responsiveness',
    });

    // Check canonical URL
    const hasCanonical = $('link[rel="canonical"]').length > 0;

    checks.push({
      name: 'Canonical URL',
      category: 'Meta & Technical',
      passed: hasCanonical,
      score: hasCanonical ? 2 : 0,
      maxScore: 2,
      details: hasCanonical
        ? 'Canonical URL specified'
        : 'No canonical URL found',
      recommendation: hasCanonical ? undefined : 'Add canonical URL to prevent duplicate content issues',
    });

    // Check HTTPS
    const isHTTPS = normalizedUrl.startsWith('https://');

    checks.push({
      name: 'HTTPS Security',
      category: 'Meta & Technical',
      passed: isHTTPS,
      score: isHTTPS ? 2 : 0,
      maxScore: 2,
      details: isHTTPS
        ? 'Site is served over HTTPS'
        : 'Site is not using HTTPS',
      recommendation: isHTTPS ? undefined : 'Enable HTTPS for security and SEO benefits',
    });

    // ========================================
    // 5. AI SNIPPET OPTIMIZATION (15 points max)
    // ========================================

    // Check for definition-style content
    const bodyText = $('body').text();
    const hasDefinitions = /\b(is a|refers to|means|defined as|can be described as)\b/i.test(bodyText);

    checks.push({
      name: 'Definition-Style Content',
      category: 'AI Snippet Optimization',
      passed: hasDefinitions,
      score: hasDefinitions ? 5 : 0,
      maxScore: 5,
      details: hasDefinitions
        ? 'Definition-style sentences found - good for AI extraction'
        : 'No clear definitions found',
      recommendation: hasDefinitions ? undefined : 'Include clear definitions that AI can quote (e.g., "GEO is the practice of...")',
    });

    // Check for step-by-step content
    const hasSteps = /step\s*\d|step\s*one|first,?\s|second,?\s|third,?\s|\d\.\s+[A-Z]/i.test(bodyText) ||
                    $('ol li').length >= 3;

    checks.push({
      name: 'Step-by-Step Instructions',
      category: 'AI Snippet Optimization',
      passed: hasSteps,
      score: hasSteps ? 5 : 0,
      maxScore: 5,
      details: hasSteps
        ? 'Step-by-step or numbered instructions detected'
        : 'No step-by-step content found',
      recommendation: hasSteps ? undefined : 'Structure how-to content with numbered steps for featured snippets',
    });

    // Check for quotable statistics/facts
    const hasStatistics = /\d+%|\d+\s*(percent|million|billion|thousand)|\$\d+|\d+x\s/i.test(bodyText);

    checks.push({
      name: 'Statistics & Data Points',
      category: 'AI Snippet Optimization',
      passed: hasStatistics,
      score: hasStatistics ? 5 : 0,
      maxScore: 5,
      details: hasStatistics
        ? 'Statistics or data points found - quotable by AI'
        : 'No statistics or specific data found',
      recommendation: hasStatistics ? undefined : 'Include specific statistics and data points that AI can cite',
    });

    // ========================================
    // DATAFORSEO ENHANCED CHECKS
    // ========================================

    // Wait for DataForSEO metrics
    seoMetrics = await seoMetricsPromise;

    if (seoMetrics?.available) {
      // Domain Authority Check (based on rank)
      const domainRank = seoMetrics.domainRank;
      const hasDomainAuthority = domainRank !== undefined && domainRank > 0;
      const domainScore = domainRank ? Math.min(5, Math.round(domainRank / 200)) : 0;

      checks.push({
        name: 'Domain Authority',
        category: 'E-E-A-T Signals',
        passed: domainScore >= 3,
        score: domainScore,
        maxScore: 5,
        details: domainRank
          ? `Domain rank: ${domainRank.toLocaleString()} (higher is better)`
          : 'Unable to determine domain rank',
        recommendation: domainScore < 3 ? 'Build quality backlinks and create valuable content to improve domain authority' : undefined,
      });

      // Organic Visibility Check
      const organicKeywords = seoMetrics.organicKeywords;
      const hasOrganicVisibility = organicKeywords !== undefined && organicKeywords > 100;
      const visibilityScore = organicKeywords
        ? (organicKeywords > 1000 ? 5 : organicKeywords > 500 ? 4 : organicKeywords > 100 ? 3 : organicKeywords > 10 ? 2 : 1)
        : 0;

      checks.push({
        name: 'Organic Search Visibility',
        category: 'E-E-A-T Signals',
        passed: hasOrganicVisibility,
        score: visibilityScore,
        maxScore: 5,
        details: organicKeywords !== undefined
          ? `Ranking for ${organicKeywords.toLocaleString()} keywords organically`
          : 'Unable to determine organic visibility',
        recommendation: !hasOrganicVisibility ? 'Create more content targeting relevant keywords to increase organic visibility' : undefined,
      });

      // Page Performance Check (from on-page analysis)
      const pageLoadTime = seoMetrics.pageLoadTime;
      const hasGoodPerformance = pageLoadTime !== undefined && pageLoadTime < 3000;
      const performanceScore = pageLoadTime
        ? (pageLoadTime < 2000 ? 4 : pageLoadTime < 3000 ? 3 : pageLoadTime < 5000 ? 2 : 1)
        : 0;

      if (pageLoadTime !== undefined) {
        checks.push({
          name: 'Page Load Performance',
          category: 'Meta & Technical',
          passed: hasGoodPerformance,
          score: performanceScore,
          maxScore: 4,
          details: `Time to interactive: ${(pageLoadTime / 1000).toFixed(1)}s`,
          recommendation: !hasGoodPerformance ? 'Optimize images, minimize JavaScript, and use caching to improve load time' : undefined,
        });
      }

      // On-Page SEO Score
      const onPageScore = seoMetrics.onPageScore;
      if (onPageScore !== undefined) {
        const onPagePassed = onPageScore >= 70;
        const onPagePoints = Math.round(onPageScore / 20); // 0-5 scale

        checks.push({
          name: 'On-Page SEO Score',
          category: 'Meta & Technical',
          passed: onPagePassed,
          score: onPagePoints,
          maxScore: 5,
          details: `DataForSEO on-page score: ${onPageScore}/100`,
          recommendation: !onPagePassed ? 'Address technical SEO issues identified by the on-page analysis' : undefined,
        });
      }
    }

    // ========================================
    // CALCULATE FINAL SCORES
    // ========================================

    const totalScore = checks.reduce((acc, check) => acc + check.score, 0);
    const maxScore = checks.reduce((acc, check) => acc + check.maxScore, 0);
    const percentage = Math.round((totalScore / maxScore) * 100);

    const analysis: GEOAnalysis = {
      url: normalizedUrl,
      title: pageTitle || 'Untitled Page',
      overallScore: totalScore,
      maxScore,
      grade: getGrade(percentage),
      checks,
      summary: {
        passed: checks.filter(c => c.passed).length,
        failed: checks.filter(c => !c.passed && c.score === 0).length,
        warnings: checks.filter(c => !c.passed && c.score > 0).length,
      },
      // Include SEO metrics if available
      seoMetrics: seoMetrics?.available ? {
        domainRank: seoMetrics.domainRank,
        organicTraffic: seoMetrics.organicTraffic,
        organicKeywords: seoMetrics.organicKeywords,
        onPageScore: seoMetrics.onPageScore,
        pageLoadTime: seoMetrics.pageLoadTime,
        topKeywords: seoMetrics.topKeywords,
      } : undefined,
    };

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Analysis error:', error);

    if (axios.isAxiosError(error)) {
      if (error.code === 'ENOTFOUND') {
        return NextResponse.json({ error: 'Domain not found. Please check the URL.' }, { status: 400 });
      }
      if (error.response?.status === 403) {
        return NextResponse.json({ error: 'Access denied by the website. The site may be blocking automated requests.' }, { status: 400 });
      }
      if (error.response?.status === 404) {
        return NextResponse.json({ error: 'Page not found (404). Please check the URL.' }, { status: 400 });
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return NextResponse.json({ error: 'Request timed out. The website may be slow or unavailable.' }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Failed to analyze the URL. Please try again.' }, { status: 500 });
  }
}
