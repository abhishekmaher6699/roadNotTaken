import 'dotenv/config';
import { getPool } from '../config/db';

type SeedCategory =
  | 'general'
  | 'food'
  | 'nature'
  | 'history'
  | 'culture'
  | 'architecture'
  | 'viewpoint';

type SeedStatus =
  | 'active'
  | 'abandoned'
  | 'ruined'
  | 'destroyed'
  | 'restored'
  | 'unknown';

type SeedAccessLevel = 'public' | 'restricted' | 'private' | 'unsafe' | 'unknown';

interface SeedZone {
  name: string;
  baseLat: number;
  baseLng: number;
  address: string;
  category: SeedCategory;
  status: SeedStatus;
  accessLevel: SeedAccessLevel;
  titles: string[];
}

interface SeedPinInput {
  title: string;
  category: SeedCategory;
  address: string;
  status: SeedStatus;
  accessLevel: SeedAccessLevel;
  description: string;
  latitude: number;
  longitude: number;
}

const SAMPLE_USER_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_POSTED_BY = 'seed@roadnottaken.local';

const seedZones: SeedZone[] = [
  {
    name: 'Shaniwar Wada',
    baseLat: 18.5196,
    baseLng: 73.8553,
    address: 'Shaniwar Peth, Pune',
    category: 'history',
    status: 'active',
    accessLevel: 'public',
    titles: ['Fort Wall Corner', 'Old Courtyard Entry', 'Hidden Stone Arch'],
  },
  {
    name: 'Kasba Peth',
    baseLat: 18.5208,
    baseLng: 73.8597,
    address: 'Kasba Peth, Pune',
    category: 'culture',
    status: 'active',
    accessLevel: 'public',
    titles: ['Temple Lane Mural', 'Community Courtyard', 'Festival Street Node'],
  },
  {
    name: 'Deccan Gymkhana',
    baseLat: 18.5174,
    baseLng: 73.8417,
    address: 'Deccan Gymkhana, Pune',
    category: 'food',
    status: 'active',
    accessLevel: 'public',
    titles: ['Late Night Snack Point', 'Old Bakery Front', 'Tea Stop Under Trees'],
  },
  {
    name: 'Parvati Hill',
    baseLat: 18.4967,
    baseLng: 73.8506,
    address: 'Parvati Hill, Pune',
    category: 'viewpoint',
    status: 'active',
    accessLevel: 'public',
    titles: ['Hilltop Sunset Spot', 'Temple Stairs Overlook', 'Quiet Ridge Bench'],
  },
  {
    name: 'Vetal Tekdi',
    baseLat: 18.5362,
    baseLng: 73.8053,
    address: 'Vetal Tekdi, Pune',
    category: 'nature',
    status: 'active',
    accessLevel: 'public',
    titles: ['Forest Trail Turn', 'Rocky Lookout', 'Morning Walk Clearing'],
  },
  {
    name: 'Aga Khan Palace',
    baseLat: 18.5523,
    baseLng: 73.9012,
    address: 'Kalyani Nagar, Pune',
    category: 'architecture',
    status: 'restored',
    accessLevel: 'public',
    titles: ['Palace Garden Axis', 'Colonial Window Line', 'Archive Wing Exterior'],
  },
  {
    name: 'Koregaon Park',
    baseLat: 18.5364,
    baseLng: 73.8932,
    address: 'Koregaon Park, Pune',
    category: 'culture',
    status: 'active',
    accessLevel: 'public',
    titles: ['Lane Seven Corner', 'Wall Art Cluster', 'Cafe Alley Pocket'],
  },
  {
    name: 'Sinhagad Base',
    baseLat: 18.3663,
    baseLng: 73.7559,
    address: 'Sinhagad Road, Pune',
    category: 'history',
    status: 'ruined',
    accessLevel: 'public',
    titles: ['Stone Path Ruin', 'Fort Trail Fork', 'Watchpoint Remnant'],
  },
  {
    name: 'Pashan Lake',
    baseLat: 18.5411,
    baseLng: 73.7898,
    address: 'Pashan, Pune',
    category: 'nature',
    status: 'active',
    accessLevel: 'public',
    titles: ['Wetland Edge', 'Birding Deck', 'Lake Bend View'],
  },
  {
    name: 'Camp',
    baseLat: 18.5076,
    baseLng: 73.8787,
    address: 'Camp, Pune',
    category: 'architecture',
    status: 'active',
    accessLevel: 'public',
    titles: ['Colonial Balcony Row', 'Arcade Passage', 'Old Market Front'],
  },
  {
    name: 'Wanowrie',
    baseLat: 18.4898,
    baseLng: 73.9015,
    address: 'Wanowrie, Pune',
    category: 'general',
    status: 'unknown',
    accessLevel: 'restricted',
    titles: ['Quiet Backlane Entry', 'Abandoned Compound Wall', 'Overgrown Service Road'],
  },
  {
    name: 'Taljai Hills',
    baseLat: 18.4607,
    baseLng: 73.8538,
    address: 'Taljai Hills, Pune',
    category: 'viewpoint',
    status: 'active',
    accessLevel: 'public',
    titles: ['Forest Edge View', 'Sunrise Ridge', 'Quiet Upper Path'],
  },

  {
  name: 'Hinjewadi Phase 1',
  baseLat: 18.5913,
  baseLng: 73.7389,
  address: 'Hinjewadi, Pune',
  category: 'architecture',
  status: 'active',
  accessLevel: 'public',
  titles: ['Tech Park Entrance', 'Glass Tower Axis', 'Food Court Plaza'],
},
{
  name: 'Baner Hill',
  baseLat: 18.559,
  baseLng: 73.785,
  address: 'Baner, Pune',
  category: 'nature',
  status: 'active',
  accessLevel: 'public',
  titles: ['Hilltop Flag Spot', 'Rocky Trail Bend', 'Sunset Edge'],
},
{
  name: 'Aundh',
  baseLat: 18.5585,
  baseLng: 73.8077,
  address: 'Aundh, Pune',
  category: 'culture',
  status: 'active',
  accessLevel: 'public',
  titles: ['Street Art Corner', 'Market Square', 'Old Society Lane'],
},
{
  name: 'Khadakwasla Dam',
  baseLat: 18.441,
  baseLng: 73.774,
  address: 'Khadakwasla, Pune',
  category: 'viewpoint',
  status: 'active',
  accessLevel: 'public',
  titles: ['Dam Edge View', 'Waterline Curve', 'Evening Point'],
},
{
  name: 'Lohegaon',
  baseLat: 18.5822,
  baseLng: 73.92,
  address: 'Lohegaon, Pune',
  category: 'general',
  status: 'unknown',
  accessLevel: 'restricted',
  titles: ['Airfield Boundary', 'Quiet Road Stretch', 'Warehouse Lane'],
},
{
  name: 'Hadapsar',
  baseLat: 18.5089,
  baseLng: 73.926,
  address: 'Hadapsar, Pune',
  category: 'culture',
  status: 'active',
  accessLevel: 'public',
  titles: ['Market Junction', 'Temple Street', 'Old Chowk'],
},
{
  name: 'Magarpatta',
  baseLat: 18.515,
  baseLng: 73.931,
  address: 'Magarpatta, Pune',
  category: 'architecture',
  status: 'active',
  accessLevel: 'public',
  titles: ['Cyber City Plaza', 'Garden Axis', 'Corporate Block'],
},
{
  name: 'Katraj Lake',
  baseLat: 18.4529,
  baseLng: 73.8586,
  address: 'Katraj, Pune',
  category: 'nature',
  status: 'active',
  accessLevel: 'public',
  titles: ['Lake Edge', 'Quiet Ghat', 'Reflection Spot'],
},
{
  name: 'Bavdhan',
  baseLat: 18.511,
  baseLng: 73.78,
  address: 'Bavdhan, Pune',
  category: 'general',
  status: 'active',
  accessLevel: 'public',
  titles: ['Hill Road Curve', 'Society Entrance', 'Open Ground Edge'],
},
{
  name: 'Mulshi Lake',
  baseLat: 18.5236,
  baseLng: 73.512,
  address: 'Mulshi, Pune',
  category: 'nature',
  status: 'active',
  accessLevel: 'public',
  titles: ['Lake Cliff Edge', 'Fog Viewpoint', 'Dam Road Turn'],
},
];

