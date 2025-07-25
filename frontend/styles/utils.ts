/**
 * スタイリングユーティリティ関数
 * テーマシステムと連携し、一貫したスタイリングを提供
 */

import { type Theme, defaultTheme } from './theme'

/**
 * レスポンシブ値を生成する関数
 * 異なるブレークポイントに対応する値を生成
 */
export function responsive<T>(
  value: T | Partial<Record<keyof Theme['breakpoints'], T>>,
  theme: Theme = defaultTheme
): Record<string, T> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const responsiveValue = value as Partial<Record<keyof Theme['breakpoints'], T>>
    const result: Record<string, T> = {}
    
    // ベース値（xs未満）
    if ('xs' in responsiveValue && responsiveValue.xs !== undefined) {
      result.base = responsiveValue.xs
    }
    
    // 各ブレークポイントの値
    Object.entries(theme.breakpoints).forEach(([breakpoint, minWidth]) => {
      const typedBreakpoint = breakpoint as keyof Theme['breakpoints']
      if (typedBreakpoint in responsiveValue && responsiveValue[typedBreakpoint] !== undefined) {
        result[`@media (min-width: ${minWidth})`] = responsiveValue[typedBreakpoint]!
      }
    })
    
    return result
  }
  
  return { base: value as T }
}

/**
 * スペーシング値を取得する関数
 * テーマのスペーシングスケールから適切な値を計算
 */
export function spacing(
  value: keyof Theme['spacing'] | number | string,
  theme: Theme = defaultTheme
): string {
  // テーマのスペーシングキーの場合
  if (typeof value === 'string' && value in theme.spacing) {
    return theme.spacing[value as keyof Theme['spacing']]
  }
  
  // 数値の場合（remに変換）
  if (typeof value === 'number') {
    return `${value * 0.25}rem` // 4px基準
  }
  
  // 文字列の場合はそのまま返す
  return value as string
}

/**
 * 色値を取得する関数
 * テーマのカラースキームから色を取得
 */
export function getColor(
  path: string,
  theme: Theme = defaultTheme
): string {
  const keys = path.split('.')
  let current: any = theme.colors
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      console.warn(`Color path "${path}" not found in theme`)
      return path // fallback
    }
  }
  
  return typeof current === 'string' ? current : path
}

/**
 * フォントサイズとラインハイトのペアを取得
 */
export function fontSize(
  size: keyof Theme['typography']['fontSize'],
  theme: Theme = defaultTheme
): { fontSize: string; lineHeight: string } {
  const fontSizeValue = theme.typography.fontSize[size]
  
  // サイズに応じた適切なラインハイトを設定
  const lineHeightMap: Record<string, keyof Theme['typography']['lineHeight']> = {
    xs: 'tight',
    sm: 'tight', 
    base: 'normal',
    lg: 'normal',
    xl: 'normal',
    '2xl': 'snug',
    '3xl': 'snug',
    '4xl': 'tight',
    '5xl': 'tight',
  }
  
  const lineHeightKey = lineHeightMap[size] || 'normal'
  const lineHeightValue = theme.typography.lineHeight[lineHeightKey]
  
  return {
    fontSize: fontSizeValue,
    lineHeight: lineHeightValue,
  }
}

/**
 * シャドウ値を取得する関数
 */
export function boxShadow(
  shadow: keyof Theme['shadows'],
  theme: Theme = defaultTheme
): string {
  return theme.shadows[shadow]
}

/**
 * ボーダー半径を取得する関数
 */
export function borderRadius(
  radius: keyof Theme['borderRadius'],
  theme: Theme = defaultTheme
): string {
  return theme.borderRadius[radius]
}

/**
 * トランジション値を生成する関数
 */
export function transition(
  property: string | string[],
  duration: keyof Theme['transitions']['duration'] = '200',
  timing: keyof Theme['transitions']['timing'] = 'out',
  theme: Theme = defaultTheme
): string {
  const properties = Array.isArray(property) ? property : [property]
  const durationValue = theme.transitions.duration[duration]
  const timingValue = theme.transitions.timing[timing]
  
  return properties
    .map(prop => `${prop} ${durationValue} ${timingValue}`)
    .join(', ')
}

