import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  Phone,
  Settings,
  Truck,
} from 'lucide-react';
import type { UserRole } from '@/features/auth/types/auth.types';
import { navigationRoutes, matchRoute } from './navigation-routes';
import type { RouteConfig } from './navigation-routes';

export type { RouteConfig };

export interface NavigationItemConfig extends RouteConfig {
  icon: LucideIcon;
}

const iconMap: Record<string, LucideIcon> = {
  '/dashboard': Gauge,
  '/leads': Phone,
  '/orders': ClipboardList,
  '/shipments': Truck,
  '/shipments/create': Truck,
  '/costs': CreditCard,
  '/notes': FileText,
  '/settings': Settings,
};

export const navigationConfig: NavigationItemConfig[] = navigationRoutes.map(
  (route) => ({
    ...route,
    icon: iconMap[route.href] ?? Gauge,
  }),
);

export function matchNavigationItem(pathname: string): NavigationItemConfig | null {
  const matched = matchRoute(pathname);
  if (!matched) return null;
  return navigationConfig.find((item) => item.href === matched.href) ?? null;
}

export function getNavigationForRole(role: UserRole): NavigationItemConfig[] {
  return navigationConfig.filter((item) => item.roles.includes(role));
}
