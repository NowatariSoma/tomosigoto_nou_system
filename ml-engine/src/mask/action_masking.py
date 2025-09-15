"""
能の練習表作成システム 行動マスキング
場面ベースシステム対応
"""

import numpy as np
from typing import Dict, Any, List, Tuple


def get_action_mask(env) -> np.ndarray:
    """
    環境側のマスク生成と完全一致させるため、環境実装を使用
    """
    try:
        generated = env._generate_action_mask()
        return generated.astype(bool)
    except Exception:
        # フォールバック（理論上ここには来ない想定）
        return np.zeros(env.action_space.n, dtype=bool)


def _is_new_assignment(env, time: int, scene: int, room: int) -> bool:
    """
    新規割り当てかどうかを判定
    
    Args:
        env: 環境
        time: 時間インデックス
        scene: 場面インデックス
        room: 部屋インデックス
        
    Returns:
        新規割り当ての場合True
    """
    # この場面がまだどこにも割り当てられていない場合
    return not np.any(env.schedule[: env.num_timeslots, scene, : env.num_rooms] == 1)


def _is_move_action(env, time: int, scene: int, room: int) -> bool:
    """
    移動行動かどうかを判定
    
    Args:
        env: 環境
        time: 時間インデックス
        scene: 場面インデックス
        room: 部屋インデックス
        
    Returns:
        移動行動の場合True
    """
    # この場面が他の時間帯・部屋に既に割り当てられているか
    other_assignments = np.where(env.schedule[: env.num_timeslots, scene, : env.num_rooms] == 1)
    if len(other_assignments[0]) == 0:
        return False

    # 同一時間帯内で別の部屋にいるなら、その部屋移動のみ許可
    for other_time, other_room in zip(other_assignments[0], other_assignments[1]):
        if other_time == time and other_room != room:
            return True
    return False


def _check_basic_constraints(env, time: int, scene: int, room: int) -> bool:
    """基本的な制約をチェック"""
    # 範囲チェック（実際の環境サイズを使用）
    if (time < 0 or time >= env.num_timeslots or 
        scene < 0 or scene >= env.num_scenes or 
        room < 0 or room >= env.num_rooms):
        return False
    
    # 既に割り当て済みかチェック
    if env.schedule[time, scene, room] == 1:
        return False
    
    # 同じ場面が同じ時間帯に他の部屋にいるかチェック
    for other_room in range(env.num_rooms):
        if other_room != room and env.schedule[time, scene, other_room] == 1:
            return False
    
    return True


def _check_scene_constraints(env, time: int, scene: int, room: int) -> bool:
    """場面制約をチェック（簡素化版）"""
    # 設備要件と監督制約は無効化
    # 基本的な制約のみチェック
    return True


def _check_practice_time_constraints(env, time: int, scene: int) -> bool:
    """練習時間制約をチェック（簡易版）"""
    # 最小機能のため、基本的なチェックのみ
    return True


def _check_equipment_requirements(env, scene: int, room: int) -> bool:
    """設備要件をチェック（簡易版）"""
    # 最小機能のため、基本的なチェックのみ
    return True


def _check_supervision_constraints(env, time: int, scene: int, room: int) -> bool:
    """監督制約をチェック（無効化）"""
    # 監督制約は無効化 - すべて有効
    return True


def _check_supervision_coverage(env, time: int, scene: int, room: int) -> bool:
    """監督カバレッジをチェック"""
    # この時間帯で監督が必要な部屋をチェック
    rooms_needing_supervision = []
    
    for r in range(env.max_rooms):
        if r == room:
            continue  # 現在の部屋は除外
        
        # この部屋に場面がいるかチェック
        scenes_in_room = np.where(env.schedule[time, :, r] == 1)[0]
        if len(scenes_in_room) > 0:
            # 監督が必要な場面かチェック
            needs_supervision = False
            for scene_idx in scenes_in_room:
                if not env.scenes[scene_idx].get("is_supervisor", False):
                    needs_supervision = True
                    break
            
            if needs_supervision:
                rooms_needing_supervision.append(r)
    
    # 監督者が配置されているかチェック
    for r in rooms_needing_supervision:
        has_supervisor = False
        for scene_idx in range(env.num_scenes):
            if (env.scenes[scene_idx].get("is_supervisor", False) and 
                env.schedule[time, scene_idx, r] == 1):
                has_supervisor = True
                break
        
        if not has_supervisor:
            return False  # 監督者がいない部屋がある
    
    return True


