export interface StatItem {
  title: string;
  icon: string;
  color: string;
  path: string;
}

export interface StatDisplay extends StatItem {
  value: number;
}
