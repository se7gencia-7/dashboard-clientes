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

async function metaGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${META_BASE_URL}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  const json = await res.json();

  if (json.error) {
    throw new Error(`Meta API ${json.error.code}: ${json.error.message}`);
  }
  return json as T;
}

// ── Public helpers ────────────────────────────────────────────────────────────

export async function fetchMetaCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<MetaCampaign[]> {
  const data = await metaGet<{ data: MetaCampaign[] }>(
    `act_${adAccountId}/campaigns`,
    {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
      access_token: accessToken,
      limit: '200',
    }
  );
  return data.data;
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
  const data = await metaGet<{ data: MetaAdSet[] }>(
    `act_${adAccountId}/adsets`,
    params
  );
  return data.data;
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

  const data = await metaGet<{ data: MetaInsight[] }>(
    `act_${adAccountId}/insights`,
    queryParams
  );
  return data.data ?? [];
}

export function getConversions(insight: MetaInsight): number {
  if (!insight.actions) return 0;
  const conv = insight.actions.find(
    (a) =>
      a.action_type === 'lead' ||
      a.action_type === 'purchase' ||
      a.action_type === 'offsite_conversion.fb_pixel_lead' ||
      a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return conv ? parseInt(conv.value, 10) : 0;
}

export function getPurchases(insight: MetaInsight): number {
  if (!insight.actions) return 0;
  const p = insight.actions.find(
    (a) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
  );
  return p ? parseInt(p.value, 10) : 0;
}
