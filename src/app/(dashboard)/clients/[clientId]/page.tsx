import { useParams } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function ClientPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({
    where: {
      id: params.clientId,
    },
  });

  if (!client) {
    return (
      <div>
        <h1>クライアントが見つかりません</h1>
      </div>
    );
  }

  return (
    <div>
      <h1>クライアント詳細</h1>
      <div>
        <h2>{client.name}</h2>
        <p>ID: {client.id}</p>
        {/* 他のクライアント情報の表示 */}
      </div>
    </div>
  );
} 