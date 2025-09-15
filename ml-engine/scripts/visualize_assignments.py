#!/usr/bin/env python3
"""
練習表の割り当て結果を可視化するスクリプト
ヒートマップや時間表形式で練習スケジュールを画像化
python scripts/visualize_assignments.py --model result/scene_based_training_final_model.zip
みたいにすると練習表の割り当て結果を可視化できる
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.gridspec import GridSpec
from stable_baselines3 import PPO
from src.environment.environment import PracticeScheduleEnv
import pandas as pd
from datetime import datetime
import japanize_matplotlib  # 日本語表示用
import warnings
warnings.filterwarnings('ignore')

# カラーパレット（日本語対応）
PART_COLORS = {
    'シテ': '#FF6B6B',      # 赤系
    'ワキ': '#4ECDC4',      # 青緑系
    '地謡': '#45B7D1',      # 青系
    '笛': '#96CEB4',        # 緑系
    '小鼓': '#FFEAA7',      # 黄系
    '大鼓': '#FFA07A',      # 薄橙系
    '太鼓': '#DDA0DD',      # 紫系
    '舞囃子': '#87CEEB',    # スカイブルー
    '謡': '#FFB6C1',        # ピンク系
    '仕舞': '#98D8C8',      # ミント系
    '囃子': '#F7DC6F',      # 黄金系
    '地拍子': '#BB8FCE',    # 薄紫系
    '空室': '#F0F0F0'       # グレー
}

# 場面名の英語マッピング（互換性のため）
PART_NAME_MAPPING = {
    'Utai': '謡',
    'Mai': '舞',
    'Kotsuzumi': '小鼓',
    'Otsuzumi': '大鼓',
    'Taiko': '太鼓',
    'Fue': '笛'
}

def get_people_assignments(base_env, schedule):
    """
    人物の割り当て情報を取得（未割り当て者は自主部屋に配置）
    
    Args:
        base_env: 環境オブジェクト
        schedule: スケジュール配列 (time, scene, room)
    
    Returns:
        dict: 人物割り当て情報
    """
    people_assignments = {}
    
    if not hasattr(base_env, 'people_scene_participation'):
        return people_assignments
    
    num_timeslots, num_scenes, num_rooms = schedule.shape
    
    for t in range(num_timeslots):
        # この時間帯に割り当てられた人物を追跡
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
            # 自主部屋（部屋番号を-1として表現）
            key = f't{t}_r-1_s-1'  # 自主部屋のキー
            people_assignments[key] = unassigned_people
    
    return people_assignments

def create_people_assignment_visualization(schedule, part_names=None, people_assignments=None, base_env=None):
    """
    人物割り当ての詳細可視化を作成
    
    Args:
        schedule: 3次元配列 (time, scene, room)
        part_names: 場面名のリスト
        people_assignments: 人の割り当て情報（辞書形式）
        base_env: 環境オブジェクト
    
    Returns:
        matplotlib figure
    """
    if part_names is None:
        part_names = ['謡', '舞', '小鼓', '大鼓', '太鼓', '笛']
    
    num_timeslots, num_scenes, num_rooms = schedule.shape
    
    # 図のサイズを調整（人物情報表示のため大きく）
    fig = plt.figure(figsize=(20, 16))
    gs = GridSpec(4, 2, figure=fig, hspace=0.3, wspace=0.2)
    
    # 1. 時間帯別の部屋使用状況（人物数表示付き）
    ax1 = fig.add_subplot(gs[0, :])
    room_usage = np.zeros((num_timeslots, num_rooms))
    room_colors = np.zeros((num_timeslots, num_rooms, 3))
    
    for t in range(num_timeslots):
        for r in range(num_rooms):
            assigned_scenes = []
            total_people = 0
            for s in range(num_scenes):
                if schedule[t, s, r] == 1:
                    assigned_scenes.append(s)
                    # 人物数を取得
                    key = f't{t}_r{r}_s{s}'
                    if people_assignments and key in people_assignments:
                        total_people += len(people_assignments[key])
            
            if assigned_scenes:
                # 最初の場面の色を使用
                scene_idx = assigned_scenes[0]
                if scene_idx < len(part_names):
                    color = PART_COLORS.get(part_names[scene_idx], '#808080')
                    # HEXからRGBに変換
                    color_rgb = [int(color[i:i+2], 16)/255.0 for i in (1, 3, 5)]
                    room_colors[t, r] = color_rgb
                room_usage[t, r] = total_people  # 人物数を使用
            else:
                # 空室の色
                room_colors[t, r] = [0.94, 0.94, 0.94]
    
    im1 = ax1.imshow(room_colors, aspect='auto')
    ax1.set_xlabel('部屋', fontsize=12)
    ax1.set_ylabel('時間帯', fontsize=12)
    ax1.set_title('時間帯別の部屋使用状況（人物数表示）', fontsize=14, fontweight='bold')
    ax1.set_xticks(range(num_rooms))
    ax1.set_yticks(range(num_timeslots))
    ax1.set_xticklabels([f'部屋{i}' for i in range(num_rooms)])
    ax1.set_yticklabels([f'時間{i}' for i in range(num_timeslots)])
    
    # 各セルに人物数を表示
    for t in range(num_timeslots):
        for r in range(num_rooms):
            if room_usage[t, r] > 0:
                ax1.text(r, t, f'{int(room_usage[t, r])}名', 
                        ha='center', va='center', color='white', fontweight='bold', fontsize=10)
    
    # 2. 人物別参加場面数
    ax2 = fig.add_subplot(gs[1, 0])
    if people_assignments:
        person_participation = {}
        for key, people in people_assignments.items():
            for person_id in people:
                if person_id not in person_participation:
                    person_participation[person_id] = 0
                person_participation[person_id] += 1
        
        if person_participation:
            person_ids = sorted(person_participation.keys())
            participation_counts = [person_participation[pid] for pid in person_ids]
            
            bars = ax2.bar(range(len(person_ids)), participation_counts, color='steelblue')
            ax2.set_xlabel('人物ID', fontsize=12)
            ax2.set_ylabel('参加場面数', fontsize=12)
            ax2.set_title('人物別参加場面数', fontsize=14, fontweight='bold')
            ax2.set_xticks(range(len(person_ids)))
            ax2.set_xticklabels([f'人物{pid}' for pid in person_ids], rotation=45)
            
            # 値を表示
            for i, bar in enumerate(bars):
                height = bar.get_height()
                if height > 0:
                    ax2.text(bar.get_x() + bar.get_width()/2., height,
                            f'{int(height)}', ha='center', va='bottom')
        else:
            ax2.text(0.5, 0.5, '人物割り当て情報なし', ha='center', va='center', transform=ax2.transAxes)
            ax2.set_title('人物別参加場面数', fontsize=14, fontweight='bold')
    else:
        ax2.text(0.5, 0.5, '人物割り当て情報なし', ha='center', va='center', transform=ax2.transAxes)
        ax2.set_title('人物別参加場面数', fontsize=14, fontweight='bold')
    
    # 3. 場面別参加人数
    ax3 = fig.add_subplot(gs[1, 1])
    scene_people_counts = np.zeros(num_scenes)
    for t in range(num_timeslots):
        for s in range(num_scenes):
            for r in range(num_rooms):
                if schedule[t, s, r] == 1:
                    key = f't{t}_r{r}_s{s}'
                    if people_assignments and key in people_assignments:
                        scene_people_counts[s] += len(people_assignments[key])
    
    bars = ax3.bar(range(min(num_scenes, len(part_names))), 
                   scene_people_counts[:len(part_names)],
                   color=[PART_COLORS.get(name, '#808080') for name in part_names[:num_scenes]])
    ax3.set_xlabel('場面（パート）', fontsize=12)
    ax3.set_ylabel('参加人数', fontsize=12)
    ax3.set_title('場面別参加人数', fontsize=14, fontweight='bold')
    ax3.set_xticks(range(min(num_scenes, len(part_names))))
    ax3.set_xticklabels(part_names[:num_scenes], rotation=45, ha='right')
    
    # 値を表示
    for i, bar in enumerate(bars):
        height = bar.get_height()
        if height > 0:
            ax3.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}', ha='center', va='bottom')
    
    # 4. 詳細な人物割り当て表
    ax4 = fig.add_subplot(gs[2:, :])
    ax4.axis('tight')
    ax4.axis('off')
    
    # テーブルデータの作成（人物情報を含む）
    table_data = []
    for t in range(num_timeslots):
        row = [f'時間{t}']
        for r in range(num_rooms):
            cell_info = []
            people_info = []
            for s in range(num_scenes):
                if schedule[t, s, r] == 1 and s < len(part_names):
                    scene_info = part_names[s]
                    # 人物情報を取得
                    key = f't{t}_r{r}_s{s}'
                    if people_assignments and key in people_assignments:
                        people = people_assignments[key]
                        # 人物IDを7人ごとに改行して表示
                        people_strs = []
                        for i in range(0, len(people), 7):
                            chunk = people[i:i+7]
                            people_strs.append(','.join(map(str, chunk)))
                        people_display = '\n'.join(people_strs)
                        people_info.append(f'{len(people)}名:\n{people_display}')
                    cell_info.append(scene_info)
            
            if cell_info:
                if people_info:
                    row.append('\n'.join(cell_info) + '\n' + '\n'.join(people_info))
                else:
                    row.append('\n'.join(cell_info))
            else:
                row.append('空室')
        
        # 自主部屋の情報を追加
        autonomous_key = f't{t}_r-1_s-1'
        if people_assignments and autonomous_key in people_assignments:
            autonomous_people = people_assignments[autonomous_key]
            if autonomous_people:
                # 人物IDを7人ごとに改行して表示
                people_strs = []
                for i in range(0, len(autonomous_people), 7):
                    chunk = autonomous_people[i:i+7]
                    people_strs.append(','.join(map(str, chunk)))
                people_display = '\n'.join(people_strs)
                row.append(f'自主部屋\n{len(autonomous_people)}名:\n{people_display}')
            else:
                row.append('自主部屋\n(空)')
        else:
            row.append('自主部屋\n(空)')
        
        table_data.append(row)
    
    # テーブルのカラム名
    columns = ['時間'] + [f'部屋{i}' for i in range(num_rooms)] + ['自主部屋']
    
    # テーブルの作成（幅を調整）
    col_widths = [0.08] + [0.85/num_rooms]*num_rooms + [0.07]  # 時間列、部屋列、自主部屋列の幅を調整
    table = ax4.table(cellText=table_data, colLabels=columns,
                     cellLoc='center', loc='center',
                     colWidths=col_widths)
    table.auto_set_font_size(False)
    table.set_fontsize(6)  # フォントサイズをさらに小さく
    table.scale(1, 3.0)  # 縦のスケールをさらに大きくして改行された人物IDを見やすく
    
    # ヘッダーの色設定
    for i in range(len(columns)):
        table[(0, i)].set_facecolor('#40466e')
        table[(0, i)].set_text_props(weight='bold', color='white')
    
    # セルの色設定
    for i in range(1, len(table_data) + 1):
        for j in range(len(columns)):
            if j == 0:  # Time列
                table[(i, j)].set_facecolor('#f1f1f2')
                table[(i, j)].set_text_props(weight='bold')
            elif j == len(columns) - 1:  # 自主部屋列
                if '自主部屋' in table_data[i-1][j] and '(空)' not in table_data[i-1][j]:
                    table[(i, j)].set_facecolor('#fff2cc')  # 薄い黄色
                else:
                    table[(i, j)].set_facecolor('#f8f8f8')  # 薄いグレー
            else:  # 通常の部屋列
                if table_data[i-1][j] != '空室':
                    table[(i, j)].set_facecolor('#e6f3ff')
    
    ax4.set_title('詳細な人物割り当てスケジュール', fontsize=14, fontweight='bold', pad=20)
    
    # 凡例の作成（日本語パート名）
    legend_elements = []
    for part_name in part_names[:num_scenes]:
        if part_name in PART_COLORS:
            legend_elements.append(mpatches.Patch(facecolor=PART_COLORS[part_name], 
                                                 label=part_name, edgecolor='black'))
    fig.legend(handles=legend_elements, loc='upper right', title='パート')
    
    plt.suptitle('人物割り当て可視化', fontsize=16, fontweight='bold', y=0.98)
    
    return fig

def create_schedule_heatmap(schedule, part_names=None, people_assignments=None):
    """
    スケジュールのヒートマップを作成
    
    Args:
        schedule: 3次元配列 (time, scene, room)
        part_names: 場面名のリスト
        people_assignments: 人の割り当て情報（辞書形式）
    
    Returns:
        matplotlib figure
    """
    if part_names is None:
        part_names = ['謡', '舞', '小鼓', '大鼓', '太鼓', '笛']
    
    num_timeslots, num_scenes, num_rooms = schedule.shape
    
    # 図のサイズを調整
    fig = plt.figure(figsize=(14, 10))
    gs = GridSpec(3, 2, figure=fig, hspace=0.3, wspace=0.3)
    
    # 1. 時間帯別の部屋使用状況
    ax1 = fig.add_subplot(gs[0, :])
    room_usage = np.zeros((num_timeslots, num_rooms))
    room_colors = np.zeros((num_timeslots, num_rooms, 3))
    
    for t in range(num_timeslots):
        for r in range(num_rooms):
            assigned_scenes = []
            for s in range(num_scenes):
                if schedule[t, s, r] == 1:
                    assigned_scenes.append(s)
            
            if assigned_scenes:
                # 最初の場面の色を使用
                scene_idx = assigned_scenes[0]
                if scene_idx < len(part_names):
                    color = PART_COLORS.get(part_names[scene_idx], '#808080')
                    # HEXからRGBに変換
                    color_rgb = [int(color[i:i+2], 16)/255.0 for i in (1, 3, 5)]
                    room_colors[t, r] = color_rgb
                room_usage[t, r] = len(assigned_scenes)
            else:
                # 空室の色
                room_colors[t, r] = [0.94, 0.94, 0.94]
    
    im1 = ax1.imshow(room_colors, aspect='auto')
    ax1.set_xlabel('部屋', fontsize=12)
    ax1.set_ylabel('時間帯', fontsize=12)
    ax1.set_title('時間帯別の部屋使用状況', fontsize=14, fontweight='bold')
    ax1.set_xticks(range(num_rooms))
    ax1.set_yticks(range(num_timeslots))
    ax1.set_xticklabels([f'部屋{i}' for i in range(num_rooms)])
    ax1.set_yticklabels([f'時間{i}' for i in range(num_timeslots)])
    
    # 各セルに割り当て数を表示
    for t in range(num_timeslots):
        for r in range(num_rooms):
            if room_usage[t, r] > 0:
                ax1.text(r, t, f'{int(room_usage[t, r])}', 
                        ha='center', va='center', color='white', fontweight='bold')
    
    # 2. 場面別の完了状況
    ax2 = fig.add_subplot(gs[1, 0])
    scene_completion = np.sum(schedule, axis=(0, 2))  # 各場面の総割り当て回数
    bars = ax2.bar(range(min(num_scenes, len(part_names))), 
                   scene_completion[:len(part_names)],
                   color=[PART_COLORS.get(name, '#808080') for name in part_names[:num_scenes]])
    ax2.set_xlabel('場面（パート）', fontsize=12)
    ax2.set_ylabel('割り当て回数', fontsize=12)
    ax2.set_title('場面別の割り当て状況', fontsize=14, fontweight='bold')
    ax2.set_xticks(range(min(num_scenes, len(part_names))))
    ax2.set_xticklabels(part_names[:num_scenes], rotation=45, ha='right')
    
    # 値を表示
    for i, bar in enumerate(bars):
        height = bar.get_height()
        if height > 0:
            ax2.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}', ha='center', va='bottom')
    
    # 3. 部屋別の使用率
    ax3 = fig.add_subplot(gs[1, 1])
    room_utilization = np.sum(schedule, axis=(0, 1))  # 各部屋の総使用回数
    bars = ax3.bar(range(num_rooms), room_utilization, color='steelblue')
    ax3.set_xlabel('部屋', fontsize=12)
    ax3.set_ylabel('使用回数', fontsize=12)
    ax3.set_title('部屋別の使用率', fontsize=14, fontweight='bold')
    ax3.set_xticks(range(num_rooms))
    ax3.set_xticklabels([f'部屋{i}' for i in range(num_rooms)])
    
    # 値を表示
    for bar in bars:
        height = bar.get_height()
        if height > 0:
            ax3.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}', ha='center', va='bottom')
    
    # 4. 詳細な割り当て表
    ax4 = fig.add_subplot(gs[2, :])
    ax4.axis('tight')
    ax4.axis('off')
    
    # テーブルデータの作成（人物情報を含む）
    table_data = []
    for t in range(num_timeslots):
        row = [f'時間{t}']
        for r in range(num_rooms):
            cell_info = []
            for s in range(num_scenes):
                if schedule[t, s, r] == 1 and s < len(part_names):
                    scene_info = part_names[s]
                    # 人物情報があれば追加
                    if people_assignments and f't{t}_r{r}_s{s}' in people_assignments:
                        people = people_assignments[f't{t}_r{r}_s{s}']
                        scene_info += f'\n({len(people)}名)'
                    cell_info.append(scene_info)
            if cell_info:
                row.append('\n'.join(cell_info))
            else:
                row.append('空室')
        table_data.append(row)
    
    # テーブルのカラム名
    columns = ['時間'] + [f'部屋{i}' for i in range(num_rooms)]
    
    # テーブルの作成
    table = ax4.table(cellText=table_data, colLabels=columns,
                     cellLoc='center', loc='center',
                     colWidths=[0.1] + [0.9/num_rooms]*num_rooms)
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 1.5)
    
    # ヘッダーの色設定
    for i in range(len(columns)):
        table[(0, i)].set_facecolor('#40466e')
        table[(0, i)].set_text_props(weight='bold', color='white')
    
    # セルの色設定
    for i in range(1, len(table_data) + 1):
        for j in range(len(columns)):
            if j == 0:  # Time列
                table[(i, j)].set_facecolor('#f1f1f2')
                table[(i, j)].set_text_props(weight='bold')
            else:
                if table_data[i-1][j] != '-':
                    table[(i, j)].set_facecolor('#e6f3ff')
    
    ax4.set_title('詳細な割り当てスケジュール', fontsize=14, fontweight='bold', pad=20)
    
    # 凡例の作成（日本語パート名）
    legend_elements = []
    for part_name in part_names[:num_scenes]:
        if part_name in PART_COLORS:
            legend_elements.append(mpatches.Patch(facecolor=PART_COLORS[part_name], 
                                                 label=part_name, edgecolor='black'))
    fig.legend(handles=legend_elements, loc='upper right', title='パート')
    
    plt.suptitle('練習スケジュール可視化', fontsize=16, fontweight='bold', y=0.98)
    
    return fig

def create_timeline_view(schedule, part_names=None, people_assignments=None):
    """
    タイムライン形式の可視化
    
    Args:
        schedule: 3次元配列 (time, scene, room)
        part_names: 場面名のリスト
        people_assignments: 人の割り当て情報
    
    Returns:
        matplotlib figure
    """
    if part_names is None:
        part_names = ['謡', '舞', '小鼓', '大鼓', '太鼓', '笛']
    
    num_timeslots, num_scenes, num_rooms = schedule.shape
    
    fig, ax = plt.subplots(figsize=(14, 8))
    
    # Y軸の位置を計算
    y_positions = {}
    y_labels = []
    y_pos = 0
    
    for r in range(num_rooms):
        y_positions[r] = y_pos
        y_labels.append(f'部屋{r}')
        y_pos += 1
    
    # タイムラインの描画
    for t in range(num_timeslots):
        for r in range(num_rooms):
            for s in range(num_scenes):
                if schedule[t, s, r] == 1:
                    part_name = part_names[s] if s < len(part_names) else f'場面{s}'
                    color = PART_COLORS.get(part_name, '#808080')
                    
                    # 矩形を描画
                    rect = mpatches.Rectangle((t, y_positions[r] - 0.4), 0.8, 0.8,
                                            facecolor=color, edgecolor='black', linewidth=1)
                    ax.add_patch(rect)
                    
                    # パート名を表示
                    ax.text(t + 0.4, y_positions[r], part_name[:3],
                           ha='center', va='center', fontsize=8, fontweight='bold')
    
    # 軸の設定
    ax.set_xlim(-0.5, num_timeslots - 0.5)
    ax.set_ylim(-0.5, len(y_positions) - 0.5)
    ax.set_xlabel('時間帯', fontsize=12)
    ax.set_ylabel('部屋', fontsize=12)
    ax.set_title('練習スケジュール タイムライン', fontsize=14, fontweight='bold')
    
    # グリッドの追加
    ax.set_xticks(range(num_timeslots))
    ax.set_xticklabels([f'時間{i}' for i in range(num_timeslots)])
    ax.set_yticks(range(len(y_labels)))
    ax.set_yticklabels(y_labels)
    ax.grid(True, alpha=0.3, linestyle='--')
    # 凡例（日本語）
    legend_elements = []
    for part_name in part_names[:num_scenes]:
        if part_name in PART_COLORS:
            legend_elements.append(mpatches.Patch(facecolor=PART_COLORS[part_name], 
                                                 label=part_name, edgecolor='black'))
    ax.legend(handles=legend_elements, loc='upper right', title='パート')
    
    plt.tight_layout()
    return fig

def save_visualization(schedule, output_dir='outputs/visualizations', part_names=None, people_assignments=None, base_env=None):
    """
    複数の可視化を生成して保存
    
    Args:
        schedule: 3次元配列 (time, scene, room)
        output_dir: 出力ディレクトリ
        part_names: 場面名のリスト
        people_assignments: 人物割り当て情報
        base_env: 環境オブジェクト
    """
    # 出力ディレクトリの作成
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # ヒートマップの生成と保存
    fig1 = create_schedule_heatmap(schedule, part_names, people_assignments)
    fig1.savefig(os.path.join(output_dir, f'schedule_heatmap_{timestamp}.png'), 
                dpi=150, bbox_inches='tight')
    print(f"保存完了: schedule_heatmap_{timestamp}.png")
    
    # タイムラインビューの生成と保存
    fig2 = create_timeline_view(schedule, part_names, people_assignments)
    fig2.savefig(os.path.join(output_dir, f'schedule_timeline_{timestamp}.png'),
                dpi=150, bbox_inches='tight')
    print(f"保存完了: schedule_timeline_{timestamp}.png")
    
    # 人物割り当て詳細可視化の生成と保存
    fig3 = create_people_assignment_visualization(schedule, part_names, people_assignments, base_env)
    fig3.savefig(os.path.join(output_dir, f'people_assignment_{timestamp}.png'),
                dpi=150, bbox_inches='tight')
    print(f"保存完了: people_assignment_{timestamp}.png")
    
    plt.close('all')
    
    return output_dir


def load_and_visualize_model(model_path=None):
    """
    学習済みモデルを読み込んで割り当て結果を可視化
    
    Args:
        model_path: モデルファイルのパス
    """
    print("=== Assignment Visualization ===")
    
    # モデルの読み込み
    if model_path and os.path.exists(model_path):
        print(f"Loading model from: {model_path}")
        model = PPO.load(model_path)
    else:
        # デフォルトパスから探す
        model_paths = [
            "result/scene_based_system_final_model.zip",
            "models/scene_based_system/best/best_model.zip",
            "models/scene_based_system/last_model.zip"
        ]
        model = None
        for path in model_paths:
            if os.path.exists(path):
                print(f"Found model: {path}")
                model = PPO.load(path)
                break
        
        if model is None:
            print("No trained model found. Creating random assignment for demonstration.")
            model = None
    
    # 学習時と同じ環境設定の読み込み方法を使用
    from src.utils.utils import load_config
    
    # 環境設定と報酬設定を読み込み
    env_config = load_config('configs/environment/env.yaml')
    reward_config = load_config('configs/reward/reward.yaml')
    
    # 環境設定に報酬設定を統合（学習時と同じ）
    env_config['reward_config'] = reward_config
    
    # 学習時と同じ環境作成方法を使用
    from src.training.train import create_environment_with_dynamic_obs
    
    # 学習時と同じ環境を作成（マスキング有効）
    env = create_environment_with_dynamic_obs(env_config, use_masking=True)
    
    # Monitorで包まれている場合の環境属性アクセス
    if hasattr(env, 'env'):
        # Monitorで包まれている場合
        base_env = env.env
        if hasattr(base_env, 'env'):
            # MaskingWrapperで包まれている場合
            base_env = base_env.env
    else:
        base_env = env
    
    # パート名の取得（日本語化）
    if hasattr(base_env, 'part_info') and 'part_names' in base_env.part_info:
        part_names = base_env.part_info['part_names']
        # 英語名の場合は日本語に変換
        part_names = [PART_NAME_MAPPING.get(name, name) for name in part_names]
    else:
        part_names = list(PART_COLORS.keys())[:-1]  # 空室を除く
    
    # 割り当ての実行
    obs, _ = env.reset()
    done = False
    steps = 0
    # 学習時と同じ最大ステップ数を使用
    max_steps = env_config.get('max_steps', 40)
    
    print(f"環境設定: 時間帯{base_env.num_timeslots}, 場面{base_env.num_scenes}, 部屋{base_env.num_rooms}")
    
    while not done and steps < max_steps:
        if model is not None:
            # 学習時と同じ方法でモデルを使用
            # MaskingWrapperが自動的にaction_maskを観測に追加
            action, _ = model.predict(obs, deterministic=True)
        else:
            # ランダムアクション（デモ用）
            action = env.action_space.sample()
        
        obs, _, done, _, _ = env.step(action)
        steps += 1
        
        if done:
            print(f"エピソード完了（{steps}ステップ）")
            break
    
    # 最終的なスケジュールを取得（実サイズにトリミング）
    schedule = base_env.schedule[:base_env.num_timeslots, :base_env.num_scenes, :base_env.num_rooms].copy()
    
    # 人物割り当て情報を取得
    people_assignments = get_people_assignments(base_env, schedule)
    print(f"人物割り当て情報: {len(people_assignments)}件の割り当て")
    
    # 完了率の計算
    try:
        completion_rate = base_env.get_assignment_status()['actual_completion_rate']
        print(f"最終完了率: {completion_rate:.2%}")
    except Exception:
        # エラーが出た場合は手動で計算
        total_assignments = np.sum(schedule)
        max_possible = min(base_env.num_scenes * base_env.num_timeslots, base_env.num_rooms * base_env.num_timeslots)
        completion_rate = total_assignments / max_possible if max_possible > 0 else 0
        print(f"最終完了率（推定）: {completion_rate:.2%}")
    
    # 可視化の生成と保存（人物情報を含む）
    output_dir = save_visualization(schedule, part_names=part_names, people_assignments=people_assignments, base_env=base_env)
    print(f"可視化ファイル保存先: {output_dir}")
    
    # 人物割り当て情報をJSONファイルとして保存
    import json
    assignment_output_dir = 'outputs/assignments'
    os.makedirs(assignment_output_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # 人物割り当て情報を整理
    assignment_data = {
        'timestamp': timestamp,
        'environment_info': {
            'num_timeslots': base_env.num_timeslots,
            'num_scenes': base_env.num_scenes,
            'num_rooms': base_env.num_rooms,
            'num_people': base_env.num_people
        },
        'part_names': part_names,
        'people_assignments': people_assignments,
        'schedule': schedule.tolist()  # NumPy配列をリストに変換
    }
    
    assignment_file = os.path.join(assignment_output_dir, f'assignment_{timestamp}.json')
    with open(assignment_file, 'w', encoding='utf-8') as f:
        json.dump(assignment_data, f, ensure_ascii=False, indent=2)
    print(f"人物割り当て情報保存完了: {assignment_file}")
    
    # 報酬情報の表示
    print("\n=== 報酬統計 ===")
    try:
        reward_info = base_env.get_episode_reward_info()
        print(f"総報酬: {reward_info['total_reward']:.2f}")
        print(f"平均報酬: {reward_info['average_reward']:.2f}")
        print(f"最小報酬: {reward_info['min_reward']:.2f}")
        print(f"最大報酬: {reward_info['max_reward']:.2f}")
        print(f"ステップ数: {reward_info['num_steps']}")
        
        # 報酬の分布を表示
        if reward_info['step_rewards']:
            positive_rewards = sum(1 for r in reward_info['step_rewards'] if r > 0)
            negative_rewards = sum(1 for r in reward_info['step_rewards'] if r < 0)
            zero_rewards = sum(1 for r in reward_info['step_rewards'] if r == 0)
            print(f"正の報酬: {positive_rewards}ステップ")
            print(f"負の報酬: {negative_rewards}ステップ")
            print(f"ゼロ報酬: {zero_rewards}ステップ")
    except Exception as e:
        print(f"報酬情報の取得でエラー: {e}")
    
    # 統計情報の表示
    print("\n=== 割り当て統計 ===")
    total_assignments = np.sum(schedule)
    print(f"総割り当て数: {int(total_assignments)}")
    
    for i, name in enumerate(part_names[:base_env.num_scenes]):
        scene_count = np.sum(schedule[:, i, :])
        if scene_count > 0:
            print(f"{name}: {int(scene_count)}回割り当て")
    
    # 人物割り当て統計の表示
    print("\n=== 人物割り当て統計 ===")
    if people_assignments:
        # 各時間帯・部屋での人物数
        for key, people in people_assignments.items():
            t, r, s = key.split('_')
            t = int(t[1:])  # 't0' -> 0
            r = int(r[1:])  # 'r0' -> 0
            s = int(s[1:])  # 's0' -> 0
            
            if r == -1 and s == -1:  # 自主部屋
                print(f"時間{t} 自主部屋: {len(people)}名参加 (人物ID: {people})")
            else:
                scene_name = part_names[s] if s < len(part_names) else f'場面{s}'
                print(f"時間{t} 部屋{r} {scene_name}: {len(people)}名参加 (人物ID: {people})")
        
        # 人物別の参加場面数（自主部屋は除外）
        person_participation = {}
        for key, people in people_assignments.items():
            t, r, s = key.split('_')
            r = int(r[1:])
            s = int(s[1:])
            if r != -1 and s != -1:  # 自主部屋は除外
                for person_id in people:
                    if person_id not in person_participation:
                        person_participation[person_id] = 0
                    person_participation[person_id] += 1
        
        print(f"\n人物別参加場面数（自主部屋除く）:")
        for person_id in sorted(person_participation.keys()):
            print(f"人物{person_id}: {person_participation[person_id]}場面参加")
        
        # 自主部屋の統計
        autonomous_people = set()
        for key, people in people_assignments.items():
            t, r, s = key.split('_')
            r = int(r[1:])
            s = int(s[1:])
            if r == -1 and s == -1:  # 自主部屋
                autonomous_people.update(people)
        
        if autonomous_people:
            print(f"\n自主部屋利用者: {len(autonomous_people)}名 (人物ID: {sorted(autonomous_people)})")
        else:
            print(f"\n自主部屋利用者: 0名")
    else:
        print("人物割り当て情報がありません")
    
    return schedule

def main():
    """メイン実行関数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='練習スケジュール割り当ての可視化')
    parser.add_argument('--model', type=str, default=None, help='学習済みモデルのパス')
    parser.add_argument('--random', action='store_true', help='ランダム割り当てでデモ実行')
    args = parser.parse_args()
    
    if args.random:
        # ランダムなスケジュールでデモ
        print("ランダムスケジュールを生成してデモンストレーション...")
        schedule = np.random.randint(0, 2, size=(4, 20, 10))
        # 制約を満たすように調整
        for t in range(4):
            for s in range(20):
                # 各場面は1つの部屋にのみ割り当て
                rooms = np.where(schedule[t, s, :] == 1)[0]
                if len(rooms) > 1:
                    schedule[t, s, rooms[1:]] = 0
        
        part_names = ['シテ', 'ワキ', '地謡', '笛', '小鼓', '大鼓', '太鼓', '舞囃子', '謡', '仕舞', 
                     '囃子', '地拍子', '一調', '二調', '三調', '四調', '五調', '六調', '七調', '八調']
        
        save_visualization(schedule, part_names=part_names)
    else:
        # モデルを使用
        load_and_visualize_model(args.model)
    
    print("\n可視化完了！")

if __name__ == "__main__":
    main()
