interface Stop {
  id: string;
  name: string;
  city: string;
  lines: string[];
  lineIds: string[];
  _search?: string;
  _score: number;
  next_departures?: NextDeparture[];
}