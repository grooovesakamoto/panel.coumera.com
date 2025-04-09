import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { DetectionLine } from '@/components/detection-line-editor'

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const result = await pool.query(
      `SELECT * FROM detection_lines WHERE device_id = $1 ORDER BY created_at ASC`,
      [params.deviceId]
    )
    
    const lines = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      points: [
        { x: row.start_x, y: row.start_y },
        { x: row.end_x, y: row.end_y }
      ],
    }))

    return NextResponse.json(lines)
  } catch (error) {
    console.error('Failed to fetch detection lines:', error)
    return new NextResponse('検知ラインの取得に失敗しました', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const lines: DetectionLine[] = await request.json()
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      await client.query('DELETE FROM detection_lines WHERE device_id = $1', [params.deviceId])

      for (const line of lines) {
        await client.query(
          `INSERT INTO detection_lines (
            id, device_id, name, type, start_x, start_y, end_x, end_y
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            line.id,
            params.deviceId,
            line.name,
            line.type,
            line.points[0].x,
            line.points[0].y,
            line.points[1].x,
            line.points[1].y,
          ]
        )
      }

      await client.query('COMMIT')
      return new NextResponse('検知ラインを保存しました', { status: 200 })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Failed to save detection lines:', error)
    return new NextResponse('検知ラインの保存に失敗しました', { status: 500 })
  }
} 