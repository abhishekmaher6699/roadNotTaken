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
  score: number; // 👈 add this
}

const SAMPLE_USER_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_POSTED_BY = 'seed@roadnottaken.local';

const seedZones: SeedZone[] = [
  // ================= PUNE =================
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
    name: 'Hinjewadi',
    baseLat: 18.5913,
    baseLng: 73.7389,
    address: 'Hinjewadi, Pune',
    category: 'architecture',
    status: 'active',
    accessLevel: 'public',
    titles: ['Tech Park Entrance', 'Glass Tower Axis', 'Food Court Plaza'],
  },
  {
    name: 'Khadakwasla',
    baseLat: 18.441,
    baseLng: 73.774,
    address: 'Khadakwasla, Pune',
    category: 'viewpoint',
    status: 'active',
    accessLevel: 'public',
    titles: ['Dam Edge View', 'Waterline Curve', 'Evening Point'],
  },

  // ================= MUMBAI =================
  {
    name: 'Gateway of India',
    baseLat: 18.922,
    baseLng: 72.8347,
    address: 'Colaba, Mumbai',
    category: 'history',
    status: 'active',
    accessLevel: 'public',
    titles: ['Sea Facing Arch', 'Tourist Plaza', 'Harbor Edge'],
  },
  {
    name: 'Marine Drive',
    baseLat: 18.944,
    baseLng: 72.823,
    address: 'Marine Drive, Mumbai',
    category: 'viewpoint',
    status: 'active',
    accessLevel: 'public',
    titles: ['Sunset Curve', 'Queen Necklace Spot', 'Seaface Bench'],
  },
  {
    name: 'Bandra',
    baseLat: 19.046,
    baseLng: 72.819,
    address: 'Bandra West, Mumbai',
    category: 'culture',
    status: 'active',
    accessLevel: 'public',
    titles: ['Bandstand Edge', 'Street Art Lane', 'Sea Link View'],
  },
  {
    name: 'Juhu Beach',
    baseLat: 19.099,
    baseLng: 72.826,
    address: 'Juhu, Mumbai',
    category: 'nature',
    status: 'active',
    accessLevel: 'public',
    titles: ['Chaat Street Edge', 'Sunset Sand Stretch', 'Crowded Shoreline'],
  },
  {
    name: 'Powai',
    baseLat: 19.117,
    baseLng: 72.904,
    address: 'Powai, Mumbai',
    category: 'general',
    status: 'active',
    accessLevel: 'public',
    titles: ['Lake Edge View', 'Morning Walk Loop', 'Cafe Cluster'],
  },

  // ================= DELHI =================
  {
    name: 'India Gate',
    baseLat: 28.6129,
    baseLng: 77.2295,
    address: 'Central Delhi',
    category: 'history',
    status: 'active',
    accessLevel: 'public',
    titles: ['War Memorial Axis', 'Lawn Viewpoint', 'Night Light Spot'],
  },
  {
    name: 'Connaught Place',
    baseLat: 28.6315,
    baseLng: 77.2167,
    address: 'New Delhi',
    category: 'culture',
    status: 'active',
    accessLevel: 'public',
    titles: ['Inner Circle Arcade', 'Central Park Edge', 'Market Corridor'],
  },
  {
    name: 'Hauz Khas',
    baseLat: 28.5494,
    baseLng: 77.2,
    address: 'South Delhi',
    category: 'culture',
    status: 'active',
    accessLevel: 'public',
    titles: ['Fort Ruins Edge', 'Lake Overlook', 'Cafe Cluster'],
  },
  {
    name: 'Qutub Minar',
    baseLat: 28.5245,
    baseLng: 77.1855,
    address: 'Mehrauli, Delhi',
    category: 'history',
    status: 'active',
    accessLevel: 'public',
    titles: ['Tower Base View', 'Ruins Walkway', 'Garden Axis'],
  },
  {
    name: 'Lodhi Garden',
    baseLat: 28.5933,
    baseLng: 77.2197,
    address: 'Delhi',
    category: 'nature',
    status: 'active',
    accessLevel: 'public',
    titles: ['Tomb Garden View', 'Lake Bridge', 'Tree Path Curve'],
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

  const score = Math.floor(Math.random() * 100) + 1;

      pins.push({
        title: `${zone.name} ${title}`,
        category: zone.category,
        address: zone.address,
        status: zone.status,
        accessLevel: zone.accessLevel,
        description: `Sample archive pin near ${zone.name}. This seeded record helps test map movement, tile loading, filters, and ranking without relying only on manually created posts.`,
        latitude: offsetCoordinate(zone.baseLat, latOffset),
        longitude: offsetCoordinate(zone.baseLng, lngOffset),
        score
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
          score,
          geom
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, NULL, NULL, ARRAY[]::TEXT[], $8, $9, $10, $11,
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
          pin.score
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
