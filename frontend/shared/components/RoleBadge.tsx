import React from 'react';

interface RoleBadgeProps {
  role: 'admin' | 'user' | 'viewer';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getBadgeStyles = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-blue-600 text-white';
      case 'user':
        return 'bg-blue-100 text-black';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'user':
        return 'ユーザー';
      case 'viewer':
        return '閲覧者';
      default:
        return role;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeStyles(role)}`}>
      {getRoleText(role)}
    </span>
  );
}; 