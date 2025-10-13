import { 
  MemberAssignmentData, 
  CreateMemberAssignmentRequest, 
  MemberAssignmentWithDetails 
} from '../types';

// SupabaseのMemberAssignment型の定義（関連テーブル含む）
interface SupabaseUser {
  id: string;
  name: string;
  email: string;
  first_name_katakana?: string;
  last_name_katakana?: string;
  first_name_kanji?: string;
  last_name_kanji?: string;
}

interface SupabaseStage {
  id: string;
  name: string;
  performance_date: string;
}

interface SupabasePart {
  id: string;
  name: string;
  stage: SupabaseStage;
}

interface SupabaseMemberAssignmentResponse {
  id?: string;
  user_id?: string;
  part_id?: string;
  category?: 'utai' | 'mai';
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  user?: SupabaseUser;
  part?: SupabasePart;
}

// SupabaseのMemberAssignment型をフロントエンドのMemberAssignmentData型にマッピング
export const mapMemberAssignmentResponseToMemberAssignmentData = (
  assignment: SupabaseMemberAssignmentResponse | null | undefined
): MemberAssignmentData => {
  if (!assignment) {
    return {
      id: '',
      user_id: '',
      part_id: '',
      category: 'utai',
      display_order: 0,
      created_at: '',
      updated_at: '',
    };
  }
  
  return {
    id: assignment.id || '',
    user_id: assignment.user_id || '',
    part_id: assignment.part_id || '',
    category: assignment.category || 'utai',
    display_order: assignment.display_order || 0,
    created_at: assignment.created_at || '',
    updated_at: assignment.updated_at || '',
  };
};

// SupabaseのMemberAssignment型をフロントエンドのMemberAssignmentWithDetails型にマッピング
export const mapMemberAssignmentResponseToMemberAssignmentWithDetails = (
  assignment: SupabaseMemberAssignmentResponse | null | undefined
): MemberAssignmentWithDetails => {
  if (!assignment) {
    return {
      id: '',
      user_id: '',
      part_id: '',
      category: 'utai',
      display_order: 0,
      created_at: '',
      updated_at: '',
      user: {
        id: '',
        name: '',
        email: '',
        first_name_katakana: '',
        last_name_katakana: '',
        first_name_kanji: '',
        last_name_kanji: '',
      },
      part: {
        id: '',
        name: '',
        stage: {
          id: '',
          name: '',
          performance_date: '',
        },
      },
    };
  }
  
  return {
    id: assignment.id || '',
    user_id: assignment.user_id || '',
    part_id: assignment.part_id || '',
    category: assignment.category || 'utai',
    display_order: assignment.display_order || 0,
    created_at: assignment.created_at || '',
    updated_at: assignment.updated_at || '',
    user: {
      id: assignment.user?.id || '',
      name: assignment.user?.name || '',
      email: assignment.user?.email || '',
      first_name_katakana: assignment.user?.first_name_katakana || '',
      last_name_katakana: assignment.user?.last_name_katakana || '',
      first_name_kanji: assignment.user?.first_name_kanji || '',
      last_name_kanji: assignment.user?.last_name_kanji || '',
    },
    part: {
      id: assignment.part?.id || '',
      name: assignment.part?.name || '',
      stage: {
        id: assignment.part?.stage?.id || '',
        name: assignment.part?.stage?.name || '',
        performance_date: assignment.part?.stage?.performance_date || '',
      },
    },
  };
};

// フロントエンドのCreateMemberAssignmentRequest型をSupabaseのMemberAssignment型にマッピング
export const mapCreateMemberAssignmentRequestToMemberAssignment = (assignment: CreateMemberAssignmentRequest) => {
  return {
    user_id: assignment.user_id,
    part_id: assignment.part_id,
    category: assignment.category,
    display_order: assignment.display_order || 0,
  };
};
