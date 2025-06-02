/**
 * サイドパネルのページタイプを定義する列挙型
 *
 * PersonDetailページは人物の詳細表示と作成/編集機能を統合して扱います
 */
export enum RightDrawerPages {
  Timeline = 'timeline',
  CreateCommentThread = 'create-comment-thread',
  EditCommentThread = 'edit-comment-thread',
  PersonDetail = 'person-detail',
}
