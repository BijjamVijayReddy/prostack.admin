import type { SidebarKey } from "./sidebar.types";
import {
  HomeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export interface SidebarItem {
  key: SidebarKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: HomeIcon,
  },
  {
    key: "students",
    label: "Students",
    icon: UserGroupIcon,
  },
  {
    key: "enquiry",
    label: "Enquiry",
    icon: DocumentTextIcon,
  },
  {
    key: "placements",
    label: "Placements",
    icon: BriefcaseIcon,
  },
  {
    key: "messages",
    label: "WhatsApp",
    icon: ChatBubbleLeftRightIcon,
  },
];
