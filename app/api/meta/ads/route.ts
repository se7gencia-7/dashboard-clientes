import { NextRequest, NextResponse } from 'next/server';

const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adAccountId = searchParams.get('account_id') ?? process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;
  const campaignIdsRaw = searchParams.get('campaign_ids');

  if (!adAccountId || !accessToken) {
    return NextResponse.json({ error: 'Meta credentials not configured' }, { status: 500 });
  }

  const params = new URLSearchParams({
    fields: 'id,name,adset_id,campaign_id,status,creative{id,thumbnail_url,video_id,image_url,title,body,call_to_action_type,object_type}',
    access_token: accessToken,
    limit: '200',
  });

  if (campaignIdsRaw) {
    const ids = campaignIdsRaw.split(',').filter(Boolean);
    params.set('filtering', JSON.stringify([
      { field: 'campaign.id', operator: 'IN', value: ids },
    ]));
  }

  try {
    const res = await fetch(`${META_BASE_URL}/act_${adAccountId}/ads?${params}`, {
      next: { revalidate: 300 },
    });
    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 500 });
    }

    return NextResponse.json({ ads: json.data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
