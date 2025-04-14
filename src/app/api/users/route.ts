import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

/**
 * ユーザー一覧を取得
 * ADMIN: 全ユーザーまたは特定クライアントのユーザーを取得
 * CLIENT_ADMIN: 自分のクライアントに所属するユーザーのみ取得
 * その他: 権限なし
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  
  // パラメータからクライアントIDを取得（任意）
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');
  
  try {
    // ADMINならすべてのユーザー、CLIENT_ADMINなら自クライアントのユーザーのみ
    if (session.user.role === Role.ADMIN) {
      const users = await prisma.user.findMany({
        where: clientId ? { clientId } : undefined,
        include: { client: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      
      // パスワードを除外して返す
      const usersWithoutPassword = users.map(user => {
        const { password, ...rest } = user;
        return rest;
      });
      
      return NextResponse.json(usersWithoutPassword);
    } else if (session.user.role === Role.CLIENT_ADMIN) {
      // 自分のクライアントに所属するユーザーのみ取得可能
      const users = await prisma.user.findMany({
        where: { clientId: session.user.clientId },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      
      // パスワードを除外して返す
      const usersWithoutPassword = users.map(user => {
        const { password, ...rest } = user;
        return rest;
      });
      
      return NextResponse.json(usersWithoutPassword);
    } else {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 });
  }
}

/**
 * ユーザーを新規作成
 * ADMIN: 任意のクライアントに任意のロールのユーザーを作成可能
 * CLIENT_ADMIN: 自分のクライアントにADMIN以外のユーザーを作成可能
 * その他: 権限なし
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const { email, name, password, role, phone, clientId, isActive = true } = data;
    
    // バリデーション
    if (!email || !password) {
      return NextResponse.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 });
    }
    
    // 権限確認
    if (session.user.role === Role.ADMIN) {
      // 管理者は任意のクライアントに任意のロールのユーザーを追加可能
    } else if (session.user.role === Role.CLIENT_ADMIN) {
      // クライアント管理者は自分のクライアントにのみ追加可能
      if (clientId !== session.user.clientId) {
        return NextResponse.json({ error: '他のクライアントにユーザーを追加する権限がありません' }, { status: 403 });
      }
      // クライアント管理者はADMINロールのユーザーを作成できない
      if (role === Role.ADMIN) {
        return NextResponse.json({ error: '管理者ユーザーを作成する権限がありません' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'ユーザーを追加する権限がありません' }, { status: 403 });
    }
    
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json({ error: '既に登録されているメールアドレスです' }, { status: 409 });
    }
    
    // パスワードをハッシュ化
    const hashedPassword = await hash(password, 10);
    
    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone,
        role: role || Role.VIEWER,
        clientId,
        isActive,
        createdBy: session.user.id,
      },
      include: {
        client: { select: { id: true, name: true } },
      }
    });
    
    // パスワードを除外して返す
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    console.error('ユーザー作成エラー:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '既に登録されているメールアドレスです' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'ユーザー作成に失敗しました' }, { status: 500 });
  }
} 