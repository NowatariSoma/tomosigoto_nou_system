'use client';

import { useHearingAssistant } from '../../hooks/useHearingAssistant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/forms/button';
import { Badge } from '@/components/ui/feedback/badge';
import { 
  Eye, 
  Download, 
  FileText, 
  Settings,
  Target,
  Shield,
  AlertTriangle,
  Info
} from 'lucide-react';
import { HearingAssistantService } from '../../services/HearingAssistantService';

export function PreviewStep() {
  const { 
    requirementsDocument, 
    exportDocument,
    resetAssistant 
  } = useHearingAssistant();

  const handleExport = (format: 'markdown' | 'pdf' | 'word') => {
    HearingAssistantService.exportDocument(requirementsDocument!, format);
  };

  const renderSection = (title: string, icon: React.ReactNode, content: React.ReactNode) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  );

  // モック用のレンダリング関数
  const renderProjectInfoMock = (projectInfo: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">基本情報</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">プロジェクト名:</dt>
              <dd className="font-medium">{projectInfo.projectName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">顧客名:</dt>
              <dd className="font-medium">{projectInfo.customerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">担当者:</dt>
              <dd className="font-medium">{projectInfo.contactPerson}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 mb-2">プロジェクト詳細</h4>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">種別:</dt>
              <dd className="font-medium">{projectInfo.projectType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">目標納期:</dt>
              <dd className="font-medium">{projectInfo.targetDate}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">予算:</dt>
              <dd className="font-medium">{projectInfo.budget}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );

  const renderFunctionalRequirementsMock = (functionalRequirements: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">加工仕様</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">加工モード: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {functionalRequirements.processingMode?.map((mode: string, index: number) => (
                    <Badge key={index} variant="secondary">{mode}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">対象材料: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {functionalRequirements.targetMaterials?.map((material: string, index: number) => (
                    <Badge key={index} variant="secondary">{material}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">加工精度: </span>
                <span className="font-medium">{functionalRequirements.processingPrecision}</span>
              </div>
              <div>
                <span className="text-gray-600">加工速度: </span>
                <span className="font-medium">{functionalRequirements.processingSpeed}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">システム仕様</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">通信機能: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {functionalRequirements.communicationFeatures?.map((feature: string, index: number) => (
                    <Badge key={index} variant="secondary">{feature}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">HMI要件: </span>
                <span className="font-medium">{functionalRequirements.hmiRequirements}</span>
              </div>
              <div>
                <span className="text-gray-600">エラー管理: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {functionalRequirements.errorManagement?.map((error: string, index: number) => (
                    <Badge key={index} variant="secondary">{error}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNonFunctionalRequirementsMock = (nonFunctionalRequirements: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">性能要件</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">稼働率: </span>
                <span className="font-medium">{nonFunctionalRequirements.performanceRequirements?.operatingRate}</span>
              </div>
              <div>
                <span className="text-gray-600">MTBF: </span>
                <span className="font-medium">{nonFunctionalRequirements.performanceRequirements?.mtbf}</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">信頼性要件</h4>
            <div className="flex flex-wrap gap-1">
              {nonFunctionalRequirements.reliabilityRequirements?.map((req: string, index: number) => (
                <Badge key={index} variant="secondary">{req}</Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">安全・規格要件</h4>
            <div className="space-y-2">
              <div>
                <span className="text-gray-600 text-sm">安全要件: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {nonFunctionalRequirements.safetyRequirements?.map((req: string, index: number) => (
                    <Badge key={index} variant="secondary">{req}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600 text-sm">法規制: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {nonFunctionalRequirements.legalRequirements?.map((req: string, index: number) => (
                    <Badge key={index} variant="secondary">{req}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConstraintsMock = (constraints: any) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-600">予算制約: </span>
            <span className="font-medium">{constraints.budgetConstraints}</span>
          </div>
          <div>
            <span className="text-gray-600">スケジュール制約: </span>
            <span className="font-medium">{constraints.scheduleConstraints}</span>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-600">設置スペース制約: </span>
            <span className="font-medium">{constraints.spaceConstraints}</span>
          </div>
          <div>
            <span className="text-gray-600">技術制約: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {constraints.technicalConstraints?.map((constraint: string, index: number) => (
                <Badge key={index} variant="secondary">{constraint}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!requirementsDocument) {
    // モック要件定義書データを生成
    const mockRequirementsDocument = {
      projectInfo: {
        projectName: 'レーザー加工システム導入プロジェクト',
        customerName: '株式会社サンプル自動車部品',
        contactPerson: '田中 太郎',
        projectType: 'レーザー加工システム導入',
        targetDate: '2024年6月末',
        budget: '3,000万円'
      },
      functionalRequirements: {
        processingMode: ['レーザー切断'],
        targetMaterials: ['ステンレス(SUS304)', '厚み 0.5mm～2.0mm'],
        processingPrecision: '±0.05mm',
        processingSpeed: '高速加工対応',
        workpieceSize: '最大 500mm × 500mm',
        communicationFeatures: ['生産管理システム連携', '実績データ送信'],
        hmiRequirements: 'タッチパネル形式',
        errorManagement: ['エラー内容の表示', 'ブザーでの通知', '履歴の自動記録']
      },
      nonFunctionalRequirements: {
        performanceRequirements: {
          operatingRate: '95%以上',
          mtbf: '8760時間以上（1年以上）',
          processingCapacity: '100個/時間'
        },
        reliabilityRequirements: ['24時間連続運転対応', '定期メンテナンス機能'],
        safetyRequirements: ['労働安全衛生法対応', 'CEマーキング対応'],
        maintenanceRequirements: ['予防保全機能', 'リモート診断対応'],
        environmentalRequirements: ['工場環境対応（温度・湿度・振動）'],
        legalRequirements: ['労働安全衛生法', 'CEマーキング'],
        costRequirements: '3,000万円以内'
      },
      constraints: {
        budgetConstraints: '3,000万円',
        scheduleConstraints: '2024年6月末までに導入完了',
        spaceConstraints: '既存ライン内設置（3m × 2m以内）',
        technicalConstraints: ['既存システムとの互換性確保'],
        organizationalConstraints: ['既存オペレーター対応可能']
      },
      additionalInfo: {
        specialRequirements: ['自動車部品向け品質基準対応'],
        futureExpansion: ['将来的な生産能力拡張対応'],
        notes: '対話型ヒアリング・アシスタントにより生成された要件定義書（デモ版）'
      }
    };

    return (
      <div className="space-y-6">
        {/* モックデータ使用時の警告 */}
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <Eye className="h-5 w-5" />
              <span className="text-sm font-medium">
                デモ用のサンプル要件定義書を表示しています
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ヘッダー */}
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Eye className="h-5 w-5" />
              要件定義書が完成しました
            </CardTitle>
            <CardDescription className="text-green-700">
              AIとの対話を通じて生成された要件定義書をご確認ください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleExport('markdown')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Markdown
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button
                onClick={() => handleExport('word')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Word
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 要件定義書の内容 */}
        <div className="space-y-6">
          {renderSection(
            '1. プロジェクト基本情報',
            <FileText className="h-5 w-5 text-blue-600" />,
            renderProjectInfoMock(mockRequirementsDocument.projectInfo)
          )}

          {renderSection(
            '2. 機能要件',
            <Settings className="h-5 w-5 text-purple-600" />,
            renderFunctionalRequirementsMock(mockRequirementsDocument.functionalRequirements)
          )}

          {renderSection(
            '3. 非機能要件',
            <Shield className="h-5 w-5 text-green-600" />,
            renderNonFunctionalRequirementsMock(mockRequirementsDocument.nonFunctionalRequirements)
          )}

          {renderSection(
            '4. 制約事項',
            <AlertTriangle className="h-5 w-5 text-orange-600" />,
            renderConstraintsMock(mockRequirementsDocument.constraints)
          )}

          {renderSection(
            '5. その他',
            <Info className="h-5 w-5 text-gray-600" />,
            <div className="text-sm text-gray-600">
              <p>{mockRequirementsDocument.additionalInfo.notes}</p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={resetAssistant}
          >
            新しいヒアリングを開始
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('markdown')}
              className="btn-primary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              要件定義書をダウンロード
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderProjectInfo = () => (
    <div className="space-y-4">
      {requirementsDocument.projectInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">基本情報</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">プロジェクト名:</dt>
                <dd className="font-medium">{requirementsDocument.projectInfo.projectName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">顧客名:</dt>
                <dd className="font-medium">{requirementsDocument.projectInfo.customerName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">担当者:</dt>
                <dd className="font-medium">{requirementsDocument.projectInfo.contactPerson}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">プロジェクト詳細</h4>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">種別:</dt>
                <dd className="font-medium">{requirementsDocument.projectInfo.projectType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">目標納期:</dt>
                <dd className="font-medium">{requirementsDocument.projectInfo.targetDate || '未定'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">予算:</dt>
                <dd className="font-medium">{requirementsDocument.projectInfo.budget || '未定'}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );

  const renderFunctionalRequirements = () => (
    <div className="space-y-4">
      {requirementsDocument.functionalRequirements && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">加工仕様</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">加工モード: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {requirementsDocument.functionalRequirements.processingMode?.map((mode, index) => (
                      <Badge key={index} variant="secondary">{mode}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">対象材料: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {requirementsDocument.functionalRequirements.targetMaterials?.map((material, index) => (
                      <Badge key={index} variant="secondary">{material}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">加工精度: </span>
                  <span className="font-medium">{requirementsDocument.functionalRequirements.processingPrecision}</span>
                </div>
                <div>
                  <span className="text-gray-600">加工速度: </span>
                  <span className="font-medium">{requirementsDocument.functionalRequirements.processingSpeed || '未定'}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">システム仕様</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">通信機能: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {requirementsDocument.functionalRequirements.communicationFeatures?.map((feature, index) => (
                      <Badge key={index} variant="secondary">{feature}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">HMI要件: </span>
                  <span className="font-medium">{requirementsDocument.functionalRequirements.hmiRequirements}</span>
                </div>
                <div>
                  <span className="text-gray-600">エラー管理: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {requirementsDocument.functionalRequirements.errorManagement?.map((error, index) => (
                      <Badge key={index} variant="secondary">{error}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNonFunctionalRequirements = () => (
    <div className="space-y-4">
      {requirementsDocument.nonFunctionalRequirements && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">性能要件</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">稼働率: </span>
                  <span className="font-medium">{requirementsDocument.nonFunctionalRequirements.performanceRequirements?.operatingRate || '未定'}</span>
                </div>
                <div>
                  <span className="text-gray-600">MTBF: </span>
                  <span className="font-medium">{requirementsDocument.nonFunctionalRequirements.performanceRequirements?.mtbf}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">信頼性要件</h4>
              <div className="flex flex-wrap gap-1">
                {requirementsDocument.nonFunctionalRequirements.reliabilityRequirements?.map((req, index) => (
                  <Badge key={index} variant="secondary">{req}</Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">安全・規格要件</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600 text-sm">安全要件: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {requirementsDocument.nonFunctionalRequirements.safetyRequirements?.map((req, index) => (
                      <Badge key={index} variant="secondary">{req}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">法規制: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {requirementsDocument.nonFunctionalRequirements.legalRequirements?.map((req, index) => (
                      <Badge key={index} variant="secondary">{req}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderConstraints = () => (
    <div className="space-y-4">
      {requirementsDocument.constraints && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">予算制約: </span>
              <span className="font-medium">{requirementsDocument.constraints.budgetConstraints || '未定'}</span>
            </div>
            <div>
              <span className="text-gray-600">スケジュール制約: </span>
              <span className="font-medium">{requirementsDocument.constraints.scheduleConstraints || '未定'}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-600">設置スペース制約: </span>
              <span className="font-medium">{requirementsDocument.constraints.spaceConstraints || '未定'}</span>
            </div>
            <div>
              <span className="text-gray-600">技術制約: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {requirementsDocument.constraints.technicalConstraints?.map((constraint, index) => (
                  <Badge key={index} variant="secondary">{constraint}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Eye className="h-5 w-5" />
            要件定義書が完成しました
          </CardTitle>
          <CardDescription className="text-green-700">
            AIとの対話を通じて生成された要件定義書をご確認ください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => handleExport('markdown')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Markdown
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={() => handleExport('word')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Word
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 要件定義書の内容 */}
      <div className="space-y-6">
        {renderSection(
          '1. プロジェクト基本情報',
          <FileText className="h-5 w-5 text-blue-600" />,
          renderProjectInfo()
        )}

        {renderSection(
          '2. 機能要件',
          <Settings className="h-5 w-5 text-purple-600" />,
          renderFunctionalRequirements()
        )}

        {renderSection(
          '3. 非機能要件',
          <Shield className="h-5 w-5 text-green-600" />,
          renderNonFunctionalRequirements()
        )}

        {renderSection(
          '4. 制約事項',
          <AlertTriangle className="h-5 w-5 text-orange-600" />,
          renderConstraints()
        )}

        {requirementsDocument.additionalInfo && (
          renderSection(
            '5. その他',
            <Info className="h-5 w-5 text-gray-600" />,
            <div className="text-sm text-gray-600">
              <p>{requirementsDocument.additionalInfo.notes}</p>
            </div>
          )
        )}
      </div>

      {/* アクションボタン */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={resetAssistant}
        >
          新しいヒアリングを開始
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport('markdown')}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            要件定義書をダウンロード
          </Button>
        </div>
      </div>
    </div>
  );
} 