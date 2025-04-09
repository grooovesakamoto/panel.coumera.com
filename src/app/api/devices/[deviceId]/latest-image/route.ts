import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

// Google Cloud Storageの設定
const storage = new Storage()
// バケット名が指定されていない場合の処理を追加
const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || ''

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    // バケット名が設定されていない場合はエラーを返す
    if (!bucketName) {
      console.error('Google Cloud Storage bucket name is not set');
      return new NextResponse('Storage configuration is not available', { status: 503 });
    }

    // バケットを取得
    const bucket = storage.bucket(bucketName);

    // デバイスIDから最新の画像を取得
    const [files] = await bucket.getFiles({
      prefix: `devices/${params.deviceId}/images/`,
    })

    // 作成日時でソート
    const sortedFiles = files.sort((a, b) => {
      const aTime = a.metadata.timeCreated ? new Date(a.metadata.timeCreated).getTime() : 0
      const bTime = b.metadata.timeCreated ? new Date(b.metadata.timeCreated).getTime() : 0
      return bTime - aTime
    })

    if (sortedFiles.length === 0) {
      return new NextResponse('画像が見つかりません', { status: 404 })
    }

    const [signedUrl] = await sortedFiles[0].getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1時間
    })

    // 画像のURLにリダイレクト
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error('Failed to get latest image:', error)
    return new NextResponse('画像の取得に失敗しました', { status: 500 })
  }
} 