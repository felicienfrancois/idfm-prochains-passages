export default function useShowSettings () {
  return useState<boolean>("showSettings", () => !useRoute().params.stopIds?.length);
}
