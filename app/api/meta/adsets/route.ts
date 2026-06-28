import { NextRequest, NextResponse } from 'next/server';
import { fetchMetaAdSets } from '@/lib/meta-api';

export async function GET(request: NextRequest) {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    return NextResponse.json({ error: 'Meta credentials not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const campaignIdsRaw = searchParams.get('campaign_ids');
  const campaignIds    = campaignIdsRaw ? campaignIdsRaw.split(',').filter(Boolean) : undefined;

  try {
    const adsets = await fetchMetaAdSets(adAccountId, accessToken, campaignIds);
    return NextResponse.json({ adsets });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
