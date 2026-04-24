import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Extract TikTok video ID from URL */
function extractTikTokId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/)
  return match ? match[1] : null
}

/** Upload thumbnail to Supabase Storage and return permanent public URL */
async function uploadThumbnailToStorage(
  cdnUrl: string,
  videoId: string
): Promise<string | null> {
  try {
    // TikTok CDN needs browser-like headers to allow server-side fetch
    const imgRes = await fetch(cdnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })
    if (!imgRes.ok) {
      console.error('[tiktok-meta] Image fetch failed:', imgRes.status, cdnUrl)
      return null
    }

    const blob = await imgRes.blob()
    const arrayBuffer = await blob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const contentType = blob.type || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const path = `tiktok/${videoId}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from('thumbnails')
      .upload(path, buffer, {
        contentType,
        upsert: true,
      })

    if (error) {
      console.error('[tiktok-meta] Storage upload error:', error)
      return null
    }

    const { data } = supabaseAdmin.storage.from('thumbnails').getPublicUrl(path)
    return data.publicUrl ?? null
  } catch (e) {
    console.error('[tiktok-meta] Failed to upload thumbnail:', e)
    return null
  }
}

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
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    )
    if (!res.ok) {
      return NextResponse.json({ error: 'TikTok oEmbed request failed' }, { status: 502 })
    }
    const data = await res.json()

    const cdnThumbnail: string | null = data.thumbnail_url ?? null
    let thumbnailUrl: string | null = cdnThumbnail

    // Try uploading to Supabase Storage for a permanent URL
    // Falls back to TikTok CDN URL if Storage fails (e.g. bucket not set up yet)
    if (cdnThumbnail) {
      const videoId = extractTikTokId(url)
      if (videoId) {
        const storageUrl = await uploadThumbnailToStorage(cdnThumbnail, videoId)
        if (storageUrl) {
          thumbnailUrl = storageUrl
          console.log('[tiktok-meta] Uploaded to Storage:', storageUrl)
        } else {
          console.warn('[tiktok-meta] Storage upload failed, using CDN URL as fallback')
        }
      }
    }

    return NextResponse.json({
      title: data.title ?? null,
      thumbnail_url: thumbnailUrl, // Always returns something if oEmbed has it
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch TikTok metadata' }, { status: 500 })
  }
}
