import numpy as np
from src.utils.constants import *

class SceneBasedReward:
    """場面ベース報酬関数（設定駆動）"""
    
    def __init__(self, reward_config=None, scenes=None, people_scene_participation=None):
        """報酬関数の初期化。configs/reward/reward.yaml を優先使用。

        フォールバックとして src/utils/constants の定数を使用。
        """
        self.reward_config = reward_config or {}
        self.scenes = scenes or []
        self.people_scene_participation = people_scene_participation

        # reward.yaml を優先しつつ、定数をフォールバック
        basic_cfg = (self.reward_config.get('basic_rewards')
                     if isinstance(self.reward_config.get('basic_rewards'), dict) else {})
        quality_cfg = (self.reward_config.get('quality_rewards')
                       if isinstance(self.reward_config.get('quality_rewards'), dict) else {})
        completion_cfg = (self.reward_config.get('completion_rewards')
                          if isinstance(self.reward_config.get('completion_rewards'), dict) else {})
        person_cfg = (self.reward_config.get('person_constraints')
                      if isinstance(self.reward_config.get('person_constraints'), dict) else {})

        # 基本報酬
        self.basic_rewards = {
            'new_assignment': basic_cfg.get('new_assignment', REWARD_NEW_ASSIGNMENT),
            'reassignment': basic_cfg.get('reassignment', REWARD_REASSIGNMENT),
            'repeat_action': basic_cfg.get('repeat_action', REWARD_REPEAT_ACTION),
            'step_penalty': basic_cfg.get('step_penalty', REWARD_STEP_PENALTY),
        }
        
        # 品質報酬
        self.quality_rewards = {
            'time_efficiency': quality_cfg.get('time_efficiency', REWARD_TIME_EFFICIENCY)
        }
        
        # 人物制約
        self.person_constraints = {
            'person_conflict': person_cfg.get('person_conflict', REWARD_PERSON_CONFLICT),
            'terminal_multiplier': float(person_cfg.get('terminal_multiplier', 5.0)),
            # 監督者重複の強いペナルティ（設定が無ければ大きめ）
            'supervisor_conflict_penalty': float(person_cfg.get('supervisor_conflict_penalty',  -2.0))
        }
        
        # 完了報酬
        self.completion_rewards = {
            'scene_completion': completion_cfg.get('scene_completion', REWARD_SCENE_COMPLETION),
            # episode_completion は未使用
        }
    
    def set_scenes(self, scenes):
        """場面情報の設定"""
        self.scenes = scenes
    
    def set_people_participation(self, people_scene_participation):
        """人物の場面参加情報の設定"""
        self.people_scene_participation = people_scene_participation
    
    # 最適化: people_scene_prioritiesの設定メソッドを削除
    # def set_people_priorities(self, people_scene_priorities):
    #     """人物の場面優先度情報の設定"""
    #     self.people_scene_priorities = people_scene_priorities
    
    def calculate_reward(self, schedule, part_status, time, scene, room, action_info=None):
        """シンプル化された報酬の計算（設定駆動版）"""
        total_reward = 0.0

        # 動的スケール（max/actual）
        scale_S = scale_T = scale_P = 1.0
        try:
            if hasattr(self, 'env_ref') and self.env_ref is not None:
                S = max(1, int(getattr(self.env_ref, 'num_scenes', 1)))
                Smax = max(1, int(getattr(self.env_ref, 'max_scenes', S)))
                T = max(1, int(getattr(self.env_ref, 'num_timeslots', 1)))
                Tmax = max(1, int(getattr(self.env_ref, 'max_timeslots', T)))
                P = max(1, int(getattr(self.env_ref, 'num_people', 1)))
                Pmax = max(1, int(getattr(self.env_ref, 'max_people', P)))
                scale_S = float(Smax) / float(S)
                scale_T = float(Tmax) / float(T)
                scale_P = float(Pmax) / float(P)
        except Exception:
            pass
        
        # 基本報酬（新規割り当て vs 移動の区別）
        total_reward += self._calculate_basic_reward(time, scene, room, action_info, scale_S=scale_S)
        
        # ステップペナルティ（フォールバック移動中は0）
        try:
            if hasattr(self, 'env_ref') and getattr(self.env_ref, '_in_fallback_move_phase', False):
                step_pen = 0.0
            else:
                step_pen = self.basic_rewards.get('step_penalty', REWARD_STEP_PENALTY) * scale_T
        except Exception:
            step_pen = self.basic_rewards.get('step_penalty', REWARD_STEP_PENALTY) * scale_T
        total_reward += step_pen
        
        # 品質報酬（無効化：定数シェーピングを削除）
        total_reward += self._evaluate_time_efficiency(schedule, time, scene, room)
        
        # 人物制約ペナルティ（ステップごと）
        total_reward += self._evaluate_person_conflicts(schedule, time, scene, room, scale_P=scale_P)
        # 監督者重複ペナルティ（マスクではなくペナルティで処理）
        total_reward += self._evaluate_supervisor_conflicts(schedule, time, scene, room, scale_P=scale_P)
        # 同一時間の人物重複に小ペナルティ（全体）
        total_reward += self._small_overlap_penalty(schedule, time, scale_P=scale_P)
        
        # 完了報酬（場面単位：初回割り当て時のみ付与）
        total_reward += self._calculate_completion_reward(part_status, scene, action_info, scale_S=scale_S)
        
        return total_reward
    
    def _calculate_basic_reward(self, time, scene, room, action_info=None, scale_S: float = 1.0):
        """基本報酬の計算（新規割り当て vs 移動の区別）"""
        if action_info is None:
            # 後方互換性のため、デフォルトは新規割り当て報酬
            return self.basic_rewards['new_assignment'] * scale_S
        
        # 新規割り当て vs 移動で報酬を区別
        if action_info.get('is_new_assignment', False):
            return self.basic_rewards['new_assignment'] * scale_S
        elif action_info.get('is_move_action', False):
            # 移動はフラットにペナルティ
            return self.basic_rewards['reassignment']
        else:
            # デフォルトは新規割り当て報酬
            return self.basic_rewards['new_assignment'] * scale_S
    
    def _evaluate_time_efficiency(self, schedule, time, scene, room):
        """時間効率の評価（無効化）"""
        # 定数シェーピングを避けるため0を返す
        return 0.0
    
    def _evaluate_person_conflicts(self, schedule, time, scene, room, scale_P: float = 1.0):
        """人物重複の増分ペナルティ（最適化版）"""
        if self.people_scene_participation is None:
            return 0.0

        penalty = 0.0

        # 指定時間帯に既に割り当てられている場面（新規sceneは除く）
        # 高速化: その時間帯の行のみ取り出し、軸1でany
        existing_scenes_in_time = np.where(np.any(schedule[time], axis=1))[0]

        # 新規sceneに参加する人物のみを見る
        if scene >= self.people_scene_participation.shape[1]:
            return 0.0

        # ベクトル化: 人×scene で参照し、衝突数をまとめて数える
        max_people = self.people_scene_participation.shape[0]
        ppl_scene = self.people_scene_participation[:max_people, :]
        new_scene_people = ppl_scene[:, scene].astype(bool)
        
        if np.any(new_scene_people) and existing_scenes_in_time.size > 0:
            # 最適化: 既存シーンの参加者を一括取得
            existing_mat = ppl_scene[:, existing_scenes_in_time].astype(bool)
            # 最適化: 衝突チェックを簡素化（重い計算を削除）
            conflicted_people = new_scene_people & np.any(existing_mat, axis=1)
            
            if np.any(conflicted_people):
                # 固定ペナルティ（設定値に従う）
                conflicts_added = int(np.sum(conflicted_people))
                pc = float(self.person_constraints['person_conflict']) * scale_P
                penalty += conflicts_added * pc

        return penalty

    def _evaluate_supervisor_conflicts(self, schedule, time, scene, room, scale_P: float = 1.0):
        """監督者重複の増分ペナルティ。マスクではなく報酬で反映する。"""
        try:
            if not hasattr(self, 'env_ref') or self.env_ref is None:
                return 0.0
            # その時間にそのsceneを置いた場合の監督者重複人数を、近似的に既存プレゼンスとsceneの監督者集合のANDで見る
            if time >= self.env_ref.num_timeslots or scene >= self.env_ref.num_scenes:
                return 0.0
            supervisors_of_scene = self.env_ref._scene_supervisors_people_mask[scene, :self.env_ref.num_people]
            if not np.any(supervisors_of_scene):
                return 0.0
            presence = self.env_ref._time_people_presence[time, :self.env_ref.num_people]
            conflicts = int(np.sum(supervisors_of_scene & presence))
            if conflicts <= 0:
                return 0.0
            pen = float(self.person_constraints.get('supervisor_conflict_penalty', -2.0)) * scale_P
            return pen * float(conflicts)
        except Exception:
            return 0.0

    def _small_overlap_penalty(self, schedule, time, scale_P: float = 1.0):
        """同一時間に2場面以上に参加している人物数に小さなペナルティを付与"""
        try:
            if self.people_scene_participation is None:
                return 0.0
            # その時間帯に割り当てられているsceneの有無 (scenes,)
            scenes_assigned = np.any(schedule[time], axis=1)
            if not np.any(scenes_assigned):
                return 0.0
            # 人×scene の参加を抽出
            ppl_scene = self.people_scene_participation.astype(bool)
            # 人ごとの同時間帯参加数
            scenes_per_person = np.sum(ppl_scene[:, scenes_assigned], axis=1)
            overlaps = np.maximum(0, scenes_per_person - 1)
            # 小さな係数（設定から取得、なければデフォルト）
            factor = float(self.reward_config.get('person_constraints', {}).get('small_overlap_factor', 0.05)) * scale_P
            return -factor * float(np.sum(overlaps))
        except Exception:
            return 0.0
    
    # 最適化: 不要な優先度重み付きペナルティ計算を削除
    # def _calculate_priority_weighted_penalty(self, person_idx, conflicting_scenes):
    #     """優先度重み付きペナルティの計算（最適化により削除）"""
    #     pass

    def calculate_terminal_penalty(self, schedule):
        """エピソード終了時の人物重複ペナルティ（完全最適化版）"""
        if self.people_scene_participation is None:
            return 0.0

        # 最適化: 完全ベクトル化による高速化
        times, scenes, rooms = schedule.shape
        
        # 各時間帯で各人物の参加場面を一括取得
        # shape: (times, people, scenes) - 各時間帯・人物・場面の参加状況
        participation_expanded = np.expand_dims(self.people_scene_participation, axis=0)  # (1, people, scenes)
        participation_expanded = np.repeat(participation_expanded, times, axis=0)  # (times, people, scenes)
        
        # 各時間帯で各場面が割り当てられているかを一括取得
        # shape: (times, scenes) - 各時間帯・場面の割り当て状況
        scenes_assigned = np.any(schedule, axis=2)  # (times, scenes)
        
        # 各時間帯で各人物が参加している場面数を一括計算
        # shape: (times, people) - 各時間帯・人物の参加場面数
        scenes_per_person = np.sum(participation_expanded * scenes_assigned[:, np.newaxis, :], axis=2)
        
        # 重複がある人物（2場所以上に参加）のペナルティを一括計算
        # shape: (times, people) - 各時間帯・人物の重複ペナルティ
        conflicts_per_person = np.maximum(0, scenes_per_person - 1)
        
        # 全時間帯・全人物の重複ペナルティを合計
        total_conflicts = np.sum(conflicts_per_person)
        
        # スケール（max/actual people）
        scale_P = 1.0
        try:
            if hasattr(self, 'env_ref') and self.env_ref is not None:
                P = max(1, int(getattr(self.env_ref, 'num_people', 1)))
                Pmax = max(1, int(getattr(self.env_ref, 'max_people', P)))
                scale_P = float(Pmax) / float(P)
        except Exception:
            pass
        total_penalty = total_conflicts * (float(self.person_constraints['person_conflict']) * scale_P)

        return total_penalty * float(self.person_constraints.get('terminal_multiplier', 5.0))
    
    # 以下のメソッドは監督・設備制約無効化により削除
    # - _evaluate_scene_cohesion
    # - _evaluate_supervision_quality  
    # - _calculate_constraint_reward
    # - _evaluate_supervision_coverage
    # - _evaluate_supervisor_efficiency
    
    def _calculate_completion_reward(self, part_status, scene, action_info=None, scale_S: float = 1.0):
        """完了報酬の計算（初回割り当て時のみ）"""
        # scene の初回割り当て（is_new_assignment）時のみ付与
        if action_info is not None and action_info.get('is_new_assignment', False):
            return self.completion_rewards['scene_completion'] * scale_S
        return 0.0
    
    def calculate_terminal_no_move_bonus(self, schedule):
        """全タイムスロットを通じて、同じ部屋に留まった人数に比例したボーナスを合算して返す。"""
        try:
            if self.people_scene_participation is None:
                return 0.0
            times, scenes, rooms = schedule.shape
            if times <= 1:
                return 0.0
            ppl_scene = self.people_scene_participation.astype(bool)  # (people, scenes)
            total_stayed = 0
            for t in range(1, times):
                # 各部屋ごとに、t-1 と t を比較
                prev_any_in_room = schedule[t - 1].astype(bool)  # (scenes, rooms)
                curr_any_in_room = schedule[t].astype(bool)      # (scenes, rooms)
                for r in range(rooms):
                    if not np.any(prev_any_in_room[:, r]) or not np.any(curr_any_in_room[:, r]):
                        continue
                    # t-1 で部屋rにいた人物集合
                    people_prev_same_room = np.any(ppl_scene[:, prev_any_in_room[:, r]], axis=1)
                    # t で部屋rにいる人物集合（どのsceneでも可）
                    people_curr_same_room = np.any(ppl_scene[:, curr_any_in_room[:, r]], axis=1)
                    total_stayed += int(np.sum(people_prev_same_room & people_curr_same_room))
            bonus = float(self.reward_config.get('person_constraints', {}).get('no_move_bonus_per_person', 0.05))
            # スケール（max/actual people と timeslots-1）
            scale_P = scale_T = 1.0
            try:
                if hasattr(self, 'env_ref') and self.env_ref is not None:
                    P = max(1, int(getattr(self.env_ref, 'num_people', 1)))
                    Pmax = max(1, int(getattr(self.env_ref, 'max_people', P)))
                    T = max(1, int(getattr(self.env_ref, 'num_timeslots', 1)))
                    Tmax = max(1, int(getattr(self.env_ref, 'max_timeslots', T)))
                    scale_P = float(Pmax) / float(P)
                    scale_T = float(max(1, Tmax - 1)) / float(max(1, T - 1))
            except Exception:
                pass
            bonus *= (scale_P * scale_T)
            return bonus * float(total_stayed)
        except Exception:
            return 0.0

    def reset(self):
        """報酬関数のリセット"""
        pass