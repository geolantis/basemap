// React Integration Example - Map Configuration Service
// Complete working example for integrating with 3rd party React apps

import React, { useState, useEffect, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Configuration
const API_CONFIG = {
  baseUrl: process.env.REACT_APP_MAP_API_URL || 'http://localhost:5173',
  apiKey: process.env.REACT_APP_MAP_API_KEY || 'development-key',
};

// Custom hook for fetching map configurations
const useMapConfigs = (filters = {}) => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState({});

  const fetchMaps = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(
        `${API_CONFIG.baseUrl}/api/maps?${params}`,
        {
          headers: {
            'X-API-Key': API_CONFIG.apiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMaps(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch maps:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMaps();
  }, [fetchMaps]);

  return { maps, loading, error, meta, refetch: fetchMaps };
};

// Map viewer component
const MapViewer = ({ mapConfig }) => {
  const mapContainer = React.useRef(null);
  const map = React.useRef(null);

  useEffect(() => {
    if (!mapConfig || map.current) return;

    // Initialize map
    let style;
    if (mapConfig.type === 'vtc' && mapConfig.style) {
      style = mapConfig.style;
    } else {
      // Create raster style for WMTS/WMS
      style = {
        version: 8,
        sources: {
          'raster-source': {
            type: 'raster',
            tiles: [mapConfig.originalStyle || mapConfig.style],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'raster-layer',
            type: 'raster',
            source: 'raster-source',
          },
        ],
      };
    }

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: style,
      center: [13.5, 47.5], // Default to Austria
      zoom: 7,
    });

    map.current.addControl(new maplibregl.NavigationControl());

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapConfig]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '400px' }}
    />
  );
};

// Map selector component
const MapSelector = ({ maps, selectedMap, onSelect }) => {
  const groupedMaps = maps.reduce((acc, map) => {
    if (!acc[map.country]) acc[map.country] = [];
    acc[map.country].push(map);
    return acc;
  }, {});

  return (
    <select 
      value={selectedMap?.id || ''} 
      onChange={(e) => {
        const map = maps.find(m => m.id === e.target.value);
        onSelect(map);
      }}
      style={{
        width: '100%',
        padding: '8px',
        marginBottom: '16px',
        border: '1px solid #ccc',
        borderRadius: '4px',
      }}
    >
      <option value="">Select a map...</option>
      {Object.entries(groupedMaps).map(([country, countryMaps]) => (
        <optgroup key={country} label={`${country} (${countryMaps.length})`}>
          {countryMaps.map(map => (
            <option key={map.id} value={map.id}>
              {map.label} - {map.type.toUpperCase()}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
};

// Filter controls
const FilterControls = ({ filters, onChange }) => {
  const countries = [
    'All', 'Global', 'Austria', 'Germany', 'Switzerland', 
    'France', 'Italy', 'Spain', 'Netherlands', 'United Kingdom'
  ];

  const types = ['all', 'vtc', 'wmts', 'wms'];

  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
      <div>
        <label>Country: </label>
        <select
          value={filters.country || 'All'}
          onChange={(e) => onChange({ 
            ...filters, 
            country: e.target.value === 'All' ? null : e.target.value 
          })}
        >
          {countries.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Type: </label>
        <select
          value={filters.type || 'all'}
          onChange={(e) => onChange({ 
            ...filters, 
            type: e.target.value === 'all' ? null : e.target.value 
          })}
        >
          {types.map(type => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Search: </label>
        <input
          type="text"
          placeholder="Search maps..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
    </div>
  );
};

// Main application component
const MapConfigApp = () => {
  const [filters, setFilters] = useState({});
  const [selectedMap, setSelectedMap] = useState(null);
  const { maps, loading, error, meta } = useMapConfigs(filters);

  if (loading) {
    return <div>Loading map configurations...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Map Configuration Service - React Example</h1>
      
      <FilterControls filters={filters} onChange={setFilters} />
      
      <div style={{ 
        padding: '16px', 
        background: '#f5f5f5', 
        borderRadius: '8px',
        marginBottom: '16px' 
      }}>
        <strong>Found {meta.total} maps</strong>
        {filters.country && ` in ${filters.country}`}
        {filters.type && ` of type ${filters.type.toUpperCase()}`}
      </div>

      <MapSelector 
        maps={maps} 
        selectedMap={selectedMap} 
        onSelect={setSelectedMap}
      />

      {selectedMap && (
        <div>
          <h2>{selectedMap.label}</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '16px',
            padding: '16px',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px'
          }}>
            <div>
              <strong>Provider:</strong> {selectedMap.metadata?.provider || 'Unknown'}
            </div>
            <div>
              <strong>Type:</strong> {selectedMap.type.toUpperCase()}
            </div>
            <div>
              <strong>Country:</strong> {selectedMap.flag} {selectedMap.country}
            </div>
            <div>
              <strong>ID:</strong> {selectedMap.name}
            </div>
          </div>
          
          <MapViewer mapConfig={selectedMap} />
          
          <details style={{ marginTop: '16px' }}>
            <summary style={{ cursor: 'pointer' }}>View Configuration JSON</summary>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '16px', 
              borderRadius: '8px',
              overflow: 'auto' 
            }}>
              {JSON.stringify(selectedMap, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default MapConfigApp;

// Usage in your app:
// <MapConfigApp />

// Environment variables needed:
// REACT_APP_MAP_API_URL=https://your-domain.vercel.app
// REACT_APP_MAP_API_KEY=your-api-key