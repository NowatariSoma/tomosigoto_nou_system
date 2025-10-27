import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';

type FormType = 'playlist' | 'subPlaylist' | 'video' | null;

interface NewMaterialTypeSelectorProps {
  onSelectType: (type: FormType) => void;
}

export function NewMaterialTypeSelector({ onSelectType }: NewMaterialTypeSelectorProps) {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.push('/materials')}
          className="flex items-center gap-2"
        >
          ← 戻る
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">新しく追加</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onSelectType('playlist')}
        >
          <CardHeader>
            <CardTitle>新しいプレイリスト</CardTitle>
            <CardDescription>
              年度と舞台の組み合わせで新しいプレイリストを作成します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Plus className="h-16 w-16 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onSelectType('subPlaylist')}
        >
          <CardHeader>
            <CardTitle>本番・稽古プレイリスト</CardTitle>
            <CardDescription>
              本番または稽古のプレイリストを追加します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Plus className="h-16 w-16 text-slate-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-all"
          onClick={() => onSelectType('video')}
        >
          <CardHeader>
            <CardTitle>新規動画</CardTitle>
            <CardDescription>
              個別の動画を追加します
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <Plus className="h-16 w-16 text-slate-400" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

