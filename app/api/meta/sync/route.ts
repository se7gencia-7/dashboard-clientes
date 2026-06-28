import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { fetchMetaCampaigns, fetchMetaInsights, getConversions } from '@/lib/meta-api';

const prisma = new PrismaClient();

// POST /api/meta/sync?projectId=xxx
// Sincroniza campanhas e métricas do Meta com o banco de dados
export async function POST(request: NextRequest) {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    return NextResponse.json(
      { error: 'Meta credentials not configured' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    const [metaCampaigns, insights] = await Promise.all([
      fetchMetaCampaigns(adAccountId, accessToken),
      fetchMetaInsights({ adAccountId, accessToken, datePreset: 'last_30d', level: 'campaign' }),
    ]);

    const insightMap = new Map(insights.map((i) => [i.campaign_id, i]));

    let synced = 0;

    for (const mc of metaCampaigns) {
      // Upsert: cria ou atualiza a campanha
      const campaign = await prisma.campaign.upsert({
        where: { metaCampaignId: mc.id },
        update: {
          name: mc.name,
          status: mc.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        },
        create: {
          name: mc.name,
          status: mc.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
          budget: mc.daily_budget ? parseFloat(mc.daily_budget) / 100 : 0,
          metaCampaignId: mc.id,
          projectId,
        },
      });

      const insight = insightMap.get(mc.id);
      if (insight) {
        await prisma.metric.create({
          data: {
            campaignId: campaign.id,
            date: new Date(insight.date_start),
            reach: parseInt(insight.reach ?? '0', 10),
            clicks: parseInt(insight.clicks ?? '0', 10),
            spend: parseFloat(insight.spend ?? '0'),
            conversions: getConversions(insight),
          },
        });
        synced++;
      }
    }

    return NextResponse.json({
      ok: true,
      campaignsSynced: metaCampaigns.length,
      metricsCreated: synced,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
