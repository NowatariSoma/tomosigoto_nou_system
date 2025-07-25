import { supabase } from './supabase'
import { authApi } from './api'
import { AuthResult } from '@/types/auth'

/**
 * 統一認証サービス
 * 環境に応じてSupabaseまたはカスタムAPIを使用
 */
export class AuthService {
  private static readonly USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'

  /**
   * ログイン
   */
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      if (this.USE_SUPABASE) {
        const result = await supabase.auth.signInWithPassword({ email, password })
        
        if (result.error) {
          return {
            success: false,
            error: result.error.message
          }
        }

        return {
          success: true,
          data: {
            session: {
              access_token: result.data.session?.access_token || '',
              user: {
                id: result.data.user?.id || '',
                email: result.data.user?.email || email,
                name: result.data.user?.user_metadata?.name
              }
            }
          }
        }
      } else {
        // カスタムAPI使用
        const result = await authApi.login(email, password)
        
        if (!result.success) {
          return {
            success: false,
            error: result.message || 'ログインに失敗しました'
          }
        }

        return {
          success: true,
          data: {
            session: {
              access_token: result.token || '',
              user: {
                id: result.user?.id || '',
                email: result.user?.email || email,
                name: result.user?.name
              }
            }
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ネットワークエラーが発生しました'
      }
    }
  }

  /**
   * ログアウト
   */
  static async signOut(): Promise<AuthResult> {
    try {
      if (this.USE_SUPABASE) {
        const result = await supabase.auth.signOut()
        
        if (result.error) {
          return {
            success: false,
            error: result.error.message
          }
        }

        return { success: true }
      } else {
        // カスタムAPI使用
        // TODO: 現在のトークンを取得してAPIに送信
        return { success: true }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'ログアウトに失敗しました'
      }
    }
  }

  /**
   * セッション取得
   */
  static async getSession(): Promise<AuthResult> {
    try {
      if (this.USE_SUPABASE) {
        const result = await supabase.auth.getSession()
        
        if (result.error) {
          return {
            success: false,
            error: result.error.message
          }
        }

        if (!result.data.session) {
          return { success: false }
        }

        return {
          success: true,
          data: {
            session: {
              access_token: result.data.session.access_token,
              user: {
                id: result.data.session.user.id,
                email: result.data.session.user.email || '',
                name: result.data.session.user.user_metadata?.name
              }
            }
          }
        }
      } else {
        // カスタムAPI使用時はTokenManagerから判断
        return { success: false }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'セッション取得に失敗しました'
      }
    }
  }
}

// 後方互換性のためのexport
export const auth = {
  signIn: AuthService.signIn,
  signOut: AuthService.signOut,
  getSession: AuthService.getSession
}