import stopsData from "@/data/stops.json";
import lines from "@/data/lines.json";
const runtimeConfig = useRuntimeConfig();

export default defineEventHandler(async (event) => {
  const { stops } = getQuery(event);
  if (!stops) return;
  
  const result = [];
  for (let stopId of JSON.parse(stops as string)) {
    const stop: any = {
      id: (stopsData as any)[stopId]?.id,
      name: (stopsData as any)[stopId]?.name,
      lines: (stopsData as any)[stopId]?.lines.map((id: string) => (lines as any)[id]),
      next_stops: []
    };
    result.push(stop);
    const idfm_resp = await $fetch(`https://prim.iledefrance-mobilites.fr/marketplace/stop-monitoring?MonitoringRef=STIF:StopPoint:Q:${stopId}:`, {
      headers: {
        apiKey: runtimeConfig.apiKey,
      },
    });
    for (let s of (idfm_resp as any)?.Siri?.ServiceDelivery?.StopMonitoringDelivery?.flatMap((s: any) => s?.MonitoredStopVisit)) {
      if (new Date(s?.MonitoredVehicleJourney?.MonitoredCall?.ExpectedDepartureTime || s?.MonitoredVehicleJourney?.MonitoredCall?.AimedDepartureTime).getTime() >= new Date().getTime() - 60000) {
        stop.next_stops.push({
          direction_name: s?.MonitoredVehicleJourney?.DirectionName?.[0]?.value,
          destination_name: s?.MonitoredVehicleJourney?.DestinationName?.[0]?.value,
          journey_note: s?.MonitoredVehicleJourney?.JourneyNote?.[0]?.value,
          line: (lines as any)[s?.MonitoredVehicleJourney?.LineRef?.value?.split(":")?.splice(-2, 1)],
          stop_point_name: s?.MonitoredVehicleJourney?.MonitoredCall?.StopPointName?.[0]?.value,
          vehicule_at_stop: s?.MonitoredVehicleJourney?.MonitoredCall?.VehicleAtStop,
          destination_display: s?.MonitoredVehicleJourney?.MonitoredCall?.DestinationDisplay?.[0]?.value,
          expected_arrival_time: s?.MonitoredVehicleJourney?.MonitoredCall?.ExpectedArrivalTime,
          aimed_arrival_time: s?.MonitoredVehicleJourney?.MonitoredCall?.AimedArrivalTime,
          expected_departure_time: s?.MonitoredVehicleJourney?.MonitoredCall?.ExpectedDepartureTime,
          aimed_departure_time: s?.MonitoredVehicleJourney?.MonitoredCall?.AimedDepartureTime,
          arrival_platform_name: s?.MonitoredVehicleJourney?.MonitoredCall?.ArrivalPlatformName?.value,
          departure_status: s?.MonitoredVehicleJourney?.MonitoredCall?.DepartureStatus,
          arrival_status: s?.MonitoredVehicleJourney?.MonitoredCall?.ArrivalStatus,
        });
      }
    }
  }
  return result;
});
