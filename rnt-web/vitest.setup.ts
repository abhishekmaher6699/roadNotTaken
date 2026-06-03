import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Leaflet (L)
const mockLeaflet = {
  map: vi.fn().mockImplementation(() => ({
    setView: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
    flyTo: vi.fn().mockReturnThis(),
    invalidateSize: vi.fn().mockReturnThis(),
  })),
  marker: vi.fn().mockImplementation(() => ({
    addTo: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    setLatLng: vi.fn().mockReturnThis(),
  })),
  tileLayer: vi.fn().mockImplementation(() => ({
    addTo: vi.fn().mockReturnThis(),
  })),
  icon: vi.fn().mockImplementation(() => ({})),
  divIcon: vi.fn().mockImplementation(() => ({})),
  latLng: vi.fn().mockImplementation((lat, lng) => ({ lat, lng })),
  latLngBounds: vi.fn().mockImplementation(() => ({
    contains: vi.fn().mockReturnValue(true),
  })),
  control: {
    zoom: vi.fn().mockImplementation(() => ({
      addTo: vi.fn().mockReturnThis(),
    })),
  },
};

vi.mock('leaflet', () => ({
  default: mockLeaflet,
  ...mockLeaflet,
}));

// Mock react-leaflet
vi.mock('react-leaflet', () => {
  return {
    MapContainer: ({ children, ...props }: any) =>
      React.createElement('div', { 'data-testid': 'mock-map-container', ...props }, children),
    TileLayer: (props: any) =>
      React.createElement('div', { 'data-testid': 'mock-tile-layer', ...props }),
    Marker: ({ children, ...props }: any) =>
      React.createElement('div', { 'data-testid': 'mock-marker', ...props }, children),
    Popup: ({ children, ...props }: any) =>
      React.createElement('div', { 'data-testid': 'mock-popup', ...props }, children),
    Tooltip: ({ children, ...props }: any) =>
      React.createElement('div', { 'data-testid': 'mock-tooltip', ...props }, children),
    useMap: vi.fn().mockImplementation(() => ({
      setView: vi.fn(),
      flyTo: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    })),
    useMapEvents: vi.fn().mockImplementation((events: any) => events),
  };
});

// Mock yet-another-react-lightbox since it requires DOM layout calculations that fail in jsdom
vi.mock('yet-another-react-lightbox', () => {
  return {
    default: ({ open, close }: any) =>
      open ? React.createElement('div', { 'data-testid': 'mock-lightbox', onClick: close }, 'Lightbox Open') : null,
  };
});
