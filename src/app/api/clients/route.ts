import { NextResponse } from 'next/server';
import { z } from 'zod';

// バリデーションスキーマ
const clientSchema = z.object({
  name: z.string().min(1, '必須項目です'),
  deviceCount: z.coerce.number().min(0, 'デバイス数は0以上である必要があります'),
});

// テスト用のダミーデータ
let clients = [
  {
    id: '1',
    name: 'テスト株式会社',
    deviceCount: 10,
    createdAt: '2024-03-20T00:00:00.000Z',
  },
  {
    id: '2',
    name: 'サンプル商事',
    deviceCount: 6,
    createdAt: '2024-03-19T00:00:00.000Z',
  },
];

// クライアント一覧を取得
export async function GET() {
  try {
    // TODO: データベースからクライアント一覧を取得する
    // 一時的なモックデータ
    const mockClients = [
      {
        id: '1',
        name: '株式会社テクノロジー',
        deviceCount: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: '株式会社イノベーション',
        deviceCount: 3,
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(mockClients);
  } catch (error) {
    console.error('Failed to fetch clients:', error);
    return new NextResponse('クライアント一覧の取得に失敗しました', { status: 500 });
  }
}

// 新規クライアントを作成
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validatedData = clientSchema.parse(data);

    // TODO: データベースにクライアントを作成する
    const newClient = {
      id: Math.random().toString(36).slice(2),
      ...validatedData,
      createdAt: new Date().toISOString(),
    };

    clients.push(newClient);

    return NextResponse.json(newClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
      });
    }
    console.error('Failed to create client:', error);
    return new NextResponse('クライアントの作成に失敗しました', { status: 500 });
  }
}

// クライアントを更新
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;
    const validatedData = clientSchema.partial().parse(updateData);

    if (!id) {
      return new NextResponse('クライアントIDが必要です', { status: 400 });
    }

    // TODO: データベースのクライアントを更新する
    const updatedClient = {
      id,
      name: validatedData.name ?? 'Unknown',
      deviceCount: validatedData.deviceCount ?? 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
      });
    }
    console.error('Failed to update client:', error);
    return new NextResponse('クライアントの更新に失敗しました', { status: 500 });
  }
}

// クライアントを削除
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'クライアントIDが必要です' },
        { status: 400 }
      );
    }

    // TODO: データベースからクライアントを削除する

    const clientIndex = clients.findIndex((client) => client.id === id);
    if (clientIndex === -1) {
      return NextResponse.json(
        { error: 'クライアントが見つかりません' },
        { status: 404 }
      );
    }

    const deletedClient = clients[clientIndex];
    clients = clients.filter((client) => client.id !== id);

    return NextResponse.json(deletedClient);
  } catch (error) {
    console.error('Failed to delete client:', error);
    return NextResponse.json(
      { error: 'クライアントの削除に失敗しました' },
      { status: 500 }
    );
  }
} 