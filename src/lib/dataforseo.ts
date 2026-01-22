// DataForSEO API Integration
// Uses Basic Auth with login/password from environment variables

const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;
const API_BASE = 'https://api.dataforseo.com/v3';

export interface DataForSEOMetrics {
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
  available: boolean;
  error?: string;
}

function getAuthHeader(): string {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    throw new Error('DataForSEO credentials not configured');
  }
  return 'Basic ' + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
}

async function apiRequest<T>(endpoint: string, body: unknown[]): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`DataForSEO API error: ${response.status}`);
  }

  return response.json();
}

interface DomainRankResult {
  tasks?: Array<{
    result?: Array<{
      metrics?: {
        organic?: {
          etv?: number;
          count?: number;
          pos_1?: number;
          pos_2_3?: number;
          pos_4_10?: number;
        };
      };
      rank?: number;
    }>;
  }>;
}

interface OnPageResult {
  tasks?: Array<{
    result?: Array<{
      items?: Array<{
        onpage_score?: number;
        page_timing?: {
          time_to_interactive?: number;
          dom_complete?: number;
        };
        meta?: {
          title?: string;
          description?: string;
        };
        checks?: Record<string, boolean | number>;
      }>;
    }>;
  }>;
}

interface RankedKeywordsResult {
  tasks?: Array<{
    result?: Array<{
      items?: Array<{
        keyword_data?: {
          keyword?: string;
          keyword_info?: {
            search_volume?: number;
          };
        };
        ranked_serp_element?: {
          serp_item?: {
            rank_group?: number;
          };
        };
      }>;
    }>;
  }>;
}

export async function getDomainRankOverview(domain: string): Promise<{
  rank?: number;
  organicTraffic?: number;
  organicKeywords?: number;
}> {
  try {
    const data = await apiRequest<DomainRankResult>('/dataforseo_labs/google/domain_rank_overview/live', [
      {
        target: domain,
        language_code: 'en',
        location_name: 'United Kingdom',
      },
    ]);

    const result = data.tasks?.[0]?.result?.[0];
    if (!result) return {};

    return {
      rank: result.rank,
      organicTraffic: result.metrics?.organic?.etv,
      organicKeywords: result.metrics?.organic?.count,
    };
  } catch (error) {
    console.error('Domain rank overview error:', error);
    return {};
  }
}

export async function getOnPageAnalysis(url: string): Promise<{
  onPageScore?: number;
  pageLoadTime?: number;
}> {
  try {
    const data = await apiRequest<OnPageResult>('/on_page/instant_pages', [
      {
        url,
        enable_javascript: true,
      },
    ]);

    const item = data.tasks?.[0]?.result?.[0]?.items?.[0];
    if (!item) return {};

    return {
      onPageScore: item.onpage_score,
      pageLoadTime: item.page_timing?.time_to_interactive || item.page_timing?.dom_complete,
    };
  } catch (error) {
    console.error('On-page analysis error:', error);
    return {};
  }
}

export async function getTopRankedKeywords(domain: string): Promise<Array<{
  keyword: string;
  position: number;
  searchVolume: number;
}>> {
  try {
    const data = await apiRequest<RankedKeywordsResult>('/dataforseo_labs/google/ranked_keywords/live', [
      {
        target: domain,
        language_code: 'en',
        location_name: 'United Kingdom',
        limit: 5,
        order_by: ['keyword_data.keyword_info.search_volume,desc'],
        filters: [['ranked_serp_element.serp_item.rank_group', '<=', 10]],
      },
    ]);

    const items = data.tasks?.[0]?.result?.[0]?.items || [];
    return items.map(item => ({
      keyword: item.keyword_data?.keyword || '',
      position: item.ranked_serp_element?.serp_item?.rank_group || 0,
      searchVolume: item.keyword_data?.keyword_info?.search_volume || 0,
    })).filter(k => k.keyword);
  } catch (error) {
    console.error('Ranked keywords error:', error);
    return [];
  }
}

export async function getDataForSEOMetrics(url: string): Promise<DataForSEOMetrics> {
  // Check if credentials are configured
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    return {
      available: false,
      error: 'DataForSEO credentials not configured',
    };
  }

  try {
    // Extract domain from URL
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');

    // Fetch data in parallel
    const [domainData, onPageData, keywords] = await Promise.all([
      getDomainRankOverview(domain),
      getOnPageAnalysis(url),
      getTopRankedKeywords(domain),
    ]);

    return {
      available: true,
      domainRank: domainData.rank,
      organicTraffic: domainData.organicTraffic,
      organicKeywords: domainData.organicKeywords,
      onPageScore: onPageData.onPageScore,
      pageLoadTime: onPageData.pageLoadTime,
      topKeywords: keywords,
    };
  } catch (error) {
    console.error('DataForSEO metrics error:', error);
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function isDataForSEOConfigured(): boolean {
  return !!(DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD);
}
