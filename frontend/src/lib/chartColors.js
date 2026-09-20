/** Map course color tokens to hex for charts */
export function courseColorHex(token) {
  const m = {
    blue: "#93c5fd",
    yellow: "#fde047",
    orange: "#fdba74",
    green: "#86efac",
    purple: "#d8b4fe",
  };
  return m[token] ?? "#93c5fd";
}
