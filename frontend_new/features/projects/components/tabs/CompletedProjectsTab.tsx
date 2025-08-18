'use client';

import { FolderOpen } from 'lucide-react';
import { Project } from '../../types';
import { ProjectCard } from '../ProjectCard';

interface CompletedProjectsTabProps {
  projects: Project[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CompletedProjectsTab({ projects, onView, onEdit, onDelete }: CompletedProjectsTabProps) {
  const renderProjectGrid = (projectList: Project[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projectList.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {projects.length > 0 ? (
        renderProjectGrid(projects)
      ) : (
        <div className="text-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">完了したプロジェクトがありません</p>
        </div>
      )}
    </div>
  );
} 