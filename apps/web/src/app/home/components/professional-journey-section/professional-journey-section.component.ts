import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RoleDto } from '@portfolio-ebeerens/api-client';
import { Button, Card } from '@portfolio-ebeerens/ui';
import { RoleCompanyGroup } from '../../../shared/portfolio-content.service';
import { RoleDescription } from './role-description/role-description.component';

const COLLAPSED_COMPANY_COUNT = 3;

@Component({
  selector: 'web-professional-journey-section',
  imports: [Button, Card, RoleDescription],
  templateUrl: './professional-journey-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessionalJourneySection {
  readonly groups = input<readonly RoleCompanyGroup[]>([]);

  protected readonly expanded = signal(false);
  protected readonly hasMore = computed(() => this.groups().length > COLLAPSED_COMPANY_COUNT);
  protected readonly visibleGroups = computed(() =>
    this.expanded() ? this.groups() : this.groups().slice(0, COLLAPSED_COMPANY_COUNT)
  );

  protected toggleExpanded(): void {
    this.expanded.update((value) => !value);
  }

  protected groupDateRange(group: RoleCompanyGroup): string {
    const startYear = new Date(group.startDate).getFullYear();
    if (!group.endDate) {
      return `${startYear}-Present`;
    }
    const endYear = new Date(group.endDate).getFullYear();
    return startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`;
  }

  protected groupDuration(group: RoleCompanyGroup): string {
    return formatDuration(group.startDate, group.endDate);
  }

  protected roleDateRange(startDate: string, endDate?: string): string {
    const start = formatMonthYear(startDate);
    const end = endDate ? formatMonthYear(endDate) : 'Present';
    return `${start} - ${end} \u00b7 ${formatDuration(startDate, endDate)}`;
  }

  protected roleSkillSummary(role: RoleDto): string {
    return role.skills
      .map((skill) => skill.name)
      .slice(0, 3)
      .join(' \u00b7 ');
  }

  protected employmentTypeLabel(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

function formatMonthYear(value: string): string {
  return MONTH_YEAR_FORMATTER.format(new Date(value));
}

// Inclusive month count (LinkedIn-style): Jan-Dec of the same year reads as "1 yr", not "11 mos".
function formatDuration(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const totalMonths = Math.max(
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1,
    1
  );
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${years === 1 ? 'yr' : 'yrs'}`);
  }
  if (months > 0 || years === 0) {
    parts.push(`${months} ${months === 1 ? 'mo' : 'mos'}`);
  }
  return parts.join(' ');
}
