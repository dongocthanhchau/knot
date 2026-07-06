"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  SideNav,
  SideNavHeading,
  SideNavSection,
  SideNavItem,
  useSideNavCollapse,
} from "@astryxdesign/core";
import {
  LayoutDashboard,
  FileText,
  Tags,
  Trash2,
  Settings,
  Brain,
  User,
  LogOut,
  ChevronLeft,
  Sun,
  Moon,
} from "lucide-react";
import { signOutAction } from "@/server/auth";
import { useTheme } from "next-themes";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "Notes", icon: FileText },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/notes/trash", label: "Trash", icon: Trash2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const itemClasses =
  "flex items-center gap-3 w-full h-8 px-2 rounded-lg text-sm hover:bg-accent/50 transition-colors cursor-pointer";

function ThemeItem({ isCollapsed }: { isCollapsed: boolean }) {
  const { setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button onClick={() => setOpen(!open)} className={itemClasses}>
        <Sun size={20} className="hidden dark:block" />
        <Moon size={20} className="block dark:hidden" />
        {!isCollapsed && <span>Appearance</span>}
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 right-0 rounded-lg border bg-popover p-1 shadow-md z-50">
          {["Light", "Dark", "System"].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setTheme(mode.toLowerCase());
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-2 h-8 text-sm rounded-md hover:bg-accent/50 transition-colors"
            >
              {mode}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({ isCollapsed }: { isCollapsed: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button onClick={() => setOpen(!open)} className={itemClasses}>
        <User size={20} />
        {!isCollapsed && <span>Account</span>}
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 right-0 rounded-lg border bg-popover p-1 shadow-md z-50">
          <button
            onClick={() => {
              router.push("/settings");
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-2 h-8 text-sm rounded-md hover:bg-accent/50 transition-colors"
          >
            <Settings size={16} />
            Settings
          </button>
          <button
            onClick={() => {
              signOutAction();
              setOpen(false);
            }}
            className="flex items-center gap-2 w-full px-2 h-8 text-sm rounded-md hover:bg-accent/50 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function SidebarFooter() {
  const { isCollapsed, toggle } = useSideNavCollapse();

  return (
    <div className="flex flex-col gap-1 py-2 w-full">
      <button onClick={toggle} className={itemClasses}>
        <ChevronLeft
          size={20}
          className={`shrink-0 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
        />
        {!isCollapsed && <span>Collapse</span>}
      </button>
      <UserMenu isCollapsed={isCollapsed} />
      <ThemeItem isCollapsed={isCollapsed} />
    </div>
  );
}

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
      collapsible={{
        hasButton: false,
      }}
      resizable
      footerIcons={<SidebarFooter />}
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
