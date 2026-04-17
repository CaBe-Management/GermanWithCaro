import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Only allow TikTok URLs — prevents abuse of this proxy endpoint
  if (
    !url.startsWith('https://www.tiktok.com/') &&
    !url.startsWith('https://vm.tiktok.com/')
  ) {
    return NextResponse.json({ error: 'Only TikTok URLs are supported' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
      { next: { revalidate: 3600 } } // cache 1h
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'TikTok oEmbed request failed' }, { status: 502 })
    }
    const data = await res.json()
    return NextResponse.json({
      title: data.title ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch TikTok metadata' }, { status: 500 })
  }
}
