export type ProjectCategory = "thesis" | "personal" | "work" | "hackathon";

export type ProjectAccentColors = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export type ProjectLink = {
  label: string;
  url: string;
};

export type ProjectStat = {
  value: number;
  label: string;
  suffix?: string;
};

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  category: ProjectCategory;
  cover: string;
  tags: string[];
  year: number;
  featured: boolean;
  role?: string;
  summary: string;
  accentColors?: ProjectAccentColors;
  links?: ProjectLink[];
  stats?: ProjectStat[];
  content: string; // MDX body
};
