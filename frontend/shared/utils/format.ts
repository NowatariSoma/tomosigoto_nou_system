export const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return date.toLocaleDateString('ja-JP', { ...defaultOptions, ...options });
};

export const formatDateTime = (dateString: string): string => {
  return formatDate(dateString, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ja-JP').format(num);
};

export const formatPercentage = (value: number): string => {
  return `${value}%`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * DateオブジェクトをYYYY-MM-DD形式の文字列に変換します
 * タイムゾーンの影響を受けずにローカルの日付をそのまま文字列化します
 */
export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatRelativeLastActive = (dateString: string | null): string => {
  if (!dateString) {
    return '記録なし';
  }

  const target = new Date(dateString);
  if (Number.isNaN(target.getTime())) {
    return '記録なし';
  }

  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  if (diffMs < 0) {
    return '予定';
  }

  const monthsDifference = (now.getFullYear() - target.getFullYear()) * 12 + (now.getMonth() - target.getMonth());

  if (monthsDifference <= 0) {
    return '今月';
  }

  if (monthsDifference < 12) {
    return `${monthsDifference}ヶ月前`;
  }

  const years = Math.floor(monthsDifference / 12);
  return `${years}年前`;
};
