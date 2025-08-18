import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/feedback/badge';
import { Button } from '@/components/ui/forms/button';
import { Eye, Edit, Trash2, Calendar, DollarSign, Users, Layout } from 'lucide-react';
import { Project } from '../types';
import { getStatusIcon, getStatusColor, getStatusText, getStatusIconColor } from '@/shared/utils/status';
import { formatCurrency, formatDate } from '@/shared/utils/format';

interface ProjectCardProps {
  project: Project;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onView,
  onEdit,
  onDelete,
}) => {
  const StatusIcon = getStatusIcon(project.status);

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{project.name}</CardTitle>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${getStatusIconColor(project.status)}`} />
            <Badge className={getStatusColor(project.status)}>
              {getStatusText(project.status)}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {project.customer}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">進捗</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">開始日</span>
          </div>
          <span className="font-medium">{formatDate(project.startDate)}</span>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">予算</span>
          </div>
          <span className="font-medium">{formatCurrency(project.budget)}</span>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">機器数</span>
          </div>
          <span className="font-medium">{project.equipmentCount}台</span>

          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">レイアウト</span>
          </div>
          <span className={`font-medium ${project.layoutCompleted ? 'text-green-600' : 'text-yellow-600'}`}>
            {project.layoutCompleted ? '完了' : '未完了'}
          </span>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {project.description}
          </p>
          
          <div className="flex gap-2">
            {onView && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onView(project.id)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                詳細
              </Button>
            )}
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(project.id)}
                className="flex-1"
              >
                <Edit className="w-4 h-4 mr-1" />
                編集
              </Button>
            )}
            {onDelete && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDelete(project.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 