export interface MemberAssignmentData {
  id: string;
  user_id: string;
  part_id: string;
  category: 'utai' | 'mai';
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberAssignmentRequest {
  user_id: string;
  part_id: string;
  category: 'utai' | 'mai';
  display_order?: number;
}

export interface UpdateMemberAssignmentRequest extends Partial<CreateMemberAssignmentRequest> {}

export interface MemberAssignmentWithDetails extends MemberAssignmentData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  part: {
    id: string;
    name: string;
    stage: {
      id: string;
      name: string;
      performance_date: string;
    };
  };
}

export interface PartWithAssignments {
  id: string;
  name: string;
  stage_id: string;
  stage_name: string;
  performance_date: string;
  member_assignments: MemberAssignmentWithDetails[];
}

export interface StageWithPartsAndAssignments {
  id: string;
  name: string;
  performance_date: string;
  description?: string;
  parts: PartWithAssignments[];
}
