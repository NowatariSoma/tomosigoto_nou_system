// APIクライアントの雛形
// 必要に応じてaxiosやfetchを使って実装してください

export const auth = async (params?: unknown): Promise<{ success: boolean; message?: string }> => {
  // 仮実装: 必要に応じてAPIリクエスト処理を追加
  return { success: true, message: 'ダミー認証成功' };
}; 