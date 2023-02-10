const debounce = (func: Function, delay?: number) => {
  if (!func) { return; }
  if ((func as any).debounceTimer) {
    clearTimeout((func as any).debounceTimer);
  }
  (func as any).debounceTimer = setTimeout(
    func,
    typeof delay === "number" ? delay : 500
  );
};

export default debounce;
