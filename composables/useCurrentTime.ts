let binded = false;

export default function useCurrentTime() {
  if (!binded && typeof(window) !== "undefined") {
    setInterval(() => (useCurrentTime().value = new Date()), 5000);
  }
  return useState<Date>("currentTime", () => new Date());
}

