import { NextRequest, NextResponse } from 'next/server';
import { fetchMetaInsights, getConversions, getPurchases, getInitiateCheckout, getMessages, getLandingPageViews, InsightLevel } from '@/lib/meta-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adAccountId = searchParams.get('account_id') ?? process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    return NextResponse.json({ error: 'Meta credentials not configured' }, { status: 500 });
  }

  const datePreset     = searchParams.get('date_preset') ?? 'last_30d';
  const since          = searchParams.get('since') ?? undefined;
  const until          = searchParams.get('until') ?? undefined;
  const level          = (searchParams.get('level') ?? 'campaign') as InsightLevel;
  const timeIncrement  = searchParams.get('time_increment') ? Number(searchParams.get('time_increment')) : undefined;
  const campaignIdsRaw = searchParams.get('campaign_ids');
  const campaignIds    = campaignIdsRaw ? campaignIdsRaw.split(',').filter(Boolean) : undefined;

  try {
    const raw = await fetchMetaInsights({
      adAccountId,
      accessToken,
      level,
      datePreset,
      since,
      until,
      timeIncrement,
      campaignIds,
    });

    const insights = raw.map((item) => ({
      campaignId:       item.campaign_id,
      campaignName:     item.campaign_name,
      adsetId:          item.adset_id,
      adsetName:        item.adset_name,
      adId:             item.ad_id,
      adName:           item.ad_name,
      impressions:      parseInt(item.impressions ?? '0', 10),
      reach:            parseInt(item.reach ?? '0', 10),
      clicks:           parseInt(item.clicks ?? '0', 10),
      spend:            parseFloat(item.spend ?? '0'),
      cpc:              parseFloat(item.cpc ?? '0'),
      cpm:              parseFloat(item.cpm ?? '0'),
      ctr:              parseFloat(item.ctr ?? '0'),
      frequency:        parseFloat(item.frequency ?? '0'),
      conversions:       getConversions(item),
      purchases:         getPurchases(item),
      initiateCheckout:  getInitiateCheckout(item),
      messages:          getMessages(item),
      landingPageViews:  getLandingPageViews(item),
      dateStart:        item.date_start,
      dateStop:         item.date_stop,
    }));

    const totals = insights.reduce(
      (acc, i) => ({
        impressions: acc.impressions + i.impressions,
        reach:       acc.reach       + i.reach,
        clicks:      acc.clicks      + i.clicks,
        spend:       acc.spend       + i.spend,
        conversions:      acc.conversions      + i.conversions,
        purchases:        acc.purchases        + i.purchases,
        initiateCheckout: acc.initiateCheckout + i.initiateCheckout,
        messages:         acc.messages         + i.messages,
      }),
      { impressions: 0, reach: 0, clicks: 0, spend: 0, conversions: 0, purchases: 0, initiateCheckout: 0, messages: 0 }
    );

    return NextResponse.json({ insights, totals });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
