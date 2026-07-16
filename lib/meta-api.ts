const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
}

export interface MetaInsight {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

export type InsightLevel = 'account' | 'campaign' | 'adset' | 'ad';

export interface InsightsParams {
  adAccountId: string;
  accessToken: string;
  level?: InsightLevel;
  datePreset?: string;
  since?: string;
  until?: string;
  timeIncrement?: number;       // 1 = daily breakdown
  campaignIds?: string[];       // filter by campaign IDs
}

// ── Core fetch ────────────────────────────────────────────────────────────────

// Follows paging cursors to fetch all results (up to maxPages)
async function paginatedFetch<T>(
  path: string,
  params: Record<string, string>,
  maxPages = 10
): Promise<T[]> {
  const results: T[] = [];
  let nextUrl: string | null = null;
  let page = 0;

  const firstUrl = new URL(`${META_BASE_URL}/${path}`);
  Object.entries(params).forEach(([k, v]) => firstUrl.searchParams.set(k, v));
  let currentUrl = firstUrl.toString();

  while (page < maxPages) {
    const res  = await fetch(currentUrl, { next: { revalidate: 300 } });
    const json = await res.json();

    if (json.error) {
      throw new Error(`Meta API ${json.error.code}: ${json.error.message}`);
    }

    results.push(...(json.data ?? []));
    nextUrl = json.paging?.next ?? null;
    if (!nextUrl) break;
    currentUrl = nextUrl;
    page++;
  }

  return results;
}

// ── Public helpers ────────────────────────────────────────────────────────────

export async function fetchMetaCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<MetaCampaign[]> {
  return paginatedFetch<MetaCampaign>(
    `act_${adAccountId}/campaigns`,
    {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
      access_token: accessToken,
      limit: '200',
    }
  );
}

export async function fetchMetaAdSets(
  adAccountId: string,
  accessToken: string,
  campaignIds?: string[]
): Promise<MetaAdSet[]> {
  const params: Record<string, string> = {
    fields: 'id,name,status,campaign_id,daily_budget,lifetime_budget',
    access_token: accessToken,
    limit: '200',
  };
  if (campaignIds?.length) {
    params['filtering'] = JSON.stringify([
      { field: 'campaign.id', operator: 'IN', value: campaignIds },
    ]);
  }
  return paginatedFetch<MetaAdSet>(
    `act_${adAccountId}/adsets`,
    { ...params, limit: '200' }
  );
}

export async function fetchMetaInsights(params: InsightsParams): Promise<MetaInsight[]> {
  const {
    adAccountId,
    accessToken,
    level = 'campaign',
    datePreset = 'last_30d',
    since,
    until,
    timeIncrement,
    campaignIds,
  } = params;

  const levelFields: Record<InsightLevel, string> = {
    account:  'impressions,reach,clicks,spend,cpc,cpm,ctr,frequency,actions',
    campaign: 'campaign_id,campaign_name,impressions,reach,clicks,spend,cpc,cpm,ctr,frequency,actions',
    adset:    'campaign_id,campaign_name,adset_id,adset_name,impressions,reach,clicks,spend,cpc,cpm,ctr,actions',
    ad:       'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,impressions,reach,clicks,spend,cpc,cpm,ctr,actions',
  };

  const queryParams: Record<string, string> = {
    fields: levelFields[level],
    level,
    access_token: accessToken,
  };

  if (since && until) {
    queryParams['time_range'] = JSON.stringify({ since, until });
  } else {
    queryParams['date_preset'] = datePreset;
  }

  if (timeIncrement) {
    queryParams['time_increment'] = String(timeIncrement);
  }

  if (campaignIds?.length) {
    queryParams['filtering'] = JSON.stringify([
      { field: 'campaign.id', operator: 'IN', value: campaignIds },
    ]);
  }

  return paginatedFetch<MetaInsight>(
    `act_${adAccountId}/insights`,
    { ...queryParams, limit: '200' }
  );
}

export function getLandingPageViews(insight: MetaInsight): number {
  if (!insight.actions) return 0;
  const lp = insight.actions.find((a) => a.action_type === 'landing_page_view');
  return lp ? parseInt(lp.value, 10) : 0;
}

const LEAD_ACTION_TYPES = new Set([
  'lead',
  'onsite_conversion.lead_grouped',
  'offsite_conversion.fb_pixel_lead',
  'leadgen.other',
  'contact',
  'schedule',
  'submit_application',
  'complete_registration',
]);

export function getConversions(insight: MetaInsight): number {
  if (!insight.actions) return 0;
  // Use the most specific aggregate type when available; otherwise sum individual types
  const grouped = insight.actions.find(a => a.action_type === 'onsite_conversion.lead_grouped');
  if (grouped) return parseInt(grouped.value, 10);
  return insight.actions
    .filter(a => LEAD_ACTION_TYPES.has(a.action_type))
    .reduce((sum, a) => sum + parseInt(a.value, 10), 0);
}

export function getPurchases(insight: MetaInsight): number {
  if (!insight.actions) return 0;
  const p = insight.actions.find(
    (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return p ? parseInt(p.value, 10) : 0;
}

export function getInitiateCheckout(insight: MetaInsight): number {
  if (!insight.actions) return 0;
  const c = insight.actions.find(
    (a) => a.action_type === 'initiate_checkout' || a.action_type === 'offsite_conversion.fb_pixel_initiate_checkout'
  );
  return c ? parseInt(c.value, 10) : 0;
}
