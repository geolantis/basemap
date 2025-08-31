import type { MapConfig } from '../types';
import { allMapsConfig } from './allMapsConfig';
import { convertMapConfigToArray } from '../utils/convertMaps';

// Convert all maps from the config file to our format
export const mockConfigs: MapConfig[] = convertMapConfigToArray(allMapsConfig);