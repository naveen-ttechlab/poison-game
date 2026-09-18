/** Builds the link to share with the second device on the same wifi network.
 * Falls back to whatever host this page was loaded on if the LAN IP can't be
 * determined (e.g. `localhost`) — the link will only work on this machine in
 * that case, so the caller should still show it but flag that it may not be
 * reachable from another device. */
export async function buildJoinLink(roomCode: string): Promise<{ link: string; reachable: boolean }> {
  let ip: string | null = null;
  try {
    const res = await fetch('/api/lan-ip');
    if (res.ok) ip = ((await res.json()) as { ip: string | null }).ip;
  } catch {
    ip = null;
  }

  const host = ip ?? window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : '';
  return {
    link: `${window.location.protocol}//${host}${port}/?join=${roomCode}`,
    reachable: ip !== null,
  };
}
