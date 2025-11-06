// Mock implementation of @devvit/client for local development
export function navigateTo(url: string): void {
  window.open(url, '_blank');
}
