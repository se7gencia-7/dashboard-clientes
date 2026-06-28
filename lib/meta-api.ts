const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

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

export interface MetaInsight {
  campaign_id: string;
  campaign_name: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  cpc?: string;
  cpm?: string;
  ctr?: string;
  actions?: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

export interface MetaInsightsParams {
  adAccountId: string;
  accessToken: string;
  datePreset?: string;
  since?: string;
  until?: string;
  level?: 'account' | 'campaign' | 'adset' | 'ad';
}

async function metaGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${META_BASE_URL}/${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  const json = await res.json();

  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`);
  }
  return json as T;
}

export async function fetchMetaCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<MetaCampaign[]> {
  const data = await metaGet<{ data: MetaCampaign[] }>(
    `act_${adAccountId}/campaigns`,
    {
      fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
      access_token: accessToken,
      limit: '100',
    }
  );
  return data.data;
}

export async function fetchMetaInsights(
  params: MetaInsightsParams
): Promise<MetaInsight[]> {
  const { adAccountId, accessToken, datePreset = 'last_30d', since, until, level = 'campaign' } =
    params;

  const queryParams: Record<string, string> = {
    fields: 'campaign_id,campaign_name,impressions,reach,clicks,spend,cpc,cpm,ctr,actions',
    level,
    access_token: accessToken,
  };

  if (since && until) {
    queryParams['time_range'] = JSON.stringify({ since, until });
  } else {
    queryParams['date_preset'] = datePreset;
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
      a.action_type === 'offsite_conversion.fb_pixel_lead'
  );
  return conv ? parseInt(conv.value, 10) : 0;
}
