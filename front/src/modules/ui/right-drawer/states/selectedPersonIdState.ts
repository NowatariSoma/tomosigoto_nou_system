/**
 * 選択された人物IDを保持するRecoilステート
 * 人物詳細表示時に使用します
 */
import { atom } from 'recoil';

export const selectedPersonIdState = atom<string | null>({
  key: 'ui/right-drawer/selected-person-id',
  default: null,
});