/**
 * メディアクエリヘルパー
 */
export function mediaQuery(
  breakpoint: keyof Theme['breakpoints'],
  theme: Theme = defaultTheme
): string {
  return `@media (min-width: ${theme.breakpoints[breakpoint]})`
}

/**
 * z-indexヘルパー
 */
export function zIndex(
  layer: keyof Theme['zIndex'],
  theme: Theme = defaultTheme
): string | number {
  return theme.zIndex[layer]
}

/**
 * CSS-in-JSスタイルオブジェクトを生成するヘルパー
 */
export interface StyleProps {
  color?: string
  backgroundColor?: string
  fontSize?: keyof Theme['typography']['fontSize'] | string
  fontWeight?: keyof Theme['typography']['fontWeight'] | string
  padding?: keyof Theme['spacing'] | number | string
  margin?: keyof Theme['spacing'] | number | string
  borderRadius?: keyof Theme['borderRadius'] | string
  boxShadow?: keyof Theme['shadows'] | string
  transition?: {
    property: string | string[]
    duration?: keyof Theme['transitions']['duration']
    timing?: keyof Theme['transitions']['timing']
  }
}

export function createStyles(
  props: StyleProps,
  theme: Theme = defaultTheme
): Record<string, any> {
  const styles: Record<string, any> = {}
  
  if (props.color) {
    styles.color = props.color.includes('.') ? getColor(props.color, theme) : props.color
  }
  
  if (props.backgroundColor) {
    styles.backgroundColor = props.backgroundColor.includes('.') 
      ? getColor(props.backgroundColor, theme) 
      : props.backgroundColor
  }
  
  if (props.fontSize) {
    if (typeof props.fontSize === 'string' && props.fontSize in theme.typography.fontSize) {
      const { fontSize: size, lineHeight } = fontSize(props.fontSize as keyof Theme['typography']['fontSize'], theme)
      styles.fontSize = size
      styles.lineHeight = lineHeight
    } else {
      styles.fontSize = props.fontSize
    }
  }
  
  if (props.fontWeight && props.fontWeight in theme.typography.fontWeight) {
    styles.fontWeight = theme.typography.fontWeight[props.fontWeight as keyof Theme['typography']['fontWeight']]
  } else if (props.fontWeight) {
    styles.fontWeight = props.fontWeight
  }
  
  if (props.padding) {
    styles.padding = spacing(props.padding, theme)
  }
  
  if (props.margin) {
    styles.margin = spacing(props.margin, theme)
  }
  
  if (props.borderRadius) {
    styles.borderRadius = props.borderRadius in theme.borderRadius
      ? borderRadius(props.borderRadius as keyof Theme['borderRadius'], theme)
      : props.borderRadius
  }
  
  if (props.boxShadow) {
    styles.boxShadow = props.boxShadow in theme.shadows
      ? boxShadow(props.boxShadow as keyof Theme['shadows'], theme)
      : props.boxShadow
  }
  
  if (props.transition) {
    styles.transition = transition(
      props.transition.property,
      props.transition.duration,
      props.transition.timing,
      theme
    )
  }
  
  return styles
}

/**
 * フォーカスリングのスタイルを生成
 */
export function focusRing(theme: Theme = defaultTheme) {
  return {
    outline: 'none',
    boxShadow: `0 0 0 2px ${getColor('primary.500', theme)}40`, // 25% opacity
  }
}

/**
 * ホバーエフェクトを生成
 */
export function hoverEffect(
  property: string,
  value: string,
  duration: keyof Theme['transitions']['duration'] = '200',
  theme: Theme = defaultTheme
) {
  return {
    transition: transition(property, duration, 'out', theme),
    [`&:hover`]: {
      [property]: value,
    },
  }
}

/**
 * トランケート（省略表示）スタイル
 */
export function truncate() {
  return {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  }
}

/**
 * 複数行トランケート
 */
export function lineClamp(lines: number) {
  return {
    display: '-webkit-box',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': lines,
    overflow: 'hidden',
  }
}

/**
 * Srのみ（スクリーンリーダーのみ）テキスト
 */
export function srOnly() {
  return {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden' as const,
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0',
  }
}