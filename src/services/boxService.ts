import { Box } from '../models/box';

const boxes: Box[] = [
  {
    id: '1',
    code: 'BOX001',
    name: 'Box 1',
    address: '123 Main St, Prague',
    location: {
      lat: 50.387451,
      lng: 14.420672,
    },
    status: 'active',
  },
  {
    id: '2',
    code: 'BOX002',
    name: 'Box 2',
    address: '456 Side St, Prague',
    location: {
      lat: 50.075538,
      lng: 14.437800,
    },
    status: 'active',
  },
];

export const getAllBoxes = (): Box[] => boxes; 