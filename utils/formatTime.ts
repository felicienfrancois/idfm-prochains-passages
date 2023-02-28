
export default function formatTime (date: string | number | Date) {
  return new Date(date)
    .toLocaleString("fr-FR", { timeZone: "Europe/Paris" })
    .split(" ")
    .pop()
    ?.split(":")
    .splice(0, 2)
    .join(":");
}
