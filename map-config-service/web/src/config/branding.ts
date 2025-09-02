/**
 * Basemap Branding Configuration
 * Centralized configuration for all branding elements
 */

export interface BrandingConfig {
  // Brand Identity
  name: string;
  tagline: string;
  description: string;
  
  // Visual Identity
  logo: {
    light: string;
    dark: string;
    icon: string;
    width?: string;
    height?: string;
  };
  
  // Color Palette
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    danger: string;
    neutral: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
  };
  
  // Typography
  fonts: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  
  // Layout
  layout: {
    maxWidth: string;
    headerHeight: string;
    footerHeight: string;
  };
  
  // Links & Contact
  links: {
    website: string;
    documentation: string;
    support: string;
    github: string;
    privacy: string;
    terms: string;
  };
  
  // Footer
  footer: {
    copyright: string;
    version: string;
    buildDate: string;
  };
  
  // Editor Integration
  editor: {
    maputnikTitle: string;
    saveButtonText: string;
  };
}

export const brandingConfig: BrandingConfig = {
  // Brand Identity
  name: "Geolantis360 Basemap Style Editor",
  tagline: "Professional Map Style Management",
  description: "Create, edit and manage Geolantis360 basemap and overlay styles as well WMTS, WMS maps with our professional editing platform",
  
  // Visual Identity
  logo: {
    light: "/images/basemap-logo-light.svg",
    dark: "/images/basemap-logo-dark.svg", 
    icon: "/images/basemap-icon.svg",
    width: "180px",
    height: "40px",
  },
  
  // Color Palette - Professional blue/green theme
  colors: {
    primary: "#2563EB", // Blue 600
    primaryDark: "#1E40AF", // Blue 700
    primaryLight: "#3B82F6", // Blue 500
    secondary: "#059669", // Emerald 600
    accent: "#7C3AED", // Violet 600
    success: "#10B981", // Emerald 500
    warning: "#F59E0B", // Amber 500
    danger: "#EF4444", // Red 500
    neutral: {
      50: "#F8FAFC",
      100: "#F1F5F9", 
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A",
      950: "#020617",
    }
  },
  
  // Typography
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    secondary: "'Inter', system-ui, sans-serif", 
    monospace: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  },
  
  // Layout
  layout: {
    maxWidth: "1280px",
    headerHeight: "64px",
    footerHeight: "80px",
  },
  
  // Links & Contact
  links: {
    website: "https://www.geolantis.com",
    documentation: "https://knowledgebase.geolantis.com",
    support: "https://www.geolantis.com", 
    github: "https://github.com/geolantis",
    privacy: "- not availabile ;-) -",
    terms: "Don't copy!!",
  },
  
  // Footer
  footer: {
    copyright: `© ${new Date().getFullYear()} Michael P. All rights reserved.`,
    version: "v2.1.0",
    buildDate: new Date().toISOString().split('T')[0],
  },
  
  // Editor Integration
  editor: {
    maputnikTitle: "Basemap Style Editor",
    saveButtonText: "Save to Basemap",
  },
};

// CSS Custom Properties Generator
export function generateCSSVariables(config: BrandingConfig): string {
  return `
    :root {
      /* Brand Colors */
      --brand-primary: ${config.colors.primary};
      --brand-primary-dark: ${config.colors.primaryDark};
      --brand-primary-light: ${config.colors.primaryLight};
      --brand-secondary: ${config.colors.secondary};
      --brand-accent: ${config.colors.accent};
      --brand-success: ${config.colors.success};
      --brand-warning: ${config.colors.warning};
      --brand-danger: ${config.colors.danger};
      
      /* Neutral Colors */
      --neutral-50: ${config.colors.neutral[50]};
      --neutral-100: ${config.colors.neutral[100]};
      --neutral-200: ${config.colors.neutral[200]};
      --neutral-300: ${config.colors.neutral[300]};
      --neutral-400: ${config.colors.neutral[400]};
      --neutral-500: ${config.colors.neutral[500]};
      --neutral-600: ${config.colors.neutral[600]};
      --neutral-700: ${config.colors.neutral[700]};
      --neutral-800: ${config.colors.neutral[800]};
      --neutral-900: ${config.colors.neutral[900]};
      --neutral-950: ${config.colors.neutral[950]};
      
      /* Typography */
      --font-primary: ${config.fonts.primary};
      --font-secondary: ${config.fonts.secondary};
      --font-monospace: ${config.fonts.monospace};
      
      /* Layout */
      --max-width: ${config.layout.maxWidth};
      --header-height: ${config.layout.headerHeight};
      --footer-height: ${config.layout.footerHeight};
    }
  `;
}

// Theme class generator for different contexts
export function getThemeClasses(variant: 'primary' | 'secondary' | 'neutral' = 'primary') {
  const baseClasses = "transition-all duration-200 ease-in-out";
  
  switch (variant) {
    case 'primary':
      return `${baseClasses} bg-brand-primary hover:bg-brand-primary-dark text-white`;
    case 'secondary': 
      return `${baseClasses} bg-brand-secondary hover:bg-emerald-700 text-white`;
    case 'neutral':
      return `${baseClasses} bg-neutral-100 hover:bg-neutral-200 text-neutral-900`;
    default:
      return baseClasses;
  }
}

export default brandingConfig;