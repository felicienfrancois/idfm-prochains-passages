import stopsData from "@/data/stops.json";
import lines from "@/data/lines.json";

export default defineEventHandler(({ context }) => {
  if (!context.params?.stopIds) { return []; }

  return (context.params.stopIds as string).split(",").map(stopId => ({
    id: (stopsData as any)[stopId]?.id,
    name: (stopsData as any)[stopId]?.name,
    lines: (stopsData as any)[stopId]?.lines.map(
      (id: string) => (lines as any)[id]
    ),
  } as Stop));
});
