import { AccountSettingProfile, Department } from '../types';
import { DEFAULTS } from '../constants';

// バックエンドのAPIレスポンスをフロントエンドの型にマッピング
export const mapApiResponseToProfile = (apiResponse: any): AccountSettingProfile => {
  return {
    id: apiResponse.id || '',
    user_id: apiResponse.user_id || '',
    student_id: apiResponse.student_id || '',
    first_name_kanji: apiResponse.first_name_kanji || '',
    first_name_katakana: apiResponse.first_name_katakana || '',
    last_name_kanji: apiResponse.last_name_kanji || '',
    last_name_katakana: apiResponse.last_name_katakana || '',
    year: apiResponse.year || DEFAULTS.YEAR,
    faculty: apiResponse.faculty || '',
    department_code: apiResponse.department_code || DEFAULTS.DEPARTMENT_CODE,
    department_name: apiResponse.department_name || DEFAULTS.DEPARTMENT_NAME,
    email: apiResponse.email || DEFAULTS.EMAIL,
    avatar_url: apiResponse.avatar_url,
    preferences: apiResponse.preferences || {},
    created_at: apiResponse.created_at,
    updated_at: apiResponse.updated_at
  };
};

// フロントエンドのフォームデータをAPIリクエストにマッピング
export const mapFormDataToUpdateRequest = (formData: any): any => {
  return {
    student_id: formData.student_id,
    first_name_kanji: formData.first_name_kanji,
    first_name_katakana: formData.first_name_katakana,
    last_name_kanji: formData.last_name_kanji,
    last_name_katakana: formData.last_name_katakana,
    year: formData.year,
    faculty: formData.faculty,
    department_code: formData.department_code,
    email: formData.email
  };
};

// 学部データをドロップダウンオプションにマッピング
export const mapDepartmentsToOptions = (departments: Department[]) => {
  return departments.map(dept => ({
    value: dept.department_code,
    label: dept.department_name
  }));
};
