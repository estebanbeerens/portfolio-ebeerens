import { RoleDto } from '@portfolio-ebeerens/api-client';
import { SelectOption } from '@portfolio-ebeerens/ui';

export const EMPLOYMENT_TYPE_OPTIONS: SelectOption[] = [
  { value: RoleDto.EmploymentTypeEnum.FullTime, label: 'Full-time' },
  { value: RoleDto.EmploymentTypeEnum.PartTime, label: 'Part-time' },
  { value: RoleDto.EmploymentTypeEnum.SelfEmployed, label: 'Self-employed' },
  { value: RoleDto.EmploymentTypeEnum.Freelance, label: 'Freelance' },
  { value: RoleDto.EmploymentTypeEnum.Internship, label: 'Internship' },
  { value: RoleDto.EmploymentTypeEnum.Trainee, label: 'Trainee' },
  { value: RoleDto.EmploymentTypeEnum.Apprenticeship, label: 'Apprenticeship' },
  { value: RoleDto.EmploymentTypeEnum.Seasonal, label: 'Seasonal' },
];

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  EMPLOYMENT_TYPE_OPTIONS.map((option) => [option.value, option.label])
);

export function employmentTypeLabel(employmentType: string | undefined): string | undefined {
  return employmentType ? EMPLOYMENT_TYPE_LABELS[employmentType] : undefined;
}
