import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { deviceId: string } }
) {
  try {
    const deviceId = params.deviceId;

    // デバイスログを取得（最新の50件）
    const result = await pool.query(
      `SELECT timestamp, message, level
       FROM device_logs
       WHERE device_id = $1
       ORDER BY timestamp DESC
       LIMIT 50`,
      [deviceId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Failed to fetch device logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch device logs' },
      { status: 500 }
    );
  }
} 