function offsetCoordinate(base: number, offset: number) {
  return Number((base + offset).toFixed(6));
}

function createSeedPins() {
  const pins: SeedPinInput[] = [];

  seedZones.forEach((zone, zoneIndex) => {
    zone.titles.forEach((title, titleIndex) => {
const latOffset =
  (titleIndex - 1) * 0.0035 + (Math.random() - 0.5) * 0.002;

const lngOffset =
  (titleIndex - 1) * 0.003 + (Math.random() - 0.5) * 0.002;

      pins.push({
        title: `${zone.name} ${title}`,
        category: zone.category,
        address: zone.address,
        status: zone.status,
        accessLevel: zone.accessLevel,
        description: `Sample archive pin near ${zone.name}. This seeded record helps test map movement, tile loading, filters, and ranking without relying only on manually created posts.`,
        latitude: offsetCoordinate(zone.baseLat, latOffset),
        longitude: offsetCoordinate(zone.baseLng, lngOffset),
      });
    });
  });

  return pins;
}

async function seedSamplePins() {
  const pool = getPool();
  const client = await pool.connect();
  const pins = createSeedPins();

  try {
    await client.query('BEGIN');

    await client.query(
      `
      DELETE FROM pins
      WHERE posted_by = $1;
      `,
      [SAMPLE_POSTED_BY]
    );

    for (const pin of pins) {
      await client.query(
        `
        INSERT INTO pins (
          title,
          category,
          address,
          status,
          posted_by,
          access_level,
          description,
          image_url,
          thumbnail_url,
          image_urls,
          latitude,
          longitude,
          user_id,
          geom
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, NULL, NULL, ARRAY[]::TEXT[], $8, $9, $10,
          ST_SetSRID(ST_MakePoint($9, $8), 4326)
        );
        `,
        [
          pin.title,
          pin.category,
          pin.address,
          pin.status,
          SAMPLE_POSTED_BY,
          pin.accessLevel,
          pin.description,
          pin.latitude,
          pin.longitude,
          SAMPLE_USER_ID,
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`Seeded ${pins.length} sample pins.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

seedSamplePins()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed sample pins');
    console.error(error);
    process.exit(1);
  });
