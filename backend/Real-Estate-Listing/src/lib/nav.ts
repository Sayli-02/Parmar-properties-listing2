import type { ComponentType } from "react";
import {
  Boxes,
  Building,
  Images,
  LayoutDashboard,
  MapPin,
  Plus,
  Settings,
  Sparkles,
  Star,
  Trash,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        description: "Portfolio summary and recent activity",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Properties",
    items: [
      {
        href: "/admin/properties",
        label: "All Properties",
        description: "Create and edit property listings",
        icon: Building,
      },
      {
        href: "/admin/properties/new",
        label: "Add Property",
        description: "Create a new listing",
        icon: Plus,
      },
      {
        href: "/admin/featured-properties",
        label: "Featured Properties",
        description: "Choose what appears on the home page",
        icon: Star,
      },
      {
        href: "/admin/amenities",
        label: "Amenities",
        description: "Reusable amenity catalogue",
        icon: Boxes,
      },
      {
        href: "/admin/trash",
        label: "Trash",
        description: "Restore or permanently remove properties",
        icon: Trash,
      },
    ],
  },
  {
    title: "Website content",
    items: [
      {
        href: "/admin/hero",
        label: "Hero Section",
        description: "Home page carousel",
        icon: Images,
      },
      {
        href: "/admin/locations",
        label: "Locations",
        description: "Areas and micro-markets you sell in",
        icon: MapPin,
      },
      {
        href: "/admin/market-intelligence",
        label: "Market intelligence",
        description: "Headline numbers shown to buyers",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        href: "/admin/settings",
        label: "Settings",
        description: "Business details and contact information",
        icon: Settings,
      },
    ],
  },
];

export const navItems: NavItem[] = navSections.flatMap(
  (section) => section.items
);

export const brandIcon = Sparkles;

/**
 * Finds the nav entry that matches a pathname, preferring the longest match so
 * `/admin/properties/new` still highlights "All properties".
 */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  return [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
