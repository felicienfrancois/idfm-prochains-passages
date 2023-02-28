export default function formatTimeSec (date: string | number | Date) {
  return new Date(date)
    .toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
    .split(" ")
    .pop();
}
