import { NextRequest, NextResponse } from 'next/server';
import { fetchMetaCampaigns } from '@/lib/meta-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adAccountId = searchParams.get('account_id') ?? process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    return NextResponse.json(
      { error: 'Meta credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const campaigns = await fetchMetaCampaigns(adAccountId, accessToken);
    return NextResponse.json({ campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
