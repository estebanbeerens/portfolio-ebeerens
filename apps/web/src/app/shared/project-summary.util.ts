import { PublicProjectDto } from '@portfolio-ebeerens/api-client';

export function projectYear(project: PublicProjectDto): number {
  return new Date(project.endDate ?? project.startDate).getFullYear();
}

export function projectSkillSummary(project: PublicProjectDto): string {
  return (
    project.skills
      .map((skill) => skill.name)
      .slice(0, 3)
      .join(' · ') ||
    project.jobRole ||
    'Selected work'
  );
}

export function projectDuration(project: PublicProjectDto): string {
  if (!project.endDate) {
    return 'Ongoing';
  }
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);
  const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1);
  return months === 1 ? '1 Month' : `${months} Months`;
}
