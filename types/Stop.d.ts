interface Stop {
  id: number;
  name: string;
  city: string;
  lines: string[];
  _search?: string;
  next_departures?: NextDeparture[];
}