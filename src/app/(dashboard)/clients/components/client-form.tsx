'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Client } from '@/types';
import { useClientStore } from '@/store/use-client-store';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, '必須項目です'),
});

type FormValues = z.infer<typeof formSchema>;

interface ClientFormProps {
  client?: Client;
  onSuccess?: () => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const { createClient, updateClient } = useClientStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name ?? '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (client) {
        await updateClient(client.id, values.name);
        toast.success('クライアントを更新しました');
      } else {
        await createClient(values.name);
        toast.success('クライアントを作成しました');
      }
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('クライアントの保存に失敗しました:', error);
      toast.error('クライアントの保存に失敗しました');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>クライアント名</FormLabel>
              <FormControl>
                <Input placeholder="クライアント名を入力" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">保存</Button>
      </form>
    </Form>
  );
} 