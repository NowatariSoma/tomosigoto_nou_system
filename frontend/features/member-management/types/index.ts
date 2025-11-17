export interface MemberSummary {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'basic' | 'viewer';
  is_instructor: boolean;
  last_active_at: string | null;
}

export type UpdateMemberRolePayload = {
  role: MemberSummary['role'];
};

export type UpdateInstructorFlagPayload = {
  is_instructor: boolean;
};

