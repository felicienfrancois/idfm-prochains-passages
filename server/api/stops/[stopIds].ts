import stopsData from "@/data/stops.json";
import lines from "@/data/lines.json";

export default defineEventHandler(async (event) => {
  const { stopIds } = getQuery(event);
  if (!stopIds) { return; }

  return (stopIds as string).split(",").map(stopId => ({
    id: (stopsData as any)[stopId]?.id,
    name: (stopsData as any)[stopId]?.name,
    lines: (stopsData as any)[stopId]?.lines.map(
      (id: string) => (lines as any)[id]
    ),
  }));
});
