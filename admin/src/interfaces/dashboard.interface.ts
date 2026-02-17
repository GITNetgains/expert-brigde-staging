export interface StatItem {
  title: string;
  icon: string;
  color: string;
  path: string;
  queryParams?: Record<string, string>;
}

export interface StatDisplay extends StatItem {
  value: number;
}
