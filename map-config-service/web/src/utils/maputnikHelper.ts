export function openInMaputnik(styleUrl: string | undefined, configType: string): void {
  console.log('=== MAPUTNIK DEBUG ===');
  console.log('Received styleUrl:', styleUrl);
  console.log('Received configType:', configType);
  console.log('StyleUrl type:', typeof styleUrl);
  
  // Works for any map with a valid style URL
  if (!styleUrl || styleUrl === 'tiles') {
    alert('Maputnik editor requires a valid style JSON URL. Received: ' + styleUrl);
    return;
  }

  console.log('Original style URL:', styleUrl);
  
  // Prepare the style URL for Maputnik
  let finalStyleUrl = styleUrl;
  
  // Handle different URL patterns
  if (styleUrl.includes('raw.githubusercontent.com')) {
    // GitHub raw URLs - these generally work directly in Maputnik
    console.log('GitHub raw URL detected');
  } else if (styleUrl.includes('api.maptiler.com')) {
    // MapTiler URLs - ensure they have an API key
    if (!styleUrl.includes('key=')) {
      alert('MapTiler styles require an API key. Please add your key to the URL.');
      // You could prompt for a key here or use a demo key
      // For now, we'll try to open it anyway
    }
    console.log('MapTiler URL detected');
  } else if (styleUrl.includes('gis.ktn.gv.at') || styleUrl.includes('sgx.geodatenzentrum.de')) {
    // These are government/public services that should work without keys
    console.log('Public service URL detected');
  } else if (styleUrl.includes('maps.clockworkmicro.com')) {
    // Clockwork Micro URLs need API keys
    if (!styleUrl.includes('x-api-key=')) {
      alert('Clockwork Micro styles require an API key. The style may not load properly.');
    }
    console.log('Clockwork Micro URL detected');
  }
  
  // Determine the styles server URL based on environment
  const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
  const stylesServerUrl = isProduction 
    ? 'https://basemap-styles.vercel.app/api/styles'  // Production styles server
    : 'http://localhost:3001/api/styles';              // Local development server
  
  console.log('Environment:', isProduction ? 'Production' : 'Development');
  console.log('Styles server URL:', stylesServerUrl);
  
  // Check if the URL is already absolute or needs to be made absolute
  if (!finalStyleUrl.startsWith('http://') && !finalStyleUrl.startsWith('https://')) {
    // If it's a relative URL, make it absolute
    if (finalStyleUrl.startsWith('/')) {
      // Path starting with / - prepend origin
      finalStyleUrl = `${window.location.origin}${finalStyleUrl}`;
    } else if (finalStyleUrl.includes('.json')) {
      // If it contains .json but no protocol, assume it's a local style
      finalStyleUrl = `${stylesServerUrl}/${finalStyleUrl}`;
    } else {
      // Simple name like "basemap", "kataster", etc.
      // These need to be served from our styles API endpoint
      // Remove any .json extension if present
      const styleName = finalStyleUrl.replace('.json', '');
      finalStyleUrl = `${stylesServerUrl}/${styleName}`;
    }
    console.log('Converted to absolute URL:', finalStyleUrl);
  }
  
  console.log('Final style URL for Maputnik:', finalStyleUrl);
  
  // Try different Maputnik URL formats
  // For external URLs (https://), use them directly without encoding in hash format
  // For local styles, we'll use the query parameter format
  let maputnikUrl;
  
  if (finalStyleUrl.startsWith('https://') || finalStyleUrl.startsWith('http://')) {
    // For full URLs, use the hash format without encoding - this is what Maputnik expects
    maputnikUrl = `https://maputnik.github.io/editor/#${finalStyleUrl}`;
  } else {
    // For relative URLs or local styles, use query parameter with encoding
    maputnikUrl = `https://maputnik.github.io/editor?style=${encodeURIComponent(finalStyleUrl)}`;
  }
  
  // Alternative format (opposite of what we chose above)
  const alternativeUrl = finalStyleUrl.startsWith('https://') || finalStyleUrl.startsWith('http://')
    ? `https://maputnik.github.io/editor?style=${encodeURIComponent(finalStyleUrl)}`
    : `https://maputnik.github.io/editor/#${finalStyleUrl}`;
  
  console.log('Opening Maputnik with URL:', maputnikUrl);
  console.log('Style URL being passed:', finalStyleUrl);
  console.log('Alternative URL format:', alternativeUrl);
  
  // Open in new window
  const newWindow = window.open(maputnikUrl, '_blank');
  
  // Provide instructions to the user
  if (newWindow) {
    console.log('=== MAPUTNIK OPENED ===');
    console.log('Direct Maputnik URL:', maputnikUrl);
    console.log('Style URL:', finalStyleUrl);
    console.log('');
    console.log('If the style doesn\'t load automatically:');
    console.log('1. The URL above can be copied and pasted directly into your browser');
    console.log('2. Or in Maputnik: Click "Open" → "Load from URL" → Paste:', finalStyleUrl);
    console.log('3. Alternative URL format:', alternativeUrl);
    console.log('');
    console.log('Common issues:');
    console.log('- CORS: The style server must allow cross-origin requests');
    console.log('- API Keys: Some styles require authentication');
    console.log('- Network: Style must be publicly accessible');
  } else {
    // If popup was blocked
    alert('Popup blocked! Please allow popups for this site or copy this URL:\n\n' + maputnikUrl);
  }
}

export function canOpenInMaputnik(config: any): boolean {
  // Check style first, then originalStyle as fallback
  const styleUrl = config.style || config.originalStyle;
  // Allow any map with a valid style URL, not just 'vtc' type
  return styleUrl && 
         styleUrl !== 'tiles' &&
         typeof styleUrl === 'string';
}

// Helper function to extract style info for debugging
export function getStyleInfo(styleUrl: string): {
  provider: string;
  needsApiKey: boolean;
  corsIssues: boolean;
} {
  let provider = 'unknown';
  let needsApiKey = false;
  let corsIssues = false;
  
  if (styleUrl.includes('api.maptiler.com')) {
    provider = 'MapTiler';
    needsApiKey = !styleUrl.includes('key=');
  } else if (styleUrl.includes('maps.clockworkmicro.com')) {
    provider = 'Clockwork Micro';
    needsApiKey = !styleUrl.includes('x-api-key=');
  } else if (styleUrl.includes('raw.githubusercontent.com')) {
    provider = 'GitHub';
    corsIssues = false; // GitHub raw URLs usually work
  } else if (styleUrl.includes('gis.ktn.gv.at')) {
    provider = 'Kärnten GIS';
    corsIssues = true; // May have CORS issues
  } else if (styleUrl.includes('sgx.geodatenzentrum.de')) {
    provider = 'BKG Germany';
    corsIssues = true; // May have CORS issues
  }
  
  return { provider, needsApiKey, corsIssues };
}