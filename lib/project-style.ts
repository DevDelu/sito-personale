import { Briefcase, GraduationCap, Sparkles, Trophy, type LucideIcon } from "lucide-react";
import type { ProjectCategory } from "@/types/project";

const CATEGORY_ICON: Record<ProjectCategory, LucideIcon> = {
  thesis: GraduationCap,
  work: Briefcase,
  personal: Sparkles,
  hackathon: Trophy,
};

export function projectCategoryIcon(category: ProjectCategory): LucideIcon {
  return CATEGORY_ICON[category] ?? Sparkles;
}
