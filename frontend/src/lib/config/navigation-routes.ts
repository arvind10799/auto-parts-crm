import type { UserRole } from '@/features/auth/types/auth.types';

export interface RouteConfig {
  href: string;
  label: string;
  description: string;
  roles: UserRole[];
  group: 'workspace' | 'administration';
  defaultFor?: UserRole[];
}

export const navigationRoutes: RouteConfig[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    description: 'Shared operational overview for every role.',
    roles: ['ADMIN', 'SALES', 'SHIPPING'],
    group: 'workspace',
    defaultFor: ['ADMIN'],
  },
  {
    href: '/leads',
    label: 'Leads',
    description: 'Sales lead intake, follow-up tracking, and order conversion.',
    roles: ['ADMIN', 'SALES'],
    group: 'workspace',
  },
  {
    href: '/orders',
    label: 'Orders',
    description: 'Sales-driven order pipelines, summaries, and customer actions.',
    roles: ['ADMIN', 'SALES'],
    group: 'workspace',
    defaultFor: ['SALES'],
  },
  {
    href: '/shipments',
    label: 'Shipments',
    description: 'Shipping operations, delivery status, and movement visibility.',
    roles: ['ADMIN', 'SHIPPING'],
    group: 'workspace',
    defaultFor: ['SHIPPING'],
  },
  {
    href: '/shipments/create',
    label: 'Create shipment',
    description: 'Pick eligible confirmed orders and convert them into shipments.',
    roles: ['SHIPPING'],
    group: 'workspace',
  },
  {
    href: '/costs',
    label: 'Costs',
    description: 'Margin, purchase, shipping, and review workflows.',
    roles: ['ADMIN', 'SHIPPING'],
    group: 'workspace',
  },
  {
    href: '/notes',
    label: 'Notes',
    description: 'Cross-team notes and entity-level collaboration records.',
    roles: ['ADMIN', 'SALES', 'SHIPPING'],
    group: 'workspace',
  },
  {
    href: '/settings',
    label: 'Settings',
    description: 'Administrative controls and platform preferences.',
    roles: ['ADMIN'],
    group: 'administration',
  },
];

export function matchRoute(pathname: string): RouteConfig | null {
  const matches = navigationRoutes.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  if (matches.length === 0) {
    return null;
  }

  return matches.sort((left, right) => right.href.length - left.href.length)[0];
}
