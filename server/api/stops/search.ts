import stops from "@/data/stops.json";
import lines from "@/data/lines.json";

export default defineEventHandler((event) => {
  const { search } = getQuery(event);
  if (!search) { return; }
  const simple_search = (search as String)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-zA-Z]/, " ");
  if (simple_search.length < 3) { return; }
  return Object.values(stops)
    .filter(row => row._search.includes(simple_search))
    .map(row => ({
      id: row.id,
      name: row.name,
      city: row.city,
      lines: row.lines.map((id: string) => (lines as any)[id]),
    })) as Stop[];
});
