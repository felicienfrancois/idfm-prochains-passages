let idleTimer: NodeJS.Timeout;

export function resetIdleTimer () {
  useIdle().value = false;
  if (idleTimer) { clearTimeout(idleTimer); }
  idleTimer = setTimeout(() => (useIdle().value = true), 10000);
}

let binded = false;

export default function useIdle () {
  if (!binded && typeof (window) !== "undefined") {
    window.onmousemove = resetIdleTimer;
    window.onmousedown = resetIdleTimer;
    window.ontouchstart = resetIdleTimer;
    window.ontouchmove = resetIdleTimer;
    window.onclick = resetIdleTimer;
    window.onkeydown = resetIdleTimer;
    window.addEventListener("scroll", resetIdleTimer, true);
    binded = true;
  }
  return useState<Boolean>("idle", () => true);
}
