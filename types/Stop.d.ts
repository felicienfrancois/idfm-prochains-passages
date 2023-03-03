interface Stop {
  id: string;
  name: string;
  city: string;
  lines: string[];
  _search?: string;
  next_departures?: NextDeparture[];
}