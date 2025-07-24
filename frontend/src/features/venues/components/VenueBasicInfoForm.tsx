'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Phone, Mail, MapPin, Users, DollarSign } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VenueBasicInfo } from '../types/venueForm';
import { venueBasicInfoSchema } from '../utils/validationHelpers';

interface VenueBasicInfoFormProps {
  value: VenueBasicInfo;
  onChange: (data: VenueBasicInfo) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export const VenueBasicInfoForm: React.FC<VenueBasicInfoFormProps> = ({
  value,
  onChange,
  errors = {},
  disabled = false
}) => {
  const form = useForm<VenueBasicInfo>({
    resolver: zodResolver(venueBasicInfoSchema),
    defaultValues: value,
    values: value, // 外部からの値変更を反映
    mode: 'onChange'
  });

  // フォーム値が変更された時に親に通知
  React.useEffect(() => {
    const subscription = form.watch((formData) => {
      onChange(formData as VenueBasicInfo);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  // 外部エラーを設定
  React.useEffect(() => {
    Object.entries(errors).forEach(([field, message]) => {
      if (message) {
        form.setError(field as keyof VenueBasicInfo, {
          type: 'manual',
          message
        });
      }
    });
  }, [errors, form]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Building2 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">会場基本情報</h2>
      </div>
      
      <Form {...form}>
        <div className="grid gap-6">
          {/* 基本情報セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本情報</CardTitle>
              <CardDescription>
                会場の基本的な情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>会場名 <span className="text-red-500">*</span></span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="会場名を入力してください"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      スケジュールに表示される会場名です
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="会場の説明を入力してください（任意）"
                        className="min-h-[100px]"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      会場の特徴や詳細情報を記入できます
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 所在地情報セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>所在地情報</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>住所 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="住所を入力してください"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      郵便番号から番地まで詳細に入力してください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>アクセス情報</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="最寄り駅からのアクセス方法など（任意）"
                        className="min-h-[80px]"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      電車・バス・車でのアクセス方法を記載できます
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 連絡先情報セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">連絡先情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>電話番号 <span className="text-red-500">*</span></span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="03-1234-5678"
                          disabled={disabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>メールアドレス <span className="text-red-500">*</span></span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@example.com"
                          disabled={disabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 料金・収容人数セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">料金・収容情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>収容人数 <span className="text-red-500">*</span></span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50"
                          min="1"
                          disabled={disabled}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        最大収容人数を入力してください
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>時間料金（円） <span className="text-red-500">*</span></span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000"
                          min="0"
                          disabled={disabled}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        1時間あたりの利用料金を入力してください
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 備考セクション */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">備考</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>備考</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="その他の情報やご注意事項など（任意）"
                        className="min-h-[100px]"
                        disabled={disabled}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      特別な注意事項や追加情報があれば記載してください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
};