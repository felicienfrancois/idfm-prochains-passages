export default function useLastRefreshTime () {
  return useState<Date|null>("lastRefreshTime", () => null);
}
