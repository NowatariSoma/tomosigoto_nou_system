"""
能の練習表作成システム 環境クラス
場面ベースの練習スケジュール作成環境
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
import json
import random
import math
from typing import Dict, Any, Optional, Tuple, List
import os
from src.rewards.scene_based_reward import SceneBasedReward


class PracticeScheduleEnv(gym.Env):
    """
    能の練習スケジュール作成のための環境クラス
    場面ベースのシステムで、パートではなく場面を割り当てる
    """
    
    def __init__(self, 
                 environment_config: Optional[Dict[str, Any]] = None,
                 observation_sizes: Optional[Dict[str, int]] = None,
                 environment_generator: str = "random",
                 dataset_path: Optional[str] = None,
                 seed: Optional[int] = None,
                 reward_config: Optional[Dict[str, Any]] = None):
        """
        Args:
            environment_config: 環境設定（オプション）
            observation_sizes: 観測空間サイズ（オプション）
            environment_generator: 環境生成方式 ("random" or "file")
            dataset_path: データセットファイルパス（file方式の場合）
            seed: 乱数シード
            reward_config: 報酬関数設定
        """
        super().__init__()
        
        # 設定の読み込み
        self.env_config = environment_config or {}
        self.observation_sizes = observation_sizes or {}
        self.environment_generator = environment_generator
        self.dataset_path = dataset_path
        self.reward_config = reward_config or {}
        
        # シードを設定
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)
        
        # 固定最大次元の設定（行動・観測空間の固定サイズ）
        self.max_scenes = self.env_config.get('max_scenes', 20)
        self.max_rooms = self.env_config.get('max_rooms', 10) 
        self.max_timeslots = self.env_config.get('max_timeslots', 4)
        self.max_people = self.env_config.get('max_people', 60)
        
        # 動的範囲の設定
        dynamic_ranges = self.env_config.get('dynamic_ranges', {})
        self.scene_range = dynamic_ranges.get('scenes', {'min': 15, 'max': 20})
        self.room_range = dynamic_ranges.get('rooms', {'min': 5, 'max': 10})
        self.people_range = dynamic_ranges.get('people', {'min': 50, 'max': 60})
        
        # 場面・部屋テンプレートの読み込み
        self.scene_templates = self.env_config.get('scene_templates', [])
        self.room_templates = self.env_config.get('room_templates', [])
        
        # 最適化: テンプレートが空の場合のフォールバック処理
        if not self.scene_templates:
            print("[WARNING] scene_templatesが空です。デフォルトテンプレートを使用します。")
            self.scene_templates = [
                {'name': f'Scene{i}', 'category': 'default', 'priority': 3}
                for i in range(20)
            ]
        
        if not self.room_templates:
            print("[WARNING] room_templatesが空です。デフォルトテンプレートを使用します。")
            self.room_templates = [
                {'name': f'Room{i}', 'capacity': 20, 'priority': 3}
                for i in range(10)
            ]
        
        # 人物参加設定の読み込み
        people_participation = self.env_config.get('people_participation', {})
        self.scenes_per_person = people_participation.get('scenes_per_person', 3)
        self.priority_range = people_participation.get('priority_range', {'min': 0.0, 'max': 1.0})
        self.priority_discrete = people_participation.get('priority_discrete', False)
        # 監督者: 人単位の割合指定
        self.supervisor_ratio = float(people_participation.get('supervisor_ratio', 0.1))
        self.is_supervisor = np.zeros(self.max_people, dtype=np.int32)
        
        # 最大ステップ数の設定
        self.max_steps = self.env_config.get('max_steps', 100)
        
        # 観測空間とアクション空間を最大次元で固定（マスクで制限）
        self.observation_space = self._create_enhanced_observation_space()
        self.action_space = spaces.Discrete(self.max_timeslots * self.max_scenes * self.max_rooms)
        self.action_mapping_shape = (self.max_timeslots, self.max_scenes, self.max_rooms)
        
        # 環境の初期化
        self.reset()
        
        # 報酬関数の初期化
        self._init_reward_function()
    
    def _generate_dynamic_environment(self):
        """動的環境の生成（エピソードごとにランダム）"""
        # 場面数をランダム生成
        self.num_scenes = random.randint(
            self.scene_range['min'], 
            self.scene_range['max']
        )
        
        # 部屋数をランダム生成
        self.num_rooms = random.randint(
            self.room_range['min'], 
            self.room_range['max']
        )
        
        # 時間帯数を自動計算（場面数÷部屋数の切り上げ）
        self.num_timeslots = math.ceil(self.num_scenes / self.num_rooms)
        
        # 場面をランダム選択（複製なし）
        if len(self.scene_templates) >= self.num_scenes:
            selected_scenes = random.sample(self.scene_templates, self.num_scenes)
        else:
            # テンプレートが不足している場合は繰り返し使用
            selected_scenes = (self.scene_templates * 
                             math.ceil(self.num_scenes / len(self.scene_templates)))[:self.num_scenes]
        
        self.scenes = selected_scenes
        
        # 部屋をランダム選択
        if len(self.room_templates) >= self.num_rooms:
            selected_rooms = random.sample(self.room_templates, self.num_rooms)
        else:
            # テンプレートが不足している場合は繰り返し使用
            selected_rooms = (self.room_templates * 
                            math.ceil(self.num_rooms / len(self.room_templates)))[:self.num_rooms]
        
        self.rooms = selected_rooms
        
        # 人数をランダム生成
        self.num_people = random.randint(
            self.people_range['min'],
            self.people_range['max']
        )
        
        # 人物の場面参加情報を生成
        self._generate_people_participation()
        
        # print(f"動的環境生成: 場面={self.num_scenes}, 部屋={self.num_rooms}, 時間帯={self.num_timeslots}, 人数={self.num_people}")  # 学習中の不要なログを削除
    
    def _generate_people_participation(self):
        """人物の場面参加情報を生成"""
        # 最大次元で配列を初期化
        self.people_scene_participation = np.zeros((self.max_people, self.max_scenes), dtype=np.int32)
        # 最適化: people_scene_prioritiesを削除（1,200次元削減）
        # self.people_scene_priorities = np.zeros((self.max_people, self.max_scenes), dtype=np.float32)
        # 監督者フラグ初期化
        self.is_supervisor[:] = 0
        
        # 実際の人数・場面数の範囲で参加情報を生成
        for person_idx in range(self.num_people):
            # 各人物が参加する場面をランダム選択（重複なし）
            if self.num_scenes >= self.scenes_per_person:
                participating_scenes = random.sample(
                    range(self.num_scenes), 
                    self.scenes_per_person
                )
            else:
                # 場面数が参加数より少ない場合は全場面に参加
                participating_scenes = list(range(self.num_scenes))
            
            # 参加場面と優先度を設定
            for scene_idx in participating_scenes:
                self.people_scene_participation[person_idx, scene_idx] = 1
                # 最適化: 優先度は削除
                # if self.priority_discrete:
                #     # 最適化: 離散1..5からランダムに選択（軽量）
                #     priority = random.randint(1, 5)
                #     # 範囲チェック: 観測空間の範囲内か確認
                #     if priority > 1.0:  # 観測空間が0.0-1.0の場合
                #         print(f"[WARNING] 優先度範囲外: {priority} > 1.0")
                #         priority = 1.0  # 範囲内に制限
                #     self.people_scene_priorities[person_idx, scene_idx] = float(priority)
                # else:
                #     # 最適化: 連続優先度をランダム生成（軽量）
                #     priority = random.uniform(
                #         self.priority_range['min'],
                #         self.priority_range['max']
                #     )
                #     self.people_scene_priorities[person_idx, scene_idx] = priority

        # 監督者を割合で付与
        try:
            n_supervisors = int(round(self.supervisor_ratio * self.num_people))
            n_supervisors = max(0, min(self.num_people, n_supervisors))
            if n_supervisors > 0:
                sup_indices = random.sample(range(self.num_people), n_supervisors)
                for idx in sup_indices:
                    self.is_supervisor[idx] = 1
        except Exception:
            pass

        # 監督者関連の前計算と時間帯×人物プレゼンスの初期化
        self._prepare_supervisor_structures()
    
    def _create_enhanced_observation_space(self):
        """拡張された観測空間の作成（最適化版）"""
        # 最適化: 不要な観測項目を削除して軽量化
        return spaces.Dict({
            'schedule': spaces.MultiBinary((self.max_timeslots, self.max_scenes, self.max_rooms)),
            'scene_status': spaces.MultiBinary(self.max_scenes),
            # 人物情報を追加（連続優先度0.0-1.0に戻す）
            'people_scene_participation': spaces.MultiBinary((self.max_people, self.max_scenes)),
            # 最適化: people_scene_prioritiesを削除（1,200次元削減）
            # 'people_scene_priorities': spaces.Box(low=0.0, high=1.0, shape=(self.max_people, self.max_scenes), dtype=np.float32)
        })
    

    
    
    
    def _initialize_part_info(self):
        """パート情報の初期化（動的場面システム対応）"""
        # 動的に生成された場面情報を使用
        part_names = []
        part_priorities = []
        
        # 実際に選択された場面から名前と優先度を取得
        for i, scene in enumerate(self.scenes[:self.num_scenes]):
            part_names.append(scene['name'])
            part_priorities.append(scene.get('priority', 3) / 5.0)  # 0-1範囲に正規化
        
        # 最大場面数まで拡張（報酬関数の互換性のため）
        while len(part_names) < self.max_scenes:
            part_names.append(f'Scene{len(part_names)}')
            part_priorities.append(0.5)  # デフォルト優先度
        
        return {
            'part_names': part_names,
            'part_priorities': part_priorities
        }
    

    

    
    def reset(self, seed=None):
        """環境のリセット（動的環境生成）"""
        super().reset(seed=seed)
        
        # 動的環境の生成（エピソードごとにランダム）
        self._generate_dynamic_environment()
        
        # 環境状態の初期化（最適化版）
        self.schedule = np.zeros((self.max_timeslots, self.max_scenes, self.max_rooms), dtype=np.int32)
        self.scene_status = np.zeros(self.max_scenes, dtype=np.int32)
        # supervision_status はゼロで運用（互換性のため属性を保持）
        self.supervision_status = np.zeros((self.max_timeslots, self.max_scenes, self.max_rooms), dtype=np.int32)
        self.part_status = np.zeros(self.max_scenes, dtype=np.int32)  # part_statusも初期化
        
        # ステップ数の初期化
        self.step_count = 0
        
        # 報酬の累積管理
        self.episode_reward = 0.0
        self.step_rewards = []
        
        # 行動履歴の初期化
        self.action_history = []
        
        # マスクキャッシュの初期化
        self._cached_mask = None
        # フォールバック移動フェーズフラグ
        self._in_fallback_move_phase = False
        # 移動回数の制限用（sceneごとの移動実績）
        self._scene_moved_once = np.zeros(self.max_scenes, dtype=np.int8)
        
        # 最適化: 割り当て状況のキャッシュを追加
        self._cached_assignment_status = None
        self._cached_assignment_timestamp = -1
        
        # パート情報の初期化（報酬関数で使用）
        self.part_info = self._initialize_part_info()
        
        # 行動マッピングは最大次元で固定（MaskingWrapperとの整合性のため）
        # self.action_mapping_shape = (self.num_timeslots, self.num_scenes, self.num_rooms)
        
        return self._get_observation(), {}
    
    def _get_observation(self):
        """観測の取得（最大次元で固定、実際のサイズ部分のみ有効）"""
        # 最大次元で観測を作成
        observation = {
            'schedule': self.schedule.copy(),
            'scene_status': self.scene_status.copy(),
            'people_scene_participation': self.people_scene_participation.copy(),
            # 最適化: people_scene_prioritiesを削除（1,200次元削減）
            # 'people_scene_priorities': self.people_scene_priorities.copy()
        }
        
        return observation

    def _prepare_supervisor_structures(self):
        """監督者関連の前計算と時間帯×人物プレゼンスの初期化"""
        ppl_scene = self.people_scene_participation[:self.num_people, :self.num_scenes].astype(bool)
        supervisors = self.is_supervisor[:self.num_people].astype(bool)
        # scene x people: そのsceneに参加する監督者
        self._scene_supervisors_people_mask = (ppl_scene & supervisors[:, None]).T  # (scenes, people)
        # 時間帯×人物の参加有無（任意のsceneにいればTrue）
        self._time_people_presence = np.zeros((self.max_timeslots, self.max_people), dtype=bool)
        for t in range(self.num_timeslots):
            self._recompute_time_people_presence_for_time(t)

    def _recompute_time_people_presence_for_time(self, time: int):
        """指定時間帯の人物プレゼンスを再計算（増分更新用）"""
        if time < 0 or time >= self.num_timeslots:
            return
        try:
            scenes_assigned = np.any(self.schedule[time, :self.num_scenes, :self.num_rooms] == 1, axis=1)  # (scenes,)
            if not np.any(scenes_assigned):
                self._time_people_presence[time, :self.num_people] = False
                return
            ppl_scene = self.people_scene_participation[:self.num_people, :self.num_scenes].astype(bool)
            # OR over assigned scenes → people presence
            presence = np.any(ppl_scene[:, scenes_assigned], axis=1)
            self._time_people_presence[time, :self.num_people] = presence
        except Exception:
            pass

    def _has_supervisor_conflict(self, time: int, scene: int) -> bool:
        """監督者の同時重複チェック（同一時間帯に別sceneにいる場合はTrue）"""
        try:
            if scene >= self.num_scenes or time >= self.num_timeslots:
                return False
            supervisors_of_scene = self._scene_supervisors_people_mask[scene, :self.num_people]
            if not np.any(supervisors_of_scene):
                return False
            presence = self._time_people_presence[time, :self.num_people]
            return bool(np.any(supervisors_of_scene & presence))
        except Exception:
            return False
    
    def _generate_action_mask(self):
        """アクションマスクの生成（最適化版）"""
        # 最適化: 最大次元でマスクを作成（固定サイズ）
        max_action_count = self.max_timeslots * self.max_scenes * self.max_rooms
        mask = np.zeros(max_action_count, dtype=np.int32)
        # 既定ではフォールバック移動フェーズはオフ
        self._in_fallback_move_phase = False

        # 最適化: 実際の環境サイズを使用
        actual_timeslots = self.num_timeslots
        actual_scenes = self.num_scenes
        actual_rooms = self.num_rooms

        # 最適化: 割り当て状況を一括計算（重い処理を削減）
        schedule_slice = self.schedule[:actual_timeslots, :actual_scenes, :actual_rooms]
        assigned_scenes = np.any(schedule_slice, axis=(0, 2))
        assigned_scene_indices = set(np.where(assigned_scenes)[0])
        
        # 最適化: 全割り当て済みかどうかを簡潔に判定
        all_assigned = len(assigned_scene_indices) >= actual_scenes

        if not all_assigned:
            # 新規割り当てフェーズ: ベクトル化して候補生成
            unassigned = ~assigned_scenes  # (scenes,)
            # room空き: (times, rooms)
            rooms_free = ~(np.any(schedule_slice, axis=1))  # any over scenes → (times, rooms)
            # 監督者重複はマスクで禁止しない（ペナルティで処理）
            valid_ts_scene = unassigned[np.newaxis, :]
            # ブロードキャストで (times, scenes, rooms)
            candidates = (valid_ts_scene[:, :, np.newaxis] & rooms_free[:, np.newaxis, :])
            # 既に1のセルは不可
            candidates &= (schedule_slice == 0)
            # フラット化してaction indexに対応
            # 注意: action index は (t * max_scenes * max_rooms + s * max_rooms + r)
            # 実サイズのみ True を反映
            for t in range(actual_timeslots):
                base_t = t * self.max_scenes * self.max_rooms
                for s in range(actual_scenes):
                    base_ts = base_t + s * self.max_rooms
                    if np.any(candidates[t, s]):
                        rooms_idx = np.where(candidates[t, s])[0]
                        mask[base_ts + rooms_idx] = 1

            # フォールバック: 新規割り当てが1つも無い場合は移動を許可（時間帯も跨いで可）
            if not np.any(mask):
                self._in_fallback_move_phase = True
                for scene in range(actual_scenes):
                    # 既に1回移動したsceneは移動不可
                    if scene < len(self._scene_moved_once) and self._scene_moved_once[scene] == 1:
                        continue
                    scene_schedule = schedule_slice[:, scene, :]
                    assigned_positions = np.where(scene_schedule == 1)
                    if len(assigned_positions[0]) == 0:
                        continue
                    current_time = int(assigned_positions[0][0])
                    current_room = int(assigned_positions[1][0])
                    for t in range(actual_timeslots):
                        for room in range(actual_rooms):
                            if t == current_time and room == current_room:
                                continue
                            # 目標の時間帯・部屋が空いているか
                            if not np.any(self.schedule[t, :, room] == 1):
                                action_idx = t * self.max_scenes * self.max_rooms + scene * self.max_rooms + room
                                if action_idx < max_action_count:
                                    mask[action_idx] = 1
        else:
            # 移動のみ許可（簡素化版）
            for scene in range(actual_scenes):
                # 既に1回移動したsceneは移動不可
                if scene < len(self._scene_moved_once) and self._scene_moved_once[scene] == 1:
                    continue
                # 現在の割り当て位置
                scene_schedule = schedule_slice[:, scene, :]
                assigned_positions = np.where(scene_schedule == 1)
                if len(assigned_positions[0]) == 0:
                    continue
                current_time = int(assigned_positions[0][0])
                current_room = int(assigned_positions[1][0])
                # 同時間の空き部屋にのみ移動
                for room in range(actual_rooms):
                    if room == current_room:
                        continue
                    if not np.any(self.schedule[current_time, :, room] == 1):
                        action_idx = current_time * self.max_scenes * self.max_rooms + scene * self.max_rooms + room
                        if action_idx < max_action_count:
                            mask[action_idx] = 1

        return mask
    
    def _is_valid_action_internal(self, time, scene, room):
        """内部的な行動の妥当性チェック（最適化版）"""
        # 最適化: 安全な範囲を計算
        safe_timeslots = min(self.num_timeslots, self.schedule.shape[0])
        safe_scenes = min(self.num_scenes, self.schedule.shape[1])
        safe_rooms = min(self.num_rooms, self.schedule.shape[2])
        
        # 最適化: 範囲チェック
        if time >= safe_timeslots or scene >= safe_scenes or room >= safe_rooms:
            return False
        
        # 最適化: 既存の割り当てチェック
        if self.schedule[time, scene, room] == 1:
            return False
        
        # 最適化: 基本的な制約のみチェック（重い人物重複チェックは削除）
        # 同じ時間帯に同じ場面が他の部屋に割り当てられているかチェック
        if np.any(self.schedule[time, scene, :safe_rooms] == 1):
            return False
        
        # 最適化: 同じ時間帯に同じ部屋に他の場面が割り当てられているかチェック
        if np.any(self.schedule[time, :safe_scenes, room] == 1):
            return False

        # 監督者の重複はマスクで禁止しない（報酬でペナルティ）
        
        return True
    
    def step(self, action):
        """環境のステップ実行"""
        # マスクを使用した行動の妥当性チェック
        if action < 0 or action >= self.action_space.n:
            return self._get_observation(), -100, True, False, {}
        
        # キャッシュされたマスクを使用してチェック
        if self._cached_mask is None:
            self._cached_mask = self._generate_action_mask()
        
        # 無効アクションの処理（ステップカウントを進める）
        if self._cached_mask[action] == 0:
            # ステップ数を更新（無効アクションでもカウント）
            self.step_count += 1
            
            # 最大ステップ数チェック
            done = self.step_count >= self.max_steps
            # ゼロマスク（有効行動なし）の場合は終了
            if not np.any(self._cached_mask):
                done = True
            
            # 制約違反の軽いペナルティを返す（学習を阻害しない程度）
            return self._get_observation(), -1.0, done, False, {'step': self.step_count}
        
        # 行動の実行
        reward, action_info = self._execute_action(action)
        
        # 報酬の累積管理
        self.episode_reward += reward
        self.step_rewards.append(reward)
        
        # マスクを更新（次のステップで使用）
        self._cached_mask = self._generate_action_mask()
        
        # 監督カバレッジの確保
        self._ensure_supervision_coverage()
        
        # ステップ数の更新
        self.step_count += 1
        
        # done変数を初期化
        done = False

        # 早期終了: 全場面がどこかの時間帯・部屋に割り当て済みなら即終了
        try:
            schedule_slice = self.schedule[:self.num_timeslots, :self.num_scenes, :self.num_rooms]
            scenes_assigned_anywhere = np.any(schedule_slice, axis=(0, 2))  # (scenes,)
            if int(np.sum(scenes_assigned_anywhere)) >= int(self.num_scenes):
                done = True
        except Exception:
            pass
        
        # 最大ステップ数チェック
        if self.step_count >= self.max_steps:
            done = True
        
        # エピソード完了チェック（最大ステップ数・全割当終了でない場合のみ）
        if not done:
            done = self._is_episode_complete()
        
        # 終了時のターミナル重複ペナルティ
        if done:
            try:
                terminal_penalty = self.reward_function.calculate_terminal_penalty(self.schedule)
                # 最終時に no-move ボーナスを加算
                try:
                    no_move_bonus = float(self.reward_function.calculate_terminal_no_move_bonus(self.schedule))
                except Exception:
                    no_move_bonus = 0.0
                reward = reward + float(terminal_penalty) + no_move_bonus
                if hasattr(self, 'debug_mask_logging') and self.debug_mask_logging:
                    print(f"[DEBUG terminal] person-conflict terminal penalty: {terminal_penalty:.2f}, no-move bonus: {no_move_bonus:.2f}")
            except Exception as e:
                # エラーログを出力（問題の早期発見）
                print(f"[ERROR] ターミナルペナルティ計算でエラー: {e}")
                print(f"  スケジュール形状: {self.schedule.shape}")
                print(f"  報酬関数: {type(self.reward_function).__name__}")
                # エラーが発生しても学習を継続（ペナルティなし）
                pass

        # 情報の取得
        info = {
            'step': self.step_count,
            'schedule': self.schedule.copy(),
            'part_status': self.part_status.copy(),
            **action_info  # 行動情報を追加
        }
        
        return self._get_observation(), reward, done, False, info
    
    def _is_valid_action(self, action):
        """行動の妥当性チェック"""
        if action < 0 or action >= self.action_space.n:
            return False
        
        # 行動を時間、場面、部屋に分解（最大次元使用）
        time = action // (self.max_scenes * self.max_rooms)
        scene = (action % (self.max_scenes * self.max_rooms)) // self.max_rooms
        room = action % self.max_rooms
        
        return self._is_valid_action_internal(time, scene, room)
    
    def _execute_action(self, action):
        """行動の実行（最大次元対応）"""
        # 行動を時間、場面、部屋に分解（最大次元使用）
        time = action // (self.max_scenes * self.max_rooms)
        scene = (action % (self.max_scenes * self.max_rooms)) // self.max_rooms
        room = action % self.max_rooms
        
        # 実際の環境サイズ内かチェック
        if time >= self.num_timeslots or scene >= self.num_scenes or room >= self.num_rooms:
            return -100, {}  # 範囲外の行動にはペナルティ
        
        # 新規割り当てか移動かを判定
        is_new_assignment = not np.any(self.schedule[:, scene, :] == 1)
        is_move_action = not is_new_assignment
        
        # 安全な範囲を計算
        safe_timeslots = min(self.num_timeslots, self.schedule.shape[0])
        safe_scenes = min(self.num_scenes, self.schedule.shape[1])
        safe_rooms = min(self.num_rooms, self.schedule.shape[2])
        
        # 移動行動の場合、元の割り当てを削除
        if is_move_action:
            # 元の割り当て位置を特定
            old_positions = np.where(self.schedule[:, scene, :] == 1)
            for old_time, old_room in zip(old_positions[0], old_positions[1]):
                if old_time < safe_timeslots and old_room < safe_rooms:
                    self.schedule[old_time, scene, old_room] = 0
                    # 旧時間帯のプレゼンス再計算
                    self._recompute_time_people_presence_for_time(int(old_time))
            # 移動実績を記録（1回まで）
            if scene < len(self._scene_moved_once):
                self._scene_moved_once[scene] = 1
        
        # スケジュールの更新（安全な範囲内）
        if time < safe_timeslots and scene < safe_scenes and room < safe_rooms:
            self.schedule[time, scene, room] = 1
            # 新しい時間帯のプレゼンス再計算
            self._recompute_time_people_presence_for_time(int(time))
        
        # 最適化: スケジュール変更時にキャッシュを無効化
        self._cached_assignment_status = None
        self._cached_assignment_timestamp = -1
        
        # 監督状態の更新（安全な範囲内）
        # 最適化: supervision_statusは削除済みなので何もしない
        # if time < safe_timeslots and scene < safe_scenes and room < safe_rooms:
        #     self.supervision_status[time, scene, room] = 1
        
        # 詳細な行動情報を作成（報酬計算前に作成）
        action_info = {
            'assigned_scene': scene,
            'assigned_room': room,
            'assigned_time': time,
            'is_new_assignment': is_new_assignment,
            'is_move_action': is_move_action,
            'action_type': 'new_assignment' if is_new_assignment else 'move'
        }
        
        # 報酬の計算
        reward = self.reward_function.calculate_reward(
            self.schedule, self.part_status, time, scene, room, action_info
        )
        
        # 報酬をスカラー値に変換（numpy配列の場合）
        if hasattr(reward, '__len__') and len(reward) == 1:
            reward = float(reward[0])
        elif hasattr(reward, 'item'):
            reward = reward.item()
        
        return reward, action_info
    
    def _ensure_supervision_coverage(self):
        """監督カバレッジの確保（最適化版）"""
        # 最適化: supervision_statusは削除済みなので何もしない
        pass
    
    def _is_episode_complete(self):
        """エピソード完了判定（有効行動がない場合のみ終了）"""
        if self._cached_mask is not None:
            has_valid_actions = np.any(self._cached_mask)
            if not has_valid_actions:
                return True
        return False
    
    def get_unassigned_scenes(self):
        """未割り当ての場面を取得（最適化版）"""
        # 最適化: 重複するNumPy演算を削除
        # 各場面がどこかの時間帯・部屋に割り当てられているかを判定
        schedule_slice = self.schedule[:self.num_timeslots, :self.num_scenes, :self.num_rooms]
        scenes_assigned_anywhere = np.any(schedule_slice, axis=(0, 2))  # (scenes,)
        
        # 割り当て済み場面のインデックスを取得
        assigned_scenes = set(np.where(scenes_assigned_anywhere)[0])
        
        # 未割り当て場面を計算
        unassigned_scenes = set(range(self.num_scenes)) - assigned_scenes
        return sorted(unassigned_scenes)
    
    def get_episode_reward_info(self):
        """エピソードの報酬情報を取得"""
        return {
            'total_reward': self.episode_reward,
            'step_rewards': self.step_rewards.copy(),
            'num_steps': self.step_count,
            'average_reward': self.episode_reward / max(1, self.step_count),
            'min_reward': min(self.step_rewards) if self.step_rewards else 0.0,
            'max_reward': max(self.step_rewards) if self.step_rewards else 0.0
        }
    
    def get_assignment_status(self):
        """割り当て状況の詳細を取得（キャッシュ付き最適化版）"""
        # 最適化: キャッシュチェック（同じステップ内での重複計算を排除）
        if (self._cached_assignment_status is not None and 
            self._cached_assignment_timestamp == self.step_count):
            return self._cached_assignment_status
        
        # 最適化: 重複するNumPy演算を1回に統合
        # 各時間帯・場面・部屋の割り当て状況を一括取得
        schedule_slice = self.schedule[:self.num_timeslots, :self.num_scenes, :self.num_rooms]
        
        # 最適化: 1回の演算で両方を取得
        # 各場面がどこかの時間帯・部屋に割り当てられているかを判定
        scenes_assigned_anywhere = np.any(schedule_slice, axis=(0, 2))  # (scenes,)
        
        # 割り当て済み場面のインデックスを取得
        assigned_scenes = set(np.where(scenes_assigned_anywhere)[0])
        
        # 総割り当て数を一括計算
        total_assignments = np.sum(schedule_slice == 1)
        
        # 制約による最大可能割り当て数
        max_possible_assignments = self.num_timeslots * min(self.num_rooms, self.num_scenes)
        
        # 結果をキャッシュに保存
        result = {
            'assigned_scenes': sorted(assigned_scenes),
            'unassigned_scenes': sorted(set(range(self.num_scenes)) - assigned_scenes),
            'total_assignments': total_assignments,
            'max_possible_assignments': max_possible_assignments,
            'actual_completion_rate': len(assigned_scenes) / self.num_scenes,
            'max_possible_completion_rate': max_possible_assignments / self.num_scenes,
            'is_constraint_limited': max_possible_assignments < self.num_scenes
        }
        
        # キャッシュを更新
        self._cached_assignment_status = result
        self._cached_assignment_timestamp = self.step_count
        
        return result
    
    def _init_reward_function(self):
        """報酬関数の初期化（最適化版）"""
        # 最適化: 報酬関数の初期化を簡素化
        self.reward_function = SceneBasedReward(
            reward_config=self.reward_config,
            scenes=self.scenes,
            people_scene_participation=self.people_scene_participation
        )
        
        # 人物の場面参加情報を設定
        self.reward_function.set_people_participation(self.people_scene_participation)
        # フォールバック移動フェーズ参照のため環境参照を付与
        try:
            self.reward_function.env_ref = self
        except Exception:
            pass
        # 最適化: people_scene_prioritiesは削除済み
        # self.reward_function.set_people_priorities(self.people_scene_priorities)
    
    def render(self):
        """環境の描画"""
        print(f"\n=== 練習表環境 (ステップ {self.step_count}) ===")
        print(f"パート数: {self.num_scenes}, 部屋数: {self.num_rooms}, 時間帯数: {self.num_timeslots}")
        print(f"人物数: {self.num_people}")
        
        print("\n--- スケジュール ---")
        for time in range(self.num_timeslots):
            print(f"時間帯 {time}:")
            for room in range(self.num_rooms):
                assigned_parts = []
                for scene in range(self.num_scenes):
                    if self.schedule[time, scene, room] == 1:
                        part_name = self.part_info['part_names'][scene]
                        assigned_parts.append(part_name)
                
                if assigned_parts:
                    print(f"  部屋 {room}: {', '.join(assigned_parts)}")
                else:
                    print(f"  部屋 {room}: 未割り当て")
        
        print(f"\nパート完了率: {np.sum(self.part_status[:self.num_scenes]) / self.num_scenes:.2%}")
        print(f"監督カバレッジ: {np.sum(np.zeros((self.max_timeslots, self.max_rooms), dtype=np.int32)) / (self.max_timeslots * self.max_rooms):.2%}") # supervision_statusは常に0なので削除
    
    @property
    def environment_config(self):
        """環境設定の取得（後方互換性）"""
        return self.env_config
    
    def seed(self, seed=None):
        """
        環境のシードを設定
        
        Args:
            seed: シード値
            
        Returns:
            シード値のリスト
        """
        if hasattr(self, '_np_random') and self._np_random is not None:
            self._np_random.seed(seed)
        return [seed]
