"""
シーンベース最適化サービス
強化学習ベースのスケジュール最適化を提供
"""
import sys
import os
import time
from typing import Dict, Any, List, Optional
from datetime import datetime

# srcディレクトリをパスに追加
sys.path.append(os.path.join(os.path.dirname(__file__), '../../src'))

from app.core.config import settings
from app.core.exceptions import ModelLoadException, PredictionException, TrainingException

class SceneBasedOptimizerService:
    """シーンベース最適化サービス"""
    
    def __init__(self):
        self.model_loaded = False
        self.model = None
        self.env = None
        self.trainer = None
        
    async def _load_model(self):
        """モデルを読み込み"""
        if self.model_loaded:
            return
            
        try:
            # 強化学習環境の初期化
            from environment.environment import ScheduleOptimizationEnv
            from training.ppo_trainer import PPOTrainer
            
            self.env = ScheduleOptimizationEnv()
            self.trainer = PPOTrainer()
            
            # モデルの読み込み
            model_path = settings.MODELS["scene_based_system"]["model_path"]
            if os.path.exists(model_path):
                self.model = self.trainer.load_model(model_path)
            else:
                # デフォルトモデルを作成
                self.model = self.trainer.create_model()
            
            self.model_loaded = True
            
        except Exception as e:
            raise ModelLoadException(f"モデルの読み込みに失敗しました: {str(e)}")
    
    async def optimize(self, request) -> Dict[str, Any]:
        """スケジュール最適化（アルゴリズムベースの代替実装）"""
        try:
            # 設定から最適化方法を決定
            algorithm_type = settings.OPTIMIZATION.get("algorithm_type", "greedy")
            
            if algorithm_type == "greedy":
                return await self._greedy_optimization(request)
            elif algorithm_type == "genetic":
                return await self._genetic_optimization(request)
            else:
                # デフォルトは貪欲法
                return await self._greedy_optimization(request)
            
        except Exception as e:
            # フォールバック: 元の機械学習ベースの実装
            print(f"アルゴリズム最適化に失敗、フォールバック実行: {e}")
            return await self._ml_based_optimization(request)
    
    async def _greedy_optimization(self, request) -> Dict[str, Any]:
        """アルゴリズムベースのスケジュール最適化"""
        try:
            # リクエストデータから基本情報を抽出
            schedule_data = getattr(request, 'schedule_data', {})
            members = getattr(request, 'members', [])
            venues = getattr(request, 'venues', [])
            constraints = getattr(request, 'constraints', {})
            
            # 基本パラメータの設定
            num_timeslots = 5  # 1日5コマ（09:00-18:15）
            num_scenes = len(members) if members else 10
            num_rooms = len(venues) if venues else 5
            
            # 時間スロットの定義
            time_slots = [
                "09:00-10:30",  # 1限
                "10:45-12:15",  # 2限
                "13:15-14:45",  # 3限
                "15:00-16:30",  # 4限
                "16:45-18:15"   # 5限
            ]
            
            # アルゴリズムベースの最適化実行
            optimized_sessions = self._greedy_schedule_optimization(
                members, venues, time_slots, constraints
            )
            
            # メンバー割り当て情報を生成
            member_assignments = self._generate_member_assignments_from_sessions(optimized_sessions)
            
            # 報酬を計算（簡易版）
            reward = self._calculate_algorithm_reward(optimized_sessions, members, venues)
            
            return {
                "optimized_schedule": {
                    "sessions": optimized_sessions
                },
                "reward": float(reward),
                "assignments": {
                    "member_assignments": member_assignments
                }
            }
            
        except Exception as e:
            raise PredictionException(f"アルゴリズム最適化に失敗しました: {str(e)}")
    
    def _greedy_schedule_optimization(self, members, venues, time_slots, constraints):
        """貪欲法によるスケジュール最適化"""
        sessions = []
        used_times = set()
        used_venues = set()
        
        # メンバーを優先度順にソート（優先度が高い順）
        sorted_members = sorted(members, key=lambda m: getattr(m, 'priority', 3), reverse=True)
        
        for member in sorted_members:
            # 最適な時間スロットと会場を選択
            best_time, best_venue = self._find_best_slot(
                member, venues, time_slots, used_times, used_venues, constraints
            )
            
            if best_time and best_venue:
                session = {
                    "date": "2024-01-01",  # 固定日付（実際の実装では動的に設定）
                    "time": best_time,
                    "venue": best_venue,
                    "members": [str(getattr(member, 'id', 'unknown'))],
                    "part": getattr(member, 'part', '未設定')
                }
                sessions.append(session)
                
                # 使用済みとしてマーク
                used_times.add(best_time)
                used_venues.add(best_venue)
        
        return sessions
    
    def _find_best_slot(self, member, venues, time_slots, used_times, used_venues, constraints):
        """最適な時間スロットと会場を検索"""
        # 制約を考慮した候補を生成
        available_slots = []
        
        for time_slot in time_slots:
            if time_slot in used_times:
                continue
                
            for venue in venues:
                venue_name = getattr(venue, 'name', str(venue))
                if venue_name in used_venues:
                    continue
                
                # 制約チェック
                if self._check_constraints(member, venue, time_slot, constraints):
                    score = self._calculate_slot_score(member, venue, time_slot)
                    available_slots.append((score, time_slot, venue_name))
        
        if available_slots:
            # スコアが最も高いスロットを選択
            available_slots.sort(key=lambda x: x[0], reverse=True)
            return available_slots[0][1], available_slots[0][2]
        
        return None, None
    
    def _check_constraints(self, member, venue, time_slot, constraints):
        """制約チェック"""
        # 基本的な制約チェック
        # 1. 時間・会場の重複チェック（呼び出し元で既にチェック済み）
        # 2. メンバーの参加可能時間チェック
        # 3. 会場の容量チェック
        
        venue_capacity = getattr(venue, 'capacity', 20)
        if venue_capacity < 1:  # 最低1人は必要
            return False
        
        # 時間帯の制約チェック（例：午前のみ参加可能なメンバーなど）
        member_preference = getattr(member, 'time_preference', None)
        if member_preference == 'morning' and '13:' in time_slot:
            return False
        if member_preference == 'afternoon' and '09:' in time_slot:
            return False
        
        return True
    
    def _calculate_slot_score(self, member, venue, time_slot):
        """スロットのスコア計算"""
        score = 0
        
        # メンバーの優先度
        priority = getattr(member, 'priority', 3)
        score += priority * 10
        
        # 会場の優先度
        venue_priority = getattr(venue, 'priority', 3)
        score += venue_priority * 5
        
        # 時間帯の優先度（午前の方が高い）
        if '09:' in time_slot or '10:' in time_slot:
            score += 10
        elif '13:' in time_slot or '15:' in time_slot:
            score += 5
        else:
            score += 1
        
        return score
    
    def _generate_member_assignments_from_sessions(self, sessions):
        """セッションからメンバー割り当て情報を生成"""
        member_assignments = {}
        
        for session in sessions:
            for member_id in session.get('members', []):
                if member_id not in member_assignments:
                    member_assignments[member_id] = []
                
                session_key = f"{session['time']}_{session['venue']}"
                member_assignments[member_id].append(session_key)
        
        return member_assignments
    
    def _calculate_algorithm_reward(self, sessions, members, venues):
        """アルゴリズムベースの報酬計算"""
        if not sessions:
            return 0.0
        
        # 基本的な報酬計算
        base_reward = len(sessions) * 10  # セッション数に応じた基本報酬
        
        # 制約違反のペナルティ
        penalty = 0
        used_times = set()
        used_venues = set()
        
        for session in sessions:
            time = session.get('time', '')
            venue = session.get('venue', '')
            
            if time in used_times:
                penalty += 5  # 時間重複ペナルティ
            if venue in used_venues:
                penalty += 5  # 会場重複ペナルティ
            
            used_times.add(time)
            used_venues.add(venue)
        
        # 完了率ボーナス
        completion_rate = len(sessions) / max(len(members), 1)
        completion_bonus = completion_rate * 50
        
        total_reward = base_reward - penalty + completion_bonus
        return max(0, total_reward)
    
    async def _genetic_optimization(self, request) -> Dict[str, Any]:
        """遺伝的アルゴリズムによるスケジュール最適化"""
        try:
            # リクエストデータから基本情報を抽出
            schedule_data = getattr(request, 'schedule_data', {})
            members = getattr(request, 'members', [])
            venues = getattr(request, 'venues', [])
            constraints = getattr(request, 'constraints', {})
            
            # 時間スロットの定義
            time_slots = [
                "09:00-10:30",  # 1限
                "10:45-12:15",  # 2限
                "13:15-14:45",  # 3限
                "15:00-16:30",  # 4限
                "16:45-18:15"   # 5限
            ]
            
            # 遺伝的アルゴリズムのパラメータ
            population_size = 50
            generations = 100
            mutation_rate = 0.1
            
            # 初期集団を生成
            population = self._generate_initial_population(
                members, venues, time_slots, population_size
            )
            
            # 遺伝的アルゴリズムの実行
            best_solution = self._run_genetic_algorithm(
                population, members, venues, time_slots, 
                constraints, generations, mutation_rate
            )
            
            # 最適解をセッション形式に変換
            optimized_sessions = self._convert_solution_to_sessions(
                best_solution, members, venues, time_slots
            )
            
            # メンバー割り当て情報を生成
            member_assignments = self._generate_member_assignments_from_sessions(optimized_sessions)
            
            # 報酬を計算
            reward = self._calculate_algorithm_reward(optimized_sessions, members, venues)
            
            return {
                "optimized_schedule": {
                    "sessions": optimized_sessions
                },
                "reward": float(reward),
                "assignments": {
                    "member_assignments": member_assignments
                }
            }
            
        except Exception as e:
            raise PredictionException(f"遺伝的アルゴリズム最適化に失敗しました: {str(e)}")
    
    def _generate_initial_population(self, members, venues, time_slots, population_size):
        """初期集団を生成"""
        population = []
        
        for _ in range(population_size):
            # ランダムなスケジュールを生成
            solution = []
            used_times = set()
            used_venues = set()
            
            for member in members:
                # 利用可能な時間スロットと会場を選択
                available_slots = []
                for time_slot in time_slots:
                    if time_slot in used_times:
                        continue
                    for venue in venues:
                        venue_name = getattr(venue, 'name', str(venue))
                        if venue_name in used_venues:
                            continue
                        available_slots.append((time_slot, venue_name))
                
                if available_slots:
                    # ランダムに選択
                    import random
                    time_slot, venue_name = random.choice(available_slots)
                    solution.append({
                        'member_id': getattr(member, 'id', 'unknown'),
                        'time': time_slot,
                        'venue': venue_name
                    })
                    used_times.add(time_slot)
                    used_venues.add(venue_name)
            
            population.append(solution)
        
        return population
    
    def _run_genetic_algorithm(self, population, members, venues, time_slots, 
                              constraints, generations, mutation_rate):
        """遺伝的アルゴリズムを実行"""
        import random
        
        for generation in range(generations):
            # 適応度を計算
            fitness_scores = []
            for solution in population:
                fitness = self._calculate_fitness(solution, members, venues, constraints)
                fitness_scores.append(fitness)
            
            # 新しい世代を生成
            new_population = []
            
            # エリート選択（上位20%を保持）
            elite_size = max(1, len(population) // 5)
            elite_indices = sorted(range(len(fitness_scores)), 
                                 key=lambda i: fitness_scores[i], reverse=True)[:elite_size]
            
            for idx in elite_indices:
                new_population.append(population[idx].copy())
            
            # 交叉と突然変異で残りを生成
            while len(new_population) < len(population):
                # 親を選択（トーナメント選択）
                parent1 = self._tournament_selection(population, fitness_scores)
                parent2 = self._tournament_selection(population, fitness_scores)
                
                # 交叉
                child = self._crossover(parent1, parent2)
                
                # 突然変異
                if random.random() < mutation_rate:
                    child = self._mutate(child, time_slots, venues)
                
                new_population.append(child)
            
            population = new_population
        
        # 最終世代から最良解を選択
        final_fitness = [self._calculate_fitness(sol, members, venues, constraints) 
                        for sol in population]
        best_idx = max(range(len(final_fitness)), key=lambda i: final_fitness[i])
        
        return population[best_idx]
    
    def _calculate_fitness(self, solution, members, venues, constraints):
        """解の適応度を計算"""
        if not solution:
            return 0
        
        fitness = 0
        
        # 基本スコア（割り当て数）
        fitness += len(solution) * 10
        
        # 制約違反のペナルティ
        used_times = set()
        used_venues = set()
        
        for assignment in solution:
            time = assignment.get('time', '')
            venue = assignment.get('venue', '')
            
            if time in used_times:
                fitness -= 20  # 時間重複ペナルティ
            if venue in used_venues:
                fitness -= 20  # 会場重複ペナルティ
            
            used_times.add(time)
            used_venues.add(venue)
        
        # 完了率ボーナス
        completion_rate = len(solution) / max(len(members), 1)
        fitness += completion_rate * 50
        
        return max(0, fitness)
    
    def _tournament_selection(self, population, fitness_scores, tournament_size=3):
        """トーナメント選択"""
        import random
        
        tournament_indices = random.sample(range(len(population)), 
                                         min(tournament_size, len(population)))
        tournament_fitness = [fitness_scores[i] for i in tournament_indices]
        winner_idx = tournament_indices[max(range(len(tournament_fitness)), 
                                          key=lambda i: tournament_fitness[i])]
        
        return population[winner_idx].copy()
    
    def _crossover(self, parent1, parent2):
        """交叉操作"""
        import random
        
        # 一様交叉
        child = []
        used_times = set()
        used_venues = set()
        
        for i in range(max(len(parent1), len(parent2))):
            if i < len(parent1) and i < len(parent2):
                # 両方の親に要素がある場合、ランダムに選択
                if random.random() < 0.5:
                    assignment = parent1[i]
                else:
                    assignment = parent2[i]
            elif i < len(parent1):
                assignment = parent1[i]
            else:
                assignment = parent2[i]
            
            # 制約チェック
            time = assignment.get('time', '')
            venue = assignment.get('venue', '')
            
            if time not in used_times and venue not in used_venues:
                child.append(assignment)
                used_times.add(time)
                used_venues.add(venue)
        
        return child
    
    def _mutate(self, solution, time_slots, venues):
        """突然変異操作"""
        import random
        
        if not solution:
            return solution
        
        # ランダムに1つの割り当てを変更
        mutation_idx = random.randint(0, len(solution) - 1)
        assignment = solution[mutation_idx]
        
        # 新しい時間スロットと会場を選択
        new_time = random.choice(time_slots)
        new_venue = random.choice([getattr(v, 'name', str(v)) for v in venues])
        
        assignment['time'] = new_time
        assignment['venue'] = new_venue
        
        return solution
    
    def _convert_solution_to_sessions(self, solution, members, venues, time_slots):
        """解をセッション形式に変換"""
        sessions = []
        
        for assignment in solution:
            member_id = assignment.get('member_id', 'unknown')
            time = assignment.get('time', '')
            venue = assignment.get('venue', '')
            
            # メンバー情報を取得
            member_info = next((m for m in members if getattr(m, 'id', '') == member_id), None)
            part = getattr(member_info, 'part', '未設定') if member_info else '未設定'
            
            session = {
                "date": "2024-01-01",  # 固定日付
                "time": time,
                "venue": venue,
                "members": [member_id],
                "part": part
            }
            sessions.append(session)
        
        return sessions
    
    async def _ml_based_optimization(self, request) -> Dict[str, Any]:
        """機械学習ベースの最適化（元の実装）"""
        try:
            # 環境設定と報酬設定を読み込み
            from src.utils.utils import load_config
            
            env_config = load_config('configs/environment/env.yaml')
            reward_config = load_config('configs/reward/reward.yaml')
            env_config['reward_config'] = reward_config
            
            # 学習時と同じ環境作成方法を使用
            from src.training.train import create_environment_with_dynamic_obs
            
            # 学習時と同じ環境を作成（マスキング有効）
            env = create_environment_with_dynamic_obs(env_config, use_masking=True)
            
            # Monitorで包まれている場合の環境属性アクセス
            if hasattr(env, 'env'):
                base_env = env.env
                if hasattr(base_env, 'env'):
                    base_env = base_env.env
            else:
                base_env = env
            
            # 受け取ったデータを環境に適用
            await self._apply_request_data_to_env(base_env, request)
            
            # 割り当ての実行
            obs, _ = env.reset()
            done = False
            steps = 0
            max_steps = env_config.get('max_steps', 40)
            
            # 学習済みモデルがあれば使用、なければランダム
            if hasattr(self, 'model') and self.model is not None:
                from stable_baselines3 import PPO
                model = PPO.load("models/scene_based_system/best/best_model.zip")
                
                while not done and steps < max_steps:
                    action, _ = model.predict(obs, deterministic=True)
                    obs, _, done, _, _ = env.step(action)
                    steps += 1
            else:
                # ランダムアクション（デモ用）
                while not done and steps < max_steps:
                    action = env.action_space.sample()
                    obs, _, done, _, _ = env.step(action)
                    steps += 1
            
            # 最終的なスケジュールを取得
            schedule = base_env.schedule[:base_env.num_timeslots, :base_env.num_scenes, :base_env.num_rooms].copy()
            
            # 人物割り当て情報を取得
            people_assignments = self._get_people_assignments(base_env, schedule)
            
            # 最適化されたスケジュールを生成
            optimized_sessions = self._convert_schedule_to_sessions(schedule, base_env, people_assignments)
            
            # メンバー割り当て情報を生成
            member_assignments = self._generate_member_assignments(people_assignments)
            
            # 報酬を計算
            reward = self._calculate_reward(base_env, schedule)
            
            # 制約チェックと修正を実行
            validated_sessions = self._validate_time_and_part_constraints(optimized_sessions, request)
            
            return {
                "optimized_schedule": {
                    "sessions": validated_sessions
                },
                "reward": float(reward),
                "assignments": {
                    "member_assignments": member_assignments
                }
            }
            
        except Exception as e:
            raise PredictionException(f"スケジュール最適化に失敗しました: {str(e)}")
    
    def _validate_time_and_part_constraints(self, sessions: List[Dict], request) -> List[Dict]:
        """
        時間とパートの制約をチェックして修正
        
        Args:
            sessions: セッションリスト
            request: リクエストオブジェクト
            
        Returns:
            制約を満たすように修正されたセッションリスト
        """
        try:
            constraints = getattr(request, 'constraints', {}) or {}
            validated_sessions = []
            time_venue_usage = {}  # {time: {venue: part}}
            
            for session in sessions:
                time_slot = session.get("time", "")
                venue = session.get("venue", "")
                part = session.get("part", "")
                
                # 時間・会場の組み合わせをキーとして使用
                time_venue_key = f"{time_slot}_{venue}"
                
                # 制約1: 1つの時間に1つの会場では1つのパートのみ
                max_concurrent = constraints.get("max_concurrent_sessions_per_time_slot", 1)
                allow_overlap = constraints.get("allow_part_overlap_in_same_venue", False)
                
                if time_venue_key in time_venue_usage:
                    if not allow_overlap:
                        # 重複を避けるため、時間を調整
                        session = self._adjust_session_time(session, time_venue_usage)
                    else:
                        # 重複を許可する場合でも、最大同時セッション数をチェック
                        current_count = len([k for k in time_venue_usage.keys() if k.startswith(time_slot)])
                        if current_count >= max_concurrent:
                            session = self._adjust_session_time(session, time_venue_usage)
                
                # 更新されたセッション情報で使用状況を記録
                updated_time_venue_key = f"{session.get('time', '')}_{session.get('venue', '')}"
                time_venue_usage[updated_time_venue_key] = part
                
                validated_sessions.append(session)
            
            return validated_sessions
            
        except Exception as e:
            # 制約チェックに失敗した場合は、元のセッションをそのまま返す
            return sessions
    
    def _adjust_session_time(self, session: Dict, time_venue_usage: Dict) -> Dict:
        """
        セッションの時間を調整して制約違反を回避
        
        Args:
            session: 調整対象のセッション
            time_venue_usage: 時間・会場使用状況
            
        Returns:
            時間が調整されたセッション
        """
        try:
            # 利用可能な時間スロット（コマの時間）
            available_times = [
                "09:00-10:30",  # 1限
                "10:45-12:15",  # 2限
                "13:15-14:45",  # 3限
                "15:00-16:30",  # 4限
                "16:45-18:15"   # 5限
            ]
            
            venue = session.get("venue", "")
            
            # 空いている時間スロットを探す
            for time_slot in available_times:
                time_venue_key = f"{time_slot}_{venue}"
                if time_venue_key not in time_venue_usage:
                    # 空いている時間スロットが見つかった
                    session["time"] = time_slot
                    break
            
            return session
            
        except Exception:
            # 調整に失敗した場合は元のセッションを返す
            return session
    
    async def _apply_request_data_to_env(self, base_env, request):
        """受け取ったデータを環境に適用"""
        try:
            # 制約条件を環境に設定
            if hasattr(request, 'constraints') and request.constraints:
                constraints = request.constraints
                # 制約を環境に適用
                if hasattr(base_env, 'constraints'):
                    base_env.constraints = constraints
                else:
                    # 制約属性を動的に追加
                    base_env.constraints = constraints
            
            # メンバー情報を環境に適用
            if hasattr(base_env, 'people_scene_participation'):
                # メンバー数を設定
                base_env.num_people = len(request.members)
                base_env.max_people = max(base_env.max_people, len(request.members))
                
                # 参加場面と優先度を設定
                for person_idx, member in enumerate(request.members):
                    # 参加場面を設定（簡易版：全場面に参加と仮定）
                    for scene_idx in range(min(base_env.num_scenes, len(request.members))):
                        if scene_idx < base_env.people_scene_participation.shape[1]:
                            base_env.people_scene_participation[person_idx, scene_idx] = 1
                            
                            # 優先度を設定（0-1範囲に正規化）
                            priority_normalized = (member.priority - 1) / 4.0  # 1-5 -> 0-1
                            if scene_idx < base_env.people_scene_priorities.shape[1]:
                                base_env.people_scene_priorities[person_idx, scene_idx] = priority_normalized
            
            # パート名を設定
            if hasattr(base_env, 'part_info'):
                part_names = [member.part for member in request.members]
                base_env.part_info = {'part_names': part_names}
                
        except Exception as e:
            print(f"データ適用エラー: {e}")
    
    def _get_people_assignments(self, base_env, schedule):
        """人物の割り当て情報を取得（visualize_assignments.pyを参考）"""
        people_assignments = {}
        
        if not hasattr(base_env, 'people_scene_participation'):
            return people_assignments
        
        num_timeslots, num_scenes, num_rooms = schedule.shape
        
        for t in range(num_timeslots):
            assigned_people = set()
            
            # 通常の部屋への割り当てを処理
            for s in range(num_scenes):
                for r in range(num_rooms):
                    if schedule[t, s, r] == 1 and s < base_env.num_scenes:
                        # この場面に参加する人物を取得
                        participating_people = []
                        for person_idx in range(base_env.num_people):
                            if (person_idx < base_env.people_scene_participation.shape[0] and 
                                s < base_env.people_scene_participation.shape[1] and
                                base_env.people_scene_participation[person_idx, s] == 1):
                                participating_people.append(person_idx)
                                assigned_people.add(person_idx)
                        
                        if participating_people:
                            key = f't{t}_r{r}_s{s}'
                            people_assignments[key] = participating_people
            
            # 未割り当ての人物を自主部屋に配置
            unassigned_people = []
            for person_idx in range(base_env.num_people):
                if person_idx not in assigned_people:
                    unassigned_people.append(person_idx)
            
            if unassigned_people:
                key = f't{t}_r-1_s-1'
                people_assignments[key] = unassigned_people
        
        return people_assignments
    
    def _convert_schedule_to_sessions(self, schedule, base_env, people_assignments):
        """スケジュールをセッション形式に変換"""
        sessions = []
        num_timeslots, num_scenes, num_rooms = schedule.shape
        
        # パート名を取得
        part_names = []
        if hasattr(base_env, 'part_info') and 'part_names' in base_env.part_info:
            part_names = base_env.part_info['part_names']
        else:
            part_names = [f'パート{i}' for i in range(num_scenes)]
        
        for t in range(num_timeslots):
            for s in range(num_scenes):
                for r in range(num_rooms):
                    if schedule[t, s, r] == 1:
                        # 参加メンバーを取得
                        key = f't{t}_r{r}_s{s}'
                        members = people_assignments.get(key, [])
                        
                        session = {
                            "date": f"2024-01-{t+1:02d}",  # 簡易的な日付
                            "time": f"{9+t*2:02d}:00-{11+t*2:02d}:00",  # 簡易的な時間
                            "venue": f"会場{r}",
                            "members": [str(m) for m in members],
                            "part": part_names[s] if s < len(part_names) else f'パート{s}'
                        }
                        sessions.append(session)
        
        return sessions
    
    def _generate_member_assignments(self, people_assignments):
        """メンバー割り当て情報を生成"""
        member_assignments = {}
        
        for key, people in people_assignments.items():
            for person_id in people:
                if str(person_id) not in member_assignments:
                    member_assignments[str(person_id)] = []
                member_assignments[str(person_id)].append(key)
        
        return member_assignments
    
    def _calculate_reward(self, base_env, schedule):
        """報酬を計算"""
        try:
            # 完了率を計算
            total_assignments = schedule.sum()
            max_possible = min(base_env.num_scenes * base_env.num_timeslots, 
                             base_env.num_rooms * base_env.num_timeslots)
            completion_rate = total_assignments / max_possible if max_possible > 0 else 0
            
            # 簡易的な報酬計算
            reward = completion_rate * 100  # 完了率を100倍して報酬とする
            
            return reward
        except Exception:
            return 0.0
    
    async def train(self, config: Optional[Dict[str, Any]] = None):
        """強化学習モデルの学習"""
        try:
            await self._load_model()
            
            # 学習設定
            training_config = config or {}
            max_steps = training_config.get("max_steps", settings.REINFORCEMENT_LEARNING["max_steps"])
            
            # 学習実行
            result = await self.trainer.train(
                self.env,
                max_steps=max_steps,
                config=training_config
            )
            
            return result
            
        except Exception as e:
            raise TrainingException(f"モデル学習に失敗しました: {str(e)}")
    
    async def get_model_status(self) -> Dict[str, Any]:
        """モデル状態を取得"""
        try:
            await self._load_model()
            
            return {
                "status": "loaded" if self.model_loaded else "not_loaded",
                "model_path": settings.MODELS["scene_based_system"]["model_path"],
                "version": settings.MODELS["scene_based_system"]["version"],
                "metrics": {
                    "model_loaded": self.model_loaded,
                    "environment_ready": self.env is not None,
                    "trainer_ready": self.trainer is not None
                }
            }
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "metrics": {
                    "model_loaded": False,
                    "environment_ready": False,
                    "trainer_ready": False
                }
            }
    
    async def visualize_assignments(self, schedule_id: str, visualization_types: List[str]) -> Dict[str, Any]:
        """割り当て結果の可視化"""
        try:
            from utils.visualization import AssignmentVisualizer
            
            visualizer = AssignmentVisualizer()
            output_path = settings.VISUALIZATION["output_path"]
            
            # 可視化の実行
            urls = {}
            for viz_type in visualization_types:
                if viz_type == "heatmap":
                    url = await visualizer.create_heatmap(schedule_id, output_path)
                    urls["heatmap"] = url
                elif viz_type == "timeline":
                    url = await visualizer.create_timeline(schedule_id, output_path)
                    urls["timeline"] = url
                elif viz_type == "assignments":
                    url = await visualizer.create_assignments(schedule_id, output_path)
                    urls["assignments"] = url
            
            return {"urls": urls}
            
        except Exception as e:
            raise Exception(f"可視化に失敗しました: {str(e)}")
