/**
 * GitHub Pages デモ (PAGES_EXPORT=1) 専用の架空データ。
 *
 * scripts/build-pages.mjs が export ビルドの間だけ lib/demo/ へコピーし、
 * ビルド後に必ず削除する。通常のビルド／開発サーバー／Docker 運用には存在しない。
 *
 * ここに載っている人名・メールアドレス・会場・演目はすべて架空のデモ用データ。
 * メールアドレスは RFC 2606 の予約ドメイン example.com のみを使う。
 */

// ---------------------------------------------------------------------------
// 日付ヘルパー
//
// 稽古予定は 2026-08 〜 2026-10 を基準に作る。
// ただしデモを何年先に開いてもカレンダーが空にならないよう、
// 閲覧時点が基準期間の外なら期間ごと月単位でスライドさせる。
// ---------------------------------------------------------------------------

const BASE_YEAR = 2026;
const BASE_MONTH = 8; // 8月始まり（8〜10月の3か月ぶん）
const SEASON_LENGTH = 3;

function monthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

/** 基準期間からのズレ（月数）。閲覧時点が期間内なら 0。 */
export const MONTH_SHIFT: number = (() => {
  const now = new Date();
  const current = monthIndex(now.getFullYear(), now.getMonth() + 1);
  const base = monthIndex(BASE_YEAR, BASE_MONTH);
  if (current >= base && current < base + SEASON_LENGTH) return 0;
  return current - base;
})();

