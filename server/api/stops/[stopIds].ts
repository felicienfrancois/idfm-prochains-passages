import stopsData from "@/data/stops.json";
import lines from "@/data/lines.json";

export default defineEventHandler(({ context }) => {
  if (!context.params?.stopIds) { return []; }

  return (context.params.stopIds as string).split(",").map(stopIdConfig => {
    const match = stopIdConfig.match(/^([^{]+)(?:{(.*)})?$/);
    if (!match) return null;
    const stopId = match[1];
    const allowedLines = match[2] ? match[2].split(",") : null;
    
    const data = (stopsData as any)[stopId];
    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      lines: data.lines
        .filter((id: string) => !allowedLines || allowedLines.includes(id))
        .map((id: string) => (lines as any)[id]),
    } as Stop;
  }).filter(Boolean);
});
