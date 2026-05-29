import { Request, Response } from 'express';
import { AuthenticatedRequest, getOptionalAuthenticatedUser } from '../../middleware/auth.middleware';
import { createPin, deletePinById, getAllPins, getPinById, getPinSummariesForTiles, getPinsForTiles, likePinById, searchPins, unlikePinById, updatePinById } from './pins.service';
import { TileQueryInput } from './pins.types';

function parseTiles(body: any): TileQueryInput['tiles'] | null {
  const tiles: TileQueryInput['tiles'] = Array.isArray(body?.tiles) ? body.tiles : [];
  const valid = tiles.every(
    (t) => t && Number.isInteger(t.x) && Number.isInteger(t.y) && Number.isInteger(t.z),
  );
  return valid ? tiles : null;
}

function getRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function createPinHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const pin = await createPin({
      ...req.body,
      user_id: req.user.id,
      posted_by: undefined,
    });
    res.status(201).json(pin);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create pin' });
  }
}



export async function getPinsHandler(req: Request, res: Response) {
  try {
    const user = await getOptionalAuthenticatedUser(req);
    const pins = await getAllPins(user?.id);
    res.json(pins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pins' });
  }
}

export async function getPinsForTilesHandler(req: Request, res: Response) {
  try {
    const user = await getOptionalAuthenticatedUser(req);
    const tiles = parseTiles(req.body);

    // How:
    // - The client always sends an array of z/x/y tiles in the request body.
    // - We validate that every tile has integer coordinates before touching the service layer.
    if (!tiles) {
      return res.status(400).json({ error: 'Invalid tile query' });
    }

    // Raw pin tiles are used only once the client is zoomed in enough to show individual places.
    const pins = await getPinsForTiles({ tiles }, user?.id);

    return res.json({
      pins,
      tiles,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch tile pins' });
  }
}

export async function getPinSummariesForTilesHandler(req: Request, res: Response) {
  try {
    const tiles = parseTiles(req.body);

    // How:
    // - Same validation path as raw tiles.
    // - The only difference is that the service returns one aggregate marker per tile instead of raw pins.
    if (!tiles) {
      return res.status(400).json({ error: 'Invalid tile query' });
    }

    // Summary tiles power the zoomed-out discovery layer without flooding the map with pins.
    const summaries = await getPinSummariesForTiles({ tiles });

    return res.json({
      summaries,
      tiles,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch tile summaries' });
  }
}

export async function deletePinHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const pinId = getRouteParam(req.params.id);
    if (!pinId) {
      return res.status(400).json({ error: 'Invalid pin ID' });
    }

    const deletedPin = await deletePinById(pinId, req.user.id);

    if (!deletedPin) {
      return res.status(404).json({ error: 'Pin not found or not owned by user' });
    }

    return res.status(200).json({ id: deletedPin.id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to delete pin' });
  }
}

export async function likePinHandler(req: AuthenticatedRequest, res: Response) {
  const pinId = getRouteParam(req.params.id);
  const userId = req.user.id;

  if (!pinId) {
    return res.status(400).json({ error: 'Invalid pin ID' });
  }

  try {
    const result = await likePinById(pinId, userId);

    if (!result) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[pins:like] failed', { pinId, userId, error });
    return res.status(500).json({ error: 'Failed to like pin' });
  }
}

export async function getPinByIdHandler(req: Request, res: Response) {
  try {
    const pinId = parseInt(req.params.id as string, 10);

    if (isNaN(pinId)) {
      return res.status(400).json({ error: "Invalid pin ID" });
    }

    const user = await getOptionalAuthenticatedUser(req);
    const pin = await getPinById(String(pinId), user?.id);

    if (!pin) {
      return res.status(404).json({ error: "Pin not found" });
    }

    return res.json(pin);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch pin" });
  }
}

export async function unlikePinHandler(req: AuthenticatedRequest, res: Response) {
  const pinId = getRouteParam(req.params.id);
  const userId = req.user.id;

  if (!pinId) {
    return res.status(400).json({ error: 'Invalid pin ID' });
  }

  try {
    const result = await unlikePinById(pinId, userId);

    if (!result) {
      return res.status(404).json({ error: 'Pin not found' });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[pins:unlike] failed', { pinId, userId, error });
    return res.status(500).json({ error: 'Failed to unlike pin' });
  }
}

export async function updatePinHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const pinId = getRouteParam(req.params.id);
    if (!pinId) {
      return res.status(400).json({ error: 'Invalid pin ID' });
    }

    const updatedPin = await updatePinById(pinId, req.user.id, req.body);

    if (!updatedPin) {
      return res.status(404).json({ error: 'Pin not found or not owned by user' });
    }

    return res.status(200).json(updatedPin);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to update pin' });
  }
}

export async function searchPinsHandler(req: Request, res: Response) {
  try {
    const user = await getOptionalAuthenticatedUser(req);
    const query = typeof req.query.q === "string" ? req.query.q : "";

    const limitParam = parseInt(req.query.limit as string, 10);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 6;

    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    const center =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? { lat, lng }
        : undefined;

    const pins = await searchPins({ query, limit, center }, user?.id);

    return res.json(pins);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to search pins" });
  }
}
