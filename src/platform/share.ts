/** Compartir resultado y semilla: Web Share API con respaldo al portapapeles. */
export type ShareResult = 'shared' | 'copied' | 'failed';

export async function shareText(title: string, text: string, url: string): Promise<ShareResult> {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return 'failed';
  }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export const seedUrl = (seed: string) => `${location.origin}${location.pathname}?seed=${encodeURIComponent(seed)}`;
