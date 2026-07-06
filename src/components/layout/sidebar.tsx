"use client";

import { usePathname } from "next/navigation";
import {
  SideNav,
  SideNavHeading,
  SideNavSection,
  SideNavItem,
} from "@astryxdesign/core";
import {
  LayoutDashboard,
  FileText,
  Tags,
  Trash2,
  Settings,
  Brain,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/notes/trash", label: "Trash", icon: Trash2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <SideNav
      header={
        <SideNavHeading
          icon={<Brain size={20} />}
          heading="Knot"
          headingHref="/"
        />
      }
      collapsible
      resizable
    >
      <SideNavSection title="Navigation" isHeaderHidden>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" &&
              pathname.startsWith(item.href + "/") &&
              !navItems.some(
                (other) =>
                  other.href !== item.href &&
                  pathname.startsWith(other.href) &&
                  other.href.length > item.href.length,
              ));

          return (
            <SideNavItem
              key={item.href}
              label={item.label}
              icon={<Icon size={20} />}
              isSelected={isActive}
              href={item.href}
            />
          );
        })}
      </SideNavSection>
    </SideNav>
  );
}