/** 基準日 (YYYY, M, D) を MONTH_SHIFT ぶんずらした YYYY-MM-DD を返す */
export function d(year: number, month: number, day: number): string {
  const shifted = new Date(Date.UTC(year, month - 1 + MONTH_SHIFT, day));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** ISO 8601 のタイムスタンプ（デモ内では見た目用にしか使わない） */
export function ts(date: string, time = '09:00:00'): string {
  return `${date}T${time}.000Z`;
}

// ---------------------------------------------------------------------------
// 部員（15名）
// ---------------------------------------------------------------------------

export type DemoRole = 'admin' | 'basic' | 'viewer';

export interface DemoMember {
  id: string;
  studentId: string;
  lastKanji: string;
  firstKanji: string;
  lastKana: string;
  firstKana: string;
  grade: number;
  departmentCode: string;
  email: string;
  role: DemoRole;
  isInstructor: boolean;
}

const uid = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

export const MEMBERS: DemoMember[] = [
  { id: uid(1), studentId: 'ST2401', lastKanji: '田中', firstKanji: '太郎', lastKana: 'タナカ', firstKana: 'タロウ', grade: 3, departmentCode: 'LIT', email: 'tanaka.taro@example.com', role: 'admin', isInstructor: true },
  { id: uid(2), studentId: 'ST2502', lastKanji: '佐藤', firstKanji: '花子', lastKana: 'サトウ', firstKana: 'ハナコ', grade: 2, departmentCode: 'LAW', email: 'sato.hanako@example.com', role: 'basic', isInstructor: false },
  { id: uid(3), studentId: 'ST2303', lastKanji: '鈴木', firstKanji: '次郎', lastKana: 'スズキ', firstKana: 'ジロウ', grade: 4, departmentCode: 'ECO', email: 'suzuki.jiro@example.com', role: 'basic', isInstructor: true },
  { id: uid(4), studentId: 'ST2604', lastKanji: '高橋', firstKanji: '美咲', lastKana: 'タカハシ', firstKana: 'ミサキ', grade: 1, departmentCode: 'LIT', email: 'takahashi.misaki@example.com', role: 'basic', isInstructor: false },
  { id: uid(5), studentId: 'ST2405', lastKanji: '伊藤', firstKanji: '健太', lastKana: 'イトウ', firstKana: 'ケンタ', grade: 3, departmentCode: 'ENG', email: 'ito.kenta@example.com', role: 'basic', isInstructor: false },
  { id: uid(6), studentId: 'ST2506', lastKanji: '渡辺', firstKanji: '愛', lastKana: 'ワタナベ', firstKana: 'アイ', grade: 2, departmentCode: 'SPS', email: 'watanabe.ai@example.com', role: 'basic', isInstructor: false },
  { id: uid(7), studentId: 'ST2307', lastKanji: '山本', firstKanji: '大輔', lastKana: 'ヤマモト', firstKana: 'ダイスケ', grade: 4, departmentCode: 'COM', email: 'yamamoto.daisuke@example.com', role: 'basic', isInstructor: true },
  { id: uid(8), studentId: 'ST2608', lastKanji: '中村', firstKanji: '由美', lastKana: 'ナカムラ', firstKana: 'ユミ', grade: 1, departmentCode: 'PSY', email: 'nakamura.yumi@example.com', role: 'basic', isInstructor: false },
  { id: uid(9), studentId: 'ST2409', lastKanji: '小林', firstKanji: '和也', lastKana: 'コバヤシ', firstKana: 'カズヤ', grade: 3, departmentCode: 'POL', email: 'kobayashi.kazuya@example.com', role: 'basic', isInstructor: false },
  { id: uid(10), studentId: 'ST2510', lastKanji: '加藤', firstKanji: '麻衣', lastKana: 'カトウ', firstKana: 'マイ', grade: 2, departmentCode: 'CUL', email: 'kato.mai@example.com', role: 'basic', isInstructor: false },
  { id: uid(11), studentId: 'ST2611', lastKanji: '吉田', firstKanji: '翔太', lastKana: 'ヨシダ', firstKana: 'ショウタ', grade: 1, departmentCode: 'ENG', email: 'yoshida.shota@example.com', role: 'viewer', isInstructor: false },
  { id: uid(12), studentId: 'ST2512', lastKanji: '森', firstKanji: '優香', lastKana: 'モリ', firstKana: 'ユウカ', grade: 2, departmentCode: 'LIT', email: 'mori.yuka@example.com', role: 'basic', isInstructor: false },
  { id: uid(13), studentId: 'ST2413', lastKanji: '清水', firstKanji: '拓也', lastKana: 'シミズ', firstKana: 'タクヤ', grade: 3, departmentCode: 'LHS', email: 'shimizu.takuya@example.com', role: 'basic', isInstructor: true },
  { id: uid(14), studentId: 'ST2314', lastKanji: '岡田', firstKanji: '恵', lastKana: 'オカダ', firstKana: 'メグミ', grade: 4, departmentCode: 'GRM', email: 'okada.megumi@example.com', role: 'admin', isInstructor: true },
  { id: uid(15), studentId: 'ST2615', lastKanji: '池田', firstKanji: '雅人', lastKana: 'イケダ', firstKana: 'マサト', grade: 1, departmentCode: 'SHS', email: 'ikeda.masato@example.com', role: 'viewer', isInstructor: false },
];

/** デモでログイン済みになるユーザー（管理者かつ指導者） */
export const DEMO_USER = MEMBERS[0];

export const fullNameKanji = (m: DemoMember) => `${m.lastKanji} ${m.firstKanji}`;
export const fullNameKana = (m: DemoMember) => `${m.lastKana} ${m.firstKana}`;

// ---------------------------------------------------------------------------
// 学部（同志社大学の学部構成を模した架空マスタ）
// ---------------------------------------------------------------------------

export interface DemoDepartment {
  id: string;
  department_code: string;
  department_name: string;
  campus: string;
  is_active: boolean;
}

export const DEPARTMENTS: DemoDepartment[] = [
  { id: 'dep-law', department_code: 'LAW', department_name: '法学部', campus: '今出川', is_active: true },
  { id: 'dep-eco', department_code: 'ECO', department_name: '経済学部', campus: '今出川', is_active: true },
  { id: 'dep-com', department_code: 'COM', department_name: '商学部', campus: '今出川', is_active: true },
  { id: 'dep-lit', department_code: 'LIT', department_name: '文学部', campus: '今出川', is_active: true },
  { id: 'dep-sps', department_code: 'SPS', department_name: '社会学部', campus: '今出川', is_active: true },
  { id: 'dep-pol', department_code: 'POL', department_name: '政策学部', campus: '今出川', is_active: true },
  { id: 'dep-cul', department_code: 'CUL', department_name: '文化情報学部', campus: '今出川', is_active: true },
  { id: 'dep-psy', department_code: 'PSY', department_name: '心理学部', campus: '今出川', is_active: true },
  { id: 'dep-grm', department_code: 'GRM', department_name: 'グローバル地域文化学部', campus: '今出川', is_active: true },
  { id: 'dep-eng', department_code: 'ENG', department_name: '理工学部', campus: '京田辺', is_active: true },
  { id: 'dep-lhs', department_code: 'LHS', department_name: '生命医科学部', campus: '京田辺', is_active: true },
  { id: 'dep-shs', department_code: 'SHS', department_name: 'スポーツ健康科学部', campus: '京田辺', is_active: true },
];

export const departmentByCode = (code: string) =>
  DEPARTMENTS.find((dep) => dep.department_code === code) || DEPARTMENTS[3];

// ---------------------------------------------------------------------------
// 稽古場（会場）
// ---------------------------------------------------------------------------

export interface DemoVenue {
  id: string;
  name: string;
  code: string;
  campus: string;
  address: string;
  latitude: number;
  longitude: number;
  can_mai: boolean;
  capacity: number;
  desk: number;
  chair: number;
  description: string;
  is_active: boolean;
  color: string;
}

export const VENUES: DemoVenue[] = [
  {
    id: 'venue-0001', name: '良心館 RY-208', code: 'IM-RY208', campus: '今出川',
    address: '京都市上京区今出川通烏丸東入', latitude: 35.0312, longitude: 135.7681,
    can_mai: true, capacity: 40, desk: 0, chair: 40,
    description: '板張りで舞の稽古が可能。もっとも使用頻度が高い部屋', is_active: true, color: '#3b82f6',
  },
  {
    id: 'venue-0002', name: '至誠館 SS-105', code: 'IM-SS105', campus: '今出川',
    address: '京都市上京区今出川通烏丸東入', latitude: 35.0315, longitude: 135.7685,
    can_mai: false, capacity: 24, desk: 12, chair: 24,
    description: '謡と申合せ用の小教室。机があるため舞の稽古は不可', is_active: true, color: '#10b981',
  },
  {
    id: 'venue-0003', name: '寒梅館 地下練習室', code: 'IM-KB1', campus: '今出川',
    address: '京都市上京区烏丸通上立売下ル', latitude: 35.0303, longitude: 135.7592,
    can_mai: true, capacity: 30, desk: 0, chair: 10,
    description: '鏡張りの多目的室。囃子の音出しが可能', is_active: true, color: '#f59e0b',
  },
  {
    id: 'venue-0004', name: '知徳館 TC-32', code: 'TB-TC32', campus: '京田辺',
    address: '京田辺市多々羅都谷1-3', latitude: 34.8158, longitude: 135.7666,
    can_mai: true, capacity: 36, desk: 0, chair: 36,
    description: '京田辺の主力練習室。1年生の稽古はここが中心', is_active: true, color: '#8b5cf6',
  },
  {
    id: 'venue-0005', name: '恵道館 KD-102', code: 'TB-KD102', campus: '京田辺',
    address: '京田辺市多々羅都谷1-3', latitude: 34.8161, longitude: 135.7669,
    can_mai: false, capacity: 18, desk: 9, chair: 18,
    description: '少人数の謡稽古・ミーティング用', is_active: true, color: '#ec4899',
  },
];

export const venueById = (id: string) => VENUES.find((v) => v.id === id);

// ---------------------------------------------------------------------------
// 舞台（公演）とパート（配役）
// ---------------------------------------------------------------------------

export interface DemoPart {
  id: string;
  stage_id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  color: string;
}

export interface DemoStage {
  id: string;
  name: string;
  description: string;
  performance_date: string;
  status: 'active' | 'inactive';
}

const PART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#db2777', '#0891b2'];

export const STAGES: DemoStage[] = [
  {
    id: 'stage-0001',
    name: '夏合宿発表会「土蜘蛛」',
    description: '夏合宿の締めくくりに行う発表会。土蜘蛛の糸の扱いが見どころ。',
    performance_date: d(2026, 8, 30),
    status: 'active',
  },
  {
    id: 'stage-0002',
    name: '同観能「高砂」',
    description: '他大学の能楽部と合同で開く公演。祝言の能「高砂」を勤める。',
    performance_date: d(2026, 9, 13),
    status: 'active',
  },
  {
    id: 'stage-0003',
    name: '翡翠の会「敦盛」',
    description: '上級生を中心とした自主公演。修羅能「敦盛」を通しで演じる。',
    performance_date: d(2026, 10, 18),
    status: 'active',
  },
  {
    id: 'stage-0004',
    name: 'EVE能「羽衣」',
    description: '学園祭 EVE 期間の公演。新入部員も地謡で参加する。',
    performance_date: d(2026, 11, 27),
    status: 'active',
  },
  {
    id: 'stage-0005',
    name: '卒業公演「道成寺」',
    description: '4回生の引退公演。演目は能の大曲「道成寺」（計画中）。',
    performance_date: d(2027, 2, 14),
    status: 'inactive',
  },
];

const partSeeds: { stageId: string; names: [string, string][] }[] = [
  {
    stageId: 'stage-0001',
    names: [
      ['前シテ（僧）', '前半、僧の姿で頼光の館を訪れる'],
      ['後シテ（土蜘蛛の精）', '後半、蜘蛛の精の本性を現す'],
      ['ワキ（源頼光）', '病に伏す源頼光を勤める'],
      ['ツレ（胡蝶）', '頼光に薬を届ける侍女'],
      ['地謡', '謡を担当する地謡方'],
      ['囃子方', '笛・小鼓・大鼓・太鼓'],
    ],
  },
  {
    stageId: 'stage-0002',
    names: [
      ['前シテ（尉）', '高砂の松の精。老翁の姿で登場'],
      ['前ツレ（姥）', '前シテの連れ。老女を勤める'],
      ['後シテ（住吉明神）', '後半、住吉明神として颯爽と舞う'],
      ['ワキ（友成）', '阿蘇の神主友成'],
      ['地謡', '謡を担当する地謡方'],
      ['囃子方', '笛・小鼓・大鼓'],
    ],
  },
  {
    stageId: 'stage-0003',
    names: [
      ['前シテ（草刈男）', '前半、草刈男に身をやつした敦盛'],
      ['後シテ（平敦盛）', '後半、修羅道の敦盛として現れる'],
      ['ワキ（蓮生法師）', 'かつての熊谷次郎直実'],
      ['地謡', '謡を担当する地謡方'],
      ['囃子方', '笛・小鼓・大鼓'],
    ],
  },
  {
    stageId: 'stage-0004',
    names: [
      ['シテ（天女）', '三保の松原に降り立つ天女'],
      ['ワキ（漁師白龍）', '羽衣を拾う漁師'],
      ['地謡', '謡を担当する地謡方'],
      ['囃子方', '笛・小鼓・大鼓'],
    ],
  },
  {
    stageId: 'stage-0005',
    names: [
      ['前シテ（白拍子）', '前半、白拍子として乱拍子を踏む'],
      ['後シテ（蛇体）', '鐘の中から蛇体となって現れる'],
      ['ワキ（住職）', '道成寺の住職'],
      ['地謡', '謡を担当する地謡方'],
      ['囃子方', '笛・小鼓・大鼓・太鼓'],
    ],
  },
];

export const PARTS: DemoPart[] = partSeeds.flatMap((seed, stageIdx) =>
  seed.names.map(([name, description], idx) => ({
    id: `part-${String(stageIdx + 1).padStart(2, '0')}${String(idx + 1).padStart(2, '0')}`,
    stage_id: seed.stageId,
    name,
    description,
    status: (seed.stageId === 'stage-0005' ? 'inactive' : 'active') as 'active' | 'inactive',
    color: PART_COLORS[idx % PART_COLORS.length],
  }))
);

export const partsOfStage = (stageId: string) => PARTS.filter((p) => p.stage_id === stageId);
export const partById = (id: string) => PARTS.find((p) => p.id === id);
export const stageById = (id: string) => STAGES.find((s) => s.id === id);

// ---------------------------------------------------------------------------
// 配役（member_assignments）
// ---------------------------------------------------------------------------

export interface DemoMemberAssignment {
  id: string;
  user_id: string;
  part_id: string;
  category: 'utai' | 'mai';
  display_order: number;
  created_at: string;
  updated_at: string;
}

/** パートごとに何人を割り当てるか（地謡・囃子方は複数名） */
function assigneeCountFor(partName: string): number {
  if (partName.startsWith('地謡')) return 5;
  if (partName.startsWith('囃子方')) return 4;
  return 1;
}

/** 舞のパートか謡のパートか */
function categoryFor(partName: string): 'utai' | 'mai' {
  if (partName.startsWith('地謡')) return 'utai';
  if (partName.startsWith('囃子方')) return 'utai';
  if (partName.includes('ワキ')) return 'utai';
  return 'mai';
}

export const MEMBER_ASSIGNMENTS: DemoMemberAssignment[] = (() => {
  const out: DemoMemberAssignment[] = [];
  let cursor = 0;
  let seq = 1;
  for (const part of PARTS) {
    if (part.status !== 'active') continue;
    const count = assigneeCountFor(part.name);
    for (let i = 0; i < count; i += 1) {
      const member = MEMBERS[cursor % MEMBERS.length];
      cursor += 1;
      out.push({
        id: `massign-${String(seq).padStart(4, '0')}`,
        user_id: member.id,
        part_id: part.id,
        category: categoryFor(part.name),
        display_order: i + 1,
        created_at: ts(d(2026, 7, 1)),
        updated_at: ts(d(2026, 7, 1)),
      });
      seq += 1;
    }
  }
  return out;
})();

// ---------------------------------------------------------------------------
// 稽古予定（2026-08 〜 2026-10 に 20 件）
// ---------------------------------------------------------------------------

export interface DemoSchedule {
  id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  division_count: number;
  title: string;
  description: string;
  schedule_type: string;
  status: string;
  stage_id: string;
  venue_ids: string[];
}

interface ScheduleSeed {
  date: [number, number, number];
  start: string;
  end: string;
  divisions: number;
  stage: string;
  type: string;
  title: string;
  description: string;
  venues: string[];
}

const scheduleSeeds: ScheduleSeed[] = [
  { date: [2026, 8, 5], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0001', type: 'regular_practice', title: '土蜘蛛 第1回稽古', description: '土蜘蛛の型付けを確認します。1回生は地謡から入ってください。', venues: ['venue-0001', 'venue-0002'] },
  { date: [2026, 8, 8], start: '13:00', end: '17:00', divisions: 4, stage: 'stage-0001', type: 'regular_practice', title: '土蜘蛛 第2回稽古', description: 'シテの糸の扱いを重点的に。囃子方は寒梅館で音出しを行います。', venues: ['venue-0001', 'venue-0003'] },
  { date: [2026, 8, 12], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0001', type: 'regular_practice', title: '土蜘蛛 第3回稽古', description: 'ワキ・ツレの立ち位置合わせ。地謡は詞章の暗記確認を行います。', venues: ['venue-0004', 'venue-0005'] },
  { date: [2026, 8, 19], start: '10:00', end: '17:00', divisions: 6, stage: 'stage-0001', type: 'camp', title: '夏合宿 1日目', description: '合宿初日。午前は基礎稽古、午後は土蜘蛛の場割り稽古を行います。', venues: ['venue-0001', 'venue-0002', 'venue-0003'] },
  { date: [2026, 8, 20], start: '10:00', end: '17:00', divisions: 6, stage: 'stage-0001', type: 'camp', title: '夏合宿 2日目', description: '合宿2日目。通し稽古を2回、間に囃子合わせを挟みます。', venues: ['venue-0001', 'venue-0003', 'venue-0004'] },
  { date: [2026, 8, 26], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0001', type: 'dress_rehearsal', title: '土蜘蛛 申合せ', description: '装束を着けての申合せ。本番と同じ順序で通します。', venues: ['venue-0001', 'venue-0003'] },
  { date: [2026, 8, 29], start: '13:00', end: '18:00', divisions: 5, stage: 'stage-0001', type: 'final_rehearsal', title: '土蜘蛛 前日リハーサル', description: '本番前日の最終確認。舞台の寸法に合わせて位置取りを調整します。', venues: ['venue-0001', 'venue-0002', 'venue-0003'] },
  { date: [2026, 9, 2], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0002', type: 'regular_practice', title: '高砂 第1回稽古', description: '同観能に向けた稽古開始。まずは謡の下合わせから。', venues: ['venue-0001', 'venue-0002'] },
  { date: [2026, 9, 5], start: '13:00', end: '17:00', divisions: 4, stage: 'stage-0002', type: 'regular_practice', title: '高砂 第2回稽古', description: '前場の型稽古。ツレの位置取りを重点的に確認します。', venues: ['venue-0001', 'venue-0003'] },
  { date: [2026, 9, 9], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0002', type: 'regular_practice', title: '高砂 第3回稽古', description: '後場の神舞を中心に。囃子方との合わせも行います。', venues: ['venue-0003', 'venue-0004'] },
  { date: [2026, 9, 12], start: '10:00', end: '16:00', divisions: 6, stage: 'stage-0002', type: 'dress_rehearsal', title: '高砂 申合せ', description: '合同公演前の申合せ。他大学との段取り確認を含みます。', venues: ['venue-0001', 'venue-0002', 'venue-0003'] },
  { date: [2026, 9, 16], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0003', type: 'regular_practice', title: '敦盛 第1回稽古', description: '翡翠の会に向けた稽古開始。修羅能の運びを確認します。', venues: ['venue-0001', 'venue-0002'] },
  { date: [2026, 9, 23], start: '13:00', end: '17:00', divisions: 4, stage: 'stage-0003', type: 'regular_practice', title: '敦盛 第2回稽古', description: '前シテの草刈男の出を稽古。地謡は上歌の当たりを揃えます。', venues: ['venue-0004', 'venue-0005'] },
  { date: [2026, 9, 26], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0003', type: 'regular_practice', title: '敦盛 第3回稽古', description: 'クセの型稽古。1回生は見学と地謡の稽古に入ります。', venues: ['venue-0001', 'venue-0003'] },
  { date: [2026, 10, 3], start: '13:00', end: '18:00', divisions: 5, stage: 'stage-0003', type: 'regular_practice', title: '敦盛 第4回稽古', description: '後場の中之舞を通します。囃子方は打ち合わせを先に行ってください。', venues: ['venue-0001', 'venue-0002', 'venue-0003'] },
  { date: [2026, 10, 7], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0003', type: 'regular_practice', title: '敦盛 第5回稽古', description: '通し稽古1回目。時間配分の確認を兼ねます。', venues: ['venue-0001', 'venue-0003'] },
  { date: [2026, 10, 10], start: '10:00', end: '16:00', divisions: 6, stage: 'stage-0003', type: 'dress_rehearsal', title: '敦盛 申合せ', description: '装束付きの申合せ。撮影担当は資料庫用に記録をお願いします。', venues: ['venue-0001', 'venue-0002', 'venue-0003'] },
  { date: [2026, 10, 14], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0003', type: 'final_rehearsal', title: '敦盛 最終稽古', description: '本番前の最終稽古。各自の課題箇所のみ抜き稽古します。', venues: ['venue-0001', 'venue-0003'] },
  { date: [2026, 10, 17], start: '13:00', end: '18:00', divisions: 5, stage: 'stage-0003', type: 'final_rehearsal', title: '敦盛 前日リハーサル', description: '前日リハーサル。搬入・装束の確認を行います。', venues: ['venue-0001', 'venue-0002', 'venue-0003'] },
  { date: [2026, 10, 21], start: '18:00', end: '21:00', divisions: 4, stage: 'stage-0004', type: 'regular_practice', title: '羽衣 第1回稽古', description: 'EVE能に向けた初稽古。新入部員向けの基礎稽古も並行します。', venues: ['venue-0001', 'venue-0002'] },
];

export const SCHEDULES: DemoSchedule[] = scheduleSeeds.map((seed, idx) => ({
  id: `sched-${String(idx + 1).padStart(4, '0')}`,
  schedule_date: d(seed.date[0], seed.date[1], seed.date[2]),
  start_time: seed.start,
  end_time: seed.end,
  division_count: seed.divisions,
  title: seed.title,
  description: seed.description,
  schedule_type: seed.type,
  status: 'active',
  stage_id: seed.stage,
  venue_ids: seed.venues,
}));

export const scheduleByDate = (date: string) => SCHEDULES.find((s) => s.schedule_date === date);
export const scheduleById = (id: string) => SCHEDULES.find((s) => s.id === id);

// ---------------------------------------------------------------------------
// schedule_available_venues（スケジュールごとの利用可能会場）
// ---------------------------------------------------------------------------

export interface DemoAvailableVenue {
  id: string;
  schedule_id: string;
  venue_id: string;
  is_preferred: boolean;
  priority: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export const AVAILABLE_VENUES: DemoAvailableVenue[] = SCHEDULES.flatMap((schedule, sIdx) =>
  schedule.venue_ids.map((venueId, vIdx) => ({
    id: `savenue-${String(sIdx + 1).padStart(4, '0')}-${vIdx + 1}`,
    schedule_id: schedule.id,
    venue_id: venueId,
    is_preferred: vIdx === 0,
    priority: vIdx + 1,
    notes: vIdx === 0 ? '主会場' : `代替会場${vIdx}`,
    created_at: ts(schedule.schedule_date),
    updated_at: ts(schedule.schedule_date),
  }))
);

export const availableVenuesOf = (scheduleId: string) =>
  AVAILABLE_VENUES.filter((av) => av.schedule_id === scheduleId);

// ---------------------------------------------------------------------------
// 時間スロット
// ---------------------------------------------------------------------------

export interface DemoTimeSlot {
  id: string;
  schedule_id: string;
  slot_order: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function slotsOf(schedule: DemoSchedule): DemoTimeSlot[] {
  const start = toMinutes(schedule.start_time);
  const end = toMinutes(schedule.end_time);
  const span = (end - start) / schedule.division_count;
  return Array.from({ length: schedule.division_count }, (_, i) => ({
    id: `slot-${schedule.id}-${i + 1}`,
    schedule_id: schedule.id,
    slot_order: i + 1,
    start_time: toHHMM(Math.round(start + i * span)),
    end_time: toHHMM(Math.round(start + (i + 1) * span)),
    created_at: ts(schedule.schedule_date),
    updated_at: ts(schedule.schedule_date),
  }));
}

// ---------------------------------------------------------------------------
// 出欠
// ---------------------------------------------------------------------------

export type DemoAttendanceStatus = 'present' | 'absent' | 'late' | 'no_show';

export interface DemoAttendance {
  id: string;
  practice_schedule_id: string;
  user_id: string;
  status: DemoAttendanceStatus;
  notes: string;
  available_from: string | null;
  available_to: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  user_name: string;
  user_email: string;
  user_year: number;
}

/** 決定的な擬似乱数（同じ入力なら常に同じ出欠になる） */
function pseudoRandom(a: number, b: number): number {
  const x = Math.sin(a * 37.13 + b * 11.7) * 10000;
  return x - Math.floor(x);
}

const NOTES_BY_STATUS: Record<DemoAttendanceStatus, string[]> = {
  present: ['', '', '', '通し稽古までには入れます'],
  late: [
    '実験が長引くため30分ほど遅れます',
    '教職課程の講義のため後半から合流します',
    '前の授業が延びるため少し遅れます',
    'バイトのシフトが入っており途中から参加します',
  ],
  absent: [
    'ゼミの発表と重なるため欠席します',
    '体調不良のため大事をとって休みます',
    '帰省と重なるため欠席します',
    '他サークルの本番と重なっています',
  ],
  no_show: ['', '連絡なし', ''],
};

export const ATTENDANCES: DemoAttendance[] = SCHEDULES.flatMap((schedule, sIdx) =>
  MEMBERS.map((member, mIdx) => {
    const r = pseudoRandom(sIdx + 1, mIdx + 1);
    let status: DemoAttendanceStatus = 'present';
    if (r > 0.94) status = 'no_show';
    else if (r > 0.86) status = 'absent';
    else if (r > 0.76) status = 'late';

    const candidates = NOTES_BY_STATUS[status];
    const notes = candidates[(sIdx + mIdx) % candidates.length];

    return {
      id: `att-${String(sIdx + 1).padStart(4, '0')}-${String(mIdx + 1).padStart(2, '0')}`,
      practice_schedule_id: schedule.id,
      user_id: member.id,
      status,
      notes,
      available_from:
        status === 'absent' || status === 'no_show'
          ? null
          : status === 'late'
            ? toHHMM(toMinutes(schedule.start_time) + 60)
            : schedule.start_time,
      available_to: status === 'absent' || status === 'no_show' ? null : schedule.end_time,
      created_at: ts(schedule.schedule_date),
      updated_at: ts(schedule.schedule_date),
      created_by: member.id,
      updated_by: member.id,
      user_name: fullNameKanji(member),
      user_email: member.email,
      user_year: member.grade,
    };
  })
);

// ---------------------------------------------------------------------------
// セッション（コマ×会場×パート）と指導者割当
// ---------------------------------------------------------------------------

export interface DemoSession {
  id: string;
  schedule_id: string;
  part_id: string;
  part_name: string;
  slot_order: number;
  venue_id: string;
  schedule_available_venue_id: string;
  priority: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DemoSessionInstructor {
  id: string;
  attendance_id: string;
  schedule_id: string;
  schedule_available_venue_id: string;
  slot_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

function sessionTitleFor(partName: string): string {
  if (partName.startsWith('地謡')) return '地謡合わせ';
  if (partName.startsWith('囃子方')) return '囃子稽古';
  if (partName.includes('シテ')) return `${partName} 個人稽古`;
  return `${partName} 稽古`;
}

const instructorMembers = MEMBERS.filter((m) => m.isInstructor);

export const SESSIONS: DemoSession[] = [];
export const SESSION_INSTRUCTORS: DemoSessionInstructor[] = [];

SCHEDULES.forEach((schedule, sIdx) => {
  const stageParts = partsOfStage(schedule.stage_id);
  const venues = availableVenuesOf(schedule.id);
  const slots = slotsOf(schedule);

  slots.forEach((slot) => {
    venues.forEach((av, vIdx) => {
      // 全コマ全会場を埋めると窮屈なので、一部を空きコマとして残す
      const r = pseudoRandom(sIdx * 10 + slot.slot_order, vIdx + 3);
      if (r > 0.82) return;

      const part = stageParts[(slot.slot_order + vIdx) % stageParts.length];
      const venue = venueById(av.venue_id);
      // 舞のパートは舞可の部屋のみ
      if (!venue?.can_mai && !part.name.startsWith('地謡') && !part.name.startsWith('囃子方')) {
        return;
      }

      const sessionId = `session-${schedule.id}-${slot.slot_order}-${vIdx + 1}`;
      SESSIONS.push({
        id: sessionId,
        schedule_id: schedule.id,
        part_id: part.id,
        part_name: part.name,
        slot_order: slot.slot_order,
        venue_id: av.venue_id,
        schedule_available_venue_id: av.id,
        priority: vIdx,
        title: sessionTitleFor(part.name),
        created_at: ts(schedule.schedule_date),
        updated_at: ts(schedule.schedule_date),
      });

      const instructor =
        instructorMembers[(sIdx + slot.slot_order + vIdx) % instructorMembers.length];
      const attendance = ATTENDANCES.find(
        (a) => a.practice_schedule_id === schedule.id && a.user_id === instructor.id
      );
      if (attendance) {
        SESSION_INSTRUCTORS.push({
          id: `sinst-${sessionId}`,
          attendance_id: attendance.id,
          schedule_id: schedule.id,
          schedule_available_venue_id: av.id,
          slot_order: slot.slot_order,
          user_id: instructor.id,
          created_at: ts(schedule.schedule_date),
          updated_at: ts(schedule.schedule_date),
        });
      }
    });
  });
});

export const memberById = (id: string) => MEMBERS.find((m) => m.id === id);
