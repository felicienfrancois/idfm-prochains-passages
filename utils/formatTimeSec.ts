export default function formatTimeSec (date?: string | number | Date | null) {
  if (!date) { return ""; }
  return new Date(date)
    .toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
    .split(" ")
    .pop();
}
