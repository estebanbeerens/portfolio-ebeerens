import { Pipe, type PipeTransform } from '@angular/core';

const DIVISIONS: readonly { readonly amount: number; readonly unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

@Pipe({ name: 'uiRelativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(value: Date | string | number, now: Date = new Date()): string {
    const target = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(target.getTime())) {
      return '';
    }

    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
    let delta = (target.getTime() - now.getTime()) / 1000;

    for (const division of DIVISIONS) {
      if (Math.abs(delta) < division.amount) {
        return formatter.format(Math.round(delta), division.unit);
      }
      delta /= division.amount;
    }

    return formatter.format(Math.round(delta), 'year');
  }
}
