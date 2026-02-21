import os
import json
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from pydantic import BaseModel

class TagSuggestion(BaseModel):
    """タグ提案のレスポンス構造"""
    category: str
    tag: str
    confidence: float

class GeminiTaggingClient:
    """Gemini APIを使用した自動タグ生成クライアント"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        
        # Function calling用のツール定義
        self.tag_suggestion_function = {
            "function_declarations": [
                {
                    "name": "suggest_tags",
                    "description": "能楽動画のタイトルから適切なタグを提案する",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "suggestions": {
                                "type": "array",
                                "description": "提案されたタグのリスト",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "category": {
                                            "type": "string",
                                            "enum": ["回生", "先生", "演目"],
                                            "description": "タグのカテゴリ"
                                        },
                                        "tag": {
                                            "type": "string",
                                            "description": "タグの値"
                                        },
                                        "confidence": {
                                            "type": "number",
                                            "minimum": 0.0,
                                            "maximum": 1.0,
                                            "description": "推定の信頼度（0.0-1.0）"
                                        }
                                    },
                                    "required": ["category", "tag", "confidence"]
                                }
                            }
                        },
                        "required": ["suggestions"]
                    }
                }
            ]
        }
        
        # モデルを初期化
        self.model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            tools=[self.tag_suggestion_function]
        )
    
    async def suggest_tags(self, video_title: str, video_description: str = "") -> List[TagSuggestion]:
        """
        動画タイトルと説明からタグを提案
        
        Args:
            video_title: 動画のタイトル
            video_description: 動画の説明（オプション）
            
        Returns:
            List[TagSuggestion]: 提案されたタグのリスト
        """
        
        prompt = f"""
能楽部の動画管理システムのために、動画タイトルから適切なタグを提案してください。

動画タイトル: {video_title}
{f'動画説明: {video_description}' if video_description else ''}

以下のタグカテゴリから適切なタグを選択してください：

**回生カテゴリ**:
- 1回生: 1年生が舞う動画
- 2回生: 2年生が舞う動画  
- 3回生: 3年生が舞う動画
- 4回生: 4年生が舞う動画

**先生カテゴリ**:
- 先生: 先生が舞っている動画
- 学生: 学生のみが舞っている動画

**演目カテゴリ**:
- 弓八幡: 弓八幡の演目
- 羽衣: 羽衣の演目
- 敦盛: 敦盛の演目
- その他の演目名も推測可能であれば提案

タイトルから推測できる情報に基づいて、適切なタグを suggest_tags 関数を呼び出して提案してください。
確信度も含めて返してください（0.0-1.0）。
"""
        
        try:
            response = self.model.generate_content(prompt)
            
            # Function callingの結果を処理
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        if part.function_call.name == "suggest_tags":
                            args = dict(part.function_call.args)
                            suggestions_data = args.get("suggestions", [])
                            
                            suggestions = []
                            for suggestion_data in suggestions_data:
                                suggestions.append(TagSuggestion(
                                    category=suggestion_data["category"],
                                    tag=suggestion_data["tag"],
                                    confidence=float(suggestion_data["confidence"])
                                ))
                            return suggestions
            
            # Function callingが失敗した場合のフォールバック
            return []
            
        except Exception as e:
            print(f"Gemini API error: {e}")
            return []
    
    def get_available_tags(self) -> Dict[str, List[str]]:
        """利用可能なタグカテゴリと値を返す"""
        return {
            "回生": ["1回生", "2回生", "3回生", "4回生"],
            "先生": ["先生", "学生"],
            "演目": ["弓八幡", "羽衣", "敦盛"]
        }