export default function useShowSettings () {
  return useState<Boolean>("showSettings", () => !useRoute().params.stopIds?.length);
}
