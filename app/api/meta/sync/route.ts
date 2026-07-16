import { NextRequest, NextResponse } from 'next/server';
import { rpc } from '@/lib/db';
import { fetchMetaCampaigns, fetchMetaInsights, getConversions } from '@/lib/meta-api';

export async function POST(request: NextRequest) {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    return NextResponse.json({ error: 'Meta credentials not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });

  const { data: project } = await rpc('get_project_by_id', { p_id: projectId });
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  try {
    const [metaCampaigns, insights] = await Promise.all([
      fetchMetaCampaigns(adAccountId, accessToken),
      fetchMetaInsights({ adAccountId, accessToken, datePreset: 'last_30d', level: 'campaign' }),
    ]);

    const insightMap = new Map(insights.map((i) => [i.campaign_id, i]));
    let synced = 0;

    for (const mc of metaCampaigns) {
      const { data: campaignId } = await rpc('upsert_campaign', {
        p_meta_id:    mc.id,
        p_name:       mc.name,
        p_status:     mc.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        p_budget:     mc.daily_budget ? parseFloat(mc.daily_budget) / 100 : 0,
        p_project_id: projectId,
      });

      const insight = insightMap.get(mc.id);
      if (insight && campaignId) {
        await rpc('insert_metric', {
          p_campaign_id: campaignId as string,
          p_date:        new Date(insight.date_start).toISOString(),
          p_reach:       parseInt(insight.reach ?? '0', 10),
          p_clicks:      parseInt(insight.clicks ?? '0', 10),
          p_spend:       parseFloat(insight.spend ?? '0'),
          p_conversions: getConversions(insight),
        });
        synced++;
      }
    }

    return NextResponse.json({ ok: true, campaignsSynced: metaCampaigns.length, metricsCreated: synced });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
