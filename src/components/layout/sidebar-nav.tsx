
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3, 
  BrainCircuit, 
  Settings, 
  LogOut, 
  ShieldCheck 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Crowd Trends", href: "/trends", icon: BarChart3 },
  { name: "AI Predictions", href: "/predictions", icon: BrainCircuit },
  { name: "Locations", href: "/management", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-card border-r w-64 fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <ShieldCheck className="text-primary-foreground h-5 w-5" />
        </div>
        <h1 className="font-headline font-bold text-lg text-primary tracking-tight">
          CrowdWatch <span className="text-accent">Pro</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t">
        <Link 
          href="/login"
          className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-rose-50 rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </Link>
      </div>
    </div>
  );
}
