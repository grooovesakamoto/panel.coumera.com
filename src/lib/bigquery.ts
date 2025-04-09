import { BigQuery } from '@google-cloud/bigquery';

// BigQueryクライアントのインスタンスを作成
export const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

export interface MeasurementData {
  deviceId: string;
  timestamp: Date;
  peopleCount: number;
  avgDwellTime: number;
  zoneData: Record<string, number>;
  rawData: Record<string, any>;
}

export async function insertMeasurement(
  datasetId: string,
  tableId: string,
  measurement: MeasurementData
) {
  const rows = [{
    device_id: measurement.deviceId,
    timestamp: measurement.timestamp,
    people_count: measurement.peopleCount,
    avg_dwell_time: measurement.avgDwellTime,
    zone_data: JSON.stringify(measurement.zoneData),
    raw_data: JSON.stringify(measurement.rawData),
    inserted_at: new Date()
  }];

  try {
    await bigquery
      .dataset(datasetId)
      .table(tableId)
      .insert(rows);
    return { success: true };
  } catch (error) {
    console.error('BigQuery insertion error:', error);
    return { success: false, error };
  }
}

export async function queryMeasurements(
  datasetId: string,
  tableId: string,
  deviceId: string,
  startDate: Date,
  endDate: Date
) {
  const query = `
    SELECT
      timestamp,
      people_count,
      avg_dwell_time,
      zone_data,
      raw_data
    FROM \`${process.env.GOOGLE_CLOUD_PROJECT}.${datasetId}.${tableId}\`
    WHERE device_id = @deviceId
      AND timestamp BETWEEN @startDate AND @endDate
    ORDER BY timestamp DESC
  `;

  const options = {
    query,
    params: {
      deviceId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  };

  try {
    const [rows] = await bigquery.query(options);
    return { success: true, data: rows };
  } catch (error) {
    console.error('BigQuery query error:', error);
    return { success: false, error };
  }
}

export async function createMeasurementTable(
  datasetId: string,
  tableId: string
) {
  const schema = [
    { name: 'device_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'people_count', type: 'INTEGER', mode: 'REQUIRED' },
    { name: 'avg_dwell_time', type: 'FLOAT', mode: 'REQUIRED' },
    { name: 'zone_data', type: 'STRING', mode: 'NULLABLE' },
    { name: 'raw_data', type: 'STRING', mode: 'NULLABLE' },
    { name: 'inserted_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
  ];

  try {
    const [table] = await bigquery
      .dataset(datasetId)
      .createTable(tableId, { schema });
    
    return { success: true, tableId: table.id };
  } catch (error) {
    console.error('BigQuery table creation error:', error);
    return { success: false, error };
  }
} 