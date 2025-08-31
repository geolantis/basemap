/**
 * API Key Injection Utility
 * 
 * This utility handles server-side injection of API keys into style URLs.
 * Keys are NEVER stored in the database - only clean URLs are stored.
 * Keys are injected at runtime from environment variables.
 */

export interface ApiKeyProvider {
  name: string;
  envVar: string;
  urlPattern: RegExp;
  paramName: string;
}

// Define API key providers
export const API_PROVIDERS: ApiKeyProvider[] = [
  {
    name: 'maptiler',
    envVar: 'MAPTILER_API_KEY',
    urlPattern: /maptiler\.com/i,
    paramName: 'key'
  },
  {
    name: 'clockwork',
    envVar: 'CLOCKWORK_API_KEY',
    urlPattern: /clockworkmicro\.com/i,
    paramName: 'apikey'
  },
  {
    name: 'bev',
    envVar: 'BEV_API_KEY',
    urlPattern: /basemap\.at/i,
    paramName: 'key'
  }
];

/**
 * Detect which provider a URL belongs to
 */
export function detectProvider(url: string): string | null {
  if (!url) return null;
  
  for (const provider of API_PROVIDERS) {
    if (provider.urlPattern.test(url)) {
      return provider.name;
    }
  }
  
  return null;
}

/**
 * Remove any existing API keys from a URL
 */
export function stripApiKeys(url: string): string {
  if (!url) return url;
  
  // Remove common API key parameters
  return url
    .replace(/[?&]key=[^&]*/gi, '')
    .replace(/[?&]apikey=[^&]*/gi, '')
    .replace(/[?&]api_key=[^&]*/gi, '')
    .replace(/[?&]token=[^&]*/gi, '')
    // Clean up any double ? or & that might result
    .replace(/\?&/g, '?')
    .replace(/&&/g, '&')
    .replace(/[?&]$/g, '');
}

/**
 * Inject API key into URL based on provider
 */
export function injectApiKey(url: string, provider?: string | null): string {
  if (!url) return url;
  
  // First strip any existing keys
  let cleanUrl = stripApiKeys(url);
  
  // If no provider specified, try to detect it
  if (!provider) {
    provider = detectProvider(cleanUrl);
  }
  
  if (!provider) return cleanUrl;
  
  // Find the provider configuration
  const providerConfig = API_PROVIDERS.find(p => p.name === provider);
  if (!providerConfig) return cleanUrl;
  
  // Get the API key from environment
  const apiKey = process.env[providerConfig.envVar];
  if (!apiKey) {
    console.warn(`Warning: No API key found for ${provider} (${providerConfig.envVar})`);
    return cleanUrl;
  }
  
  // Add the API key
  const separator = cleanUrl.includes('?') ? '&' : '?';
  return `${cleanUrl}${separator}${providerConfig.paramName}=${apiKey}`;
}

/**
 * Process a configuration object to inject API keys
 */
export function processConfig(config: any): any {
  if (!config || !config.style_url) return config;
  
  // Detect provider if not already set
  if (!config.requires_api_key) {
    config.requires_api_key = detectProvider(config.style_url);
  }
  
  // Clean the URL in the config (don't modify original)
  const cleanedConfig = {
    ...config,
    style_url: stripApiKeys(config.style_url)
  };
  
  return cleanedConfig;
}

/**
 * Batch process multiple configurations
 */
export function processConfigs(configs: any[]): any[] {
  return configs.map(config => processConfig(config));
}