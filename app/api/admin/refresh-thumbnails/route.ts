import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ADMIN_EMAIL } from '@/lib/config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function extractTikTokId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/)
  return match ? match[1] : null
}

async function uploadThumbnailToStorage(cdnUrl: string, videoId: string): Promise<string | null> {
  try {
    const imgRes = await fetch(cdnUrl)
    if (!imgRes.ok) return null
    const blob = await imgRes.blob()
    const buffer = Buffer.from(await blob.arrayBuffer())
    const contentType = blob.type || 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
    const path = `tiktok/${videoId}.${ext}`
    const { error } = await supabaseAdmin.storage.from('thumbnails').upload(path, buffer, { contentType, upsert: true })
    if (error) return null
    return supabaseAdmin.storage.from('thumbnails').getPublicUrl(path).data.publicUrl ?? null
  } catch {
    return null
  }
}

async function fetchTikTokThumbnail(videoUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.thumbnail_url ?? null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  // Verify admin
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch all TikTok videos
  const { data: videos, error } = await supabaseAdmin
    .from('gwc_videos')
    .select('id, video_id, video_url, thumbnail_url')
    .eq('platform', 'tiktok')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results = { updated: 0, skipped: 0, failed: 0 }

  for (const video of videos ?? []) {
    try {
      // Skip if already in Supabase Storage
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
      if (video.thumbnail_url?.includes(supabaseUrl)) {
        results.skipped++
        continue
      }

      const tikTokId = extractTikTokId(video.video_url) ?? video.video_id
      if (!tikTokId) { results.failed++; continue }

      // Fetch from TikTok oEmbed
      const cdnUrl = await fetchTikTokThumbnail(video.video_url)
      if (!cdnUrl) { results.failed++; continue }

      // Upload to Storage
      const storageUrl = await uploadThumbnailToStorage(cdnUrl, tikTokId)
      if (!storageUrl) { results.failed++; continue }

      // Update DB
      await supabaseAdmin.from('gwc_videos').update({ thumbnail_url: storageUrl }).eq('id', video.id)
      results.updated++
    } catch {
      results.failed++
    }
  }

  return NextResponse.json({ success: true, ...results, total: (videos ?? []).length })
}
