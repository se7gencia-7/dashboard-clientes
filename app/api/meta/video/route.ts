import { NextRequest, NextResponse } from 'next/server';

const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId     = searchParams.get('video_id');
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!videoId || !accessToken) {
    return NextResponse.json({ error: 'Missing video_id or token' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${META_BASE_URL}/${videoId}?fields=source,picture,title,description&access_token=${accessToken}`,
      { next: { revalidate: 3600 } }
    );
    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ error: json.error.message }, { status: 500 });
    }

    return NextResponse.json({
      source:      json.source      ?? null,
      picture:     json.picture     ?? null,
      title:       json.title       ?? null,
      description: json.description ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
