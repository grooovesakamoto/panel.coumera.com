import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { Role } from '@prisma/client';

/**
 * 特定のユーザー情報を取得
 * ADMIN: すべてのユーザーを取得可能
 * CLIENT_ADMIN: 自分のクライアントに所属するユーザーのみ取得可能
 * USER/VIEWER: 自分自身の情報のみ取得可能
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  
  try {
    const userId = params.id;
    
    // ユーザーの取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        client: { select: { id: true, name: true } },
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    
    // アクセス権チェック
    const isAdmin = session.user.role === Role.ADMIN;
    const isClientAdmin = session.user.role === Role.CLIENT_ADMIN && session.user.clientId === user.clientId;
    const isSelf = session.user.id === user.id;
    
    if (!isAdmin && !isClientAdmin && !isSelf) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    
    // パスワードを除外して返す
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return NextResponse.json({ error: 'ユーザーの取得に失敗しました' }, { status: 500 });
  }
}

/**
 * ユーザー情報を更新
 * ADMIN: すべてのユーザーを更新可能
 * CLIENT_ADMIN: 自分のクライアントに所属するユーザーのみ更新可能
 * USER/VIEWER: 自分自身の一部情報のみ更新可能
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  
  try {
    const userId = params.id;
    const data = await request.json();
    
    // 更新対象のユーザーを取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    
    // アクセス権チェック
    const isAdmin = session.user.role === Role.ADMIN;
    const isClientAdmin = session.user.role === Role.CLIENT_ADMIN && session.user.clientId === user.clientId;
    const isSelf = session.user.id === user.id;
    
    if (!isAdmin && !isClientAdmin && !isSelf) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }
    
    // 更新可能なフィールドを制限
    const updateData: any = {};
    
    // 管理者は全フィールドを更新可能
    if (isAdmin) {
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.clientId !== undefined) updateData.clientId = data.clientId;
    } 
    // クライアント管理者は自分のクライアントに属するユーザーの一部フィールドを更新可能
    else if (isClientAdmin) {
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      
      // クライアント管理者は管理者ロールに変更できない
      if (data.role !== undefined && data.role !== Role.ADMIN) {
        updateData.role = data.role;
      }
    } 
    // 一般ユーザーは自分自身の一部フィールドのみ更新可能
    else if (isSelf) {
      if (data.name !== undefined) updateData.name = data.name;
      if (data.phone !== undefined) updateData.phone = data.phone;
    }
    
    // パスワード更新
    if (data.password) {
      // 自分自身のパスワード変更は現在のパスワードが必要（管理者とクライアント管理者は不要）
      if (isSelf && !isAdmin && !isClientAdmin) {
        if (!data.currentPassword) {
          return NextResponse.json({ error: '現在のパスワードが必要です' }, { status: 400 });
        }
        
        // 現在のパスワードを検証
        const isValid = await bcrypt.compare(data.currentPassword, user.password);
        if (!isValid) {
          return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 });
        }
      }
      
      // 新しいパスワードをハッシュ化
      updateData.password = await hash(data.password, 10);
    }
    
    // 更新するデータがなければエラー
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '更新するデータがありません' }, { status: 400 });
    }
    
    // ユーザー更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
      },
    });
    
    // パスワードを除外して返す
    const { password, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error: any) {
    console.error('ユーザー更新エラー:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: '既に登録されているメールアドレスです' }, { status: 409 });
    }
    
    return NextResponse.json({ error: 'ユーザーの更新に失敗しました' }, { status: 500 });
  }
}

/**
 * ユーザーを削除
 * ADMIN: すべてのユーザーを削除可能
 * CLIENT_ADMIN: 自分のクライアントに所属するユーザーのみ削除可能
 * USER/VIEWER: 削除不可
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }
  
  try {
    const userId = params.id;
    
    // 削除対象のユーザーを取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    
    // アクセス権チェック
    const isAdmin = session.user.role === Role.ADMIN;
    const isClientAdmin = session.user.role === Role.CLIENT_ADMIN && session.user.clientId === user.clientId;
    
    // 自分自身は削除できない
    if (userId === session.user.id) {
      return NextResponse.json({ error: '自分自身を削除することはできません' }, { status: 403 });
    }
    
    // 管理者は管理者以外を削除可能
    if (isAdmin) {
      if (user.role === Role.ADMIN && session.user.id !== userId) {
        return NextResponse.json({ error: '他の管理者ユーザーは削除できません' }, { status: 403 });
      }
    } 
    // クライアント管理者は自分のクライアントの一般ユーザーのみ削除可能
    else if (isClientAdmin) {
      if (user.role === Role.ADMIN || user.role === Role.CLIENT_ADMIN) {
        return NextResponse.json({ error: '管理者ユーザーは削除できません' }, { status: 403 });
      }
    } 
    // 一般ユーザーは削除不可
    else {
      return NextResponse.json({ error: 'ユーザーを削除する権限がありません' }, { status: 403 });
    }
    
    // ユーザー削除
    await prisma.user.delete({
      where: { id: userId },
    });
    
    return NextResponse.json({ message: 'ユーザーを削除しました' });
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    return NextResponse.json({ error: 'ユーザーの削除に失敗しました' }, { status: 500 });
  }
} 