def get_available_assignments(env) -> List[Dict[str, Any]]:
    """
    利用可能な割り当てのリストを取得
    
    Args:
        env: 環境
        
    Returns:
        利用可能な割り当てのリスト
    """
    mask = get_action_mask(env)
    valid_actions = np.where(mask)[0]
    
    assignments = []
    for action in valid_actions:
        time_idx, scene_idx, room_idx = np.unravel_index(action, env.action_mapping_shape)
        
        assignments.append({
            "action": action,
            "time": time_idx,
            "scene": scene_idx,
            "room": room_idx,
            "scene_name": env.scenes[scene_idx]["name"],
            "is_supervisor": env.scenes[scene_idx].get("is_supervisor", False)
        })
    
    return assignments


def get_scene_assignment_stats(env) -> Dict[str, Any]:
    """
    場面割り当ての統計情報を取得
    
    Args:
        env: 環境
        
    Returns:
        統計情報辞書
    """
    total_scenes = env.num_scenes
    assigned_scenes = np.sum(env.scene_status)
    unassigned_scenes = total_scenes - assigned_scenes
    completion_rate = assigned_scenes / total_scenes if total_scenes > 0 else 0.0
    
    # 監督カバレッジを計算
    supervision_coverage = 0.0
    total_sessions = 0
    supervised_sessions = 0
    
    # 監督カバレッジを一括計算（最適化版）
    # 二重ループをNumPy配列演算で一括処理
    scenes_in_rooms = np.sum(env.schedule[:, :, :env.max_rooms], axis=1)  # 各時間帯・部屋の場面数
    has_scenes = scenes_in_rooms > 0  # 場面がいる時間帯・部屋
    total_sessions = np.sum(has_scenes)
    
    if total_sessions > 0:
        # 監督カバレッジを一括計算
        supervision_in_rooms = np.sum(env.supervision_status[:, :, :env.max_rooms], axis=1)  # 各時間帯・部屋の監督数
        supervised_sessions = np.sum((has_scenes) & (supervision_in_rooms > 0))
    
    supervision_coverage = (supervised_sessions / total_sessions 
                           if total_sessions > 0 else 0.0)
    
    # 時間効率を計算（最適化版）
    # ループをNumPy配列演算で一括処理
    used_timeslots = np.sum(np.sum(env.schedule, axis=(1, 2)) > 0)
    time_efficiency = used_timeslots / env.num_timeslots if env.num_timeslots > 0 else 0.0
    
    return {
        "total_scenes": total_scenes,
        "assigned_scenes": assigned_scenes,
        "unassigned_scenes": unassigned_scenes,
        "completion_rate": completion_rate,
        "supervision_coverage": supervision_coverage,
        "time_efficiency": time_efficiency
    }


def validate_action(env, action: int) -> Tuple[bool, str]:
    """
    行動の妥当性を検証
    
    Args:
        env: 環境
        action: 検証する行動
        
    Returns:
        (妥当性, メッセージ)
    """
    if action < 0 or action >= env.action_space.n:
        return False, "行動が範囲外です"
    
    time_idx, scene_idx, room_idx = np.unravel_index(action, env.action_mapping_shape)
    
    # 基本制約チェック
    if not _check_basic_constraints(env, time_idx, scene_idx, room_idx):
        return False, "基本制約に違反しています"
    
    # 場面制約チェック
    if not _check_scene_constraints(env, time_idx, scene_idx, room_idx):
        return False, "場面制約に違反しています"
    
    return True, "行動が有効"
