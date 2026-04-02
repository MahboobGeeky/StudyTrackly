const map: Record<string, string> = {
  blue: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  yellow: "bg-amber-500/20 text-amber-200 border-amber-500/40",
  orange: "bg-orange-500/20 text-orange-200 border-orange-500/40",
  green: "bg-emerald-500/20 text-emerald-200 border-emerald-500/40",
  purple: "bg-purple-500/20 text-purple-200 border-purple-500/40",
};

export function coursePillClass(color: string): string {
  return map[color] ?? map.blue;
}
