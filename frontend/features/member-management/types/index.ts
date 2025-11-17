export interface MemberSummary {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'basic';
  last_active_at: string | null;
}

export type UpdateMemberRolePayload = {
  role: MemberSummary['role'];
};

