export default function resolveLineClass (line: string) {
  return `mr-1 v-chip--label v-chip--density-default v-chip--size-small v-chip--variant-elevated font-weight-bold line--${line
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")
      .replace(/[^A-Za-z0-9-]/g, "_")}`;
}
