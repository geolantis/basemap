export function openInMaputnik(styleUrl: string | undefined, configType: string): void {
  // Only works for vector tile maps with style URLs
  if (configType !== 'vtc' || !styleUrl || styleUrl === 'tiles') {
    alert('Maputnik editor only supports vector tile maps with style JSON URLs');
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
  
  // Check if the URL is already absolute or needs to be made absolute
  if (!finalStyleUrl.startsWith('http://') && !finalStyleUrl.startsWith('https://')) {
    // If it's a relative URL, make it absolute using the current origin
    // This assumes the style is served from the same server
    if (finalStyleUrl.startsWith('/')) {
      finalStyleUrl = `${window.location.origin}${finalStyleUrl}`;
    } else {
      // Handle local server URLs like "http://localhost:3001/api/styles/..."
      finalStyleUrl = `http://localhost:3001/api/styles/${finalStyleUrl}`;
    }
    console.log('Converted relative URL to absolute:', finalStyleUrl);
  }
  
  // Try different Maputnik URL formats
  // Format 1: Using hash with direct URL (most common)
  // Don't encode the URL for the hash format - Maputnik handles it
  let maputnikUrl = `https://maputnik.github.io/editor/#${finalStyleUrl}`;
  
  // For some URLs, we might need to use the old query parameter format
  // This is a fallback that can be tried if the hash format doesn't work
  const alternativeUrl = `https://maputnik.github.io/editor?style=${encodeURIComponent(finalStyleUrl)}`;
  
  console.log('Opening Maputnik with URL:', maputnikUrl);
  console.log('Style URL being passed:', finalStyleUrl);
  console.log('Alternative URL format:', alternativeUrl);
  
  // Open in new window
  const newWindow = window.open(maputnikUrl, '_blank');
  
  // Provide instructions to the user
  if (newWindow) {
    console.log('Maputnik opened successfully');
    console.log('If the style doesn\'t load, try:');
    console.log('1. Check the browser console in Maputnik for CORS errors');
    console.log('2. Ensure the style URL is publicly accessible');
    console.log('3. For MapTiler/Clockwork styles, ensure API keys are included');
    console.log('4. Try the alternative URL:', alternativeUrl);
    
    // Show a help message to the user
    setTimeout(() => {
      alert(
        'Maputnik has been opened in a new tab.\n\n' +
        'If the style doesn\'t load automatically:\n' +
        '1. Click on "Open" in Maputnik (top menu)\n' +
        '2. Select "Load from URL"\n' +
        '3. Paste this URL: ' + finalStyleUrl + '\n\n' +
        'Note: Some styles may require CORS headers or API keys to load properly.'
      );
    }, 1000);
  }
}

export function canOpenInMaputnik(config: any): boolean {
  const styleUrl = config.originalStyle || config.style;
  return config.type === 'vtc' && 
         styleUrl && 
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