
export default function formatRemainingTime (date: string | number | Date) {
  const remainingMin = Math.round(
    (new Date(date).getTime() - useCurrentTime().value.getTime()) / 60000
  );
  if (remainingMin > 1) {
    return `<span class="text-h5">${remainingMin}</span><span class="text-body-1">min</span>`;
  } else {
    return "A l'approche";
  }
}
