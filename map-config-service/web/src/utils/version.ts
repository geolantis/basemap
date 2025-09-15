// Version utility for displaying application version information

export interface VersionInfo {
  version: string;
  buildTime: string;
  environment: string;
  gitCommit: string;
  gitBranch: string;
  deploymentUrl: string;
}

let versionInfo: VersionInfo | null = null;

/**
 * Fetch version information from the version.json file
 * This file is generated during build time
 */
export async function getVersionInfo(): Promise<VersionInfo> {
  if (versionInfo) {
    return versionInfo;
  }

  try {
    const response = await fetch('/version.json');
    if (response.ok) {
      versionInfo = await response.json();
      return versionInfo;
    }
  } catch (error) {
    console.warn('Failed to fetch version info:', error);
  }

  // Fallback version info for development
  return {
    version: import.meta.env.VITE_APP_VERSION || '2.0.0-dev',
    buildTime: new Date().toISOString(),
    environment: import.meta.env.MODE || 'development',
    gitCommit: 'local',
    gitBranch: 'local',
    deploymentUrl: window.location.origin
  };
}

/**
 * Format version info for display
 */
export function formatVersion(info: VersionInfo): string {
  if (info.environment === 'production') {
    return `v${info.version}`;
  }
  return `v${info.version} (${info.environment})`;
}

/**
 * Get short git commit hash
 */
export function getShortCommit(commit: string): string {
  return commit.substring(0, 7);
}

/**
 * Format build time for display
 */
export function formatBuildTime(buildTime: string): string {
  const date = new Date(buildTime);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}