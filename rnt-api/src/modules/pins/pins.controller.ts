import { Request, Response } from 'express';
import { createPin, deletePinById, getAllPins, getPinSummariesForTiles, getPinsForTiles, searchPins, updatePinById } from './pins.service';
import { TileQueryInput } from './pins.types';

export async function createPinHandler(req: any, res: any) {
  try {
    const user = req.user;

    const pin = await createPin({
      ...req.body,
      user_id: user.id,
      posted_by: user.email ?? req.body.posted_by,
    });
    res.status(201).json(pin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create pin' });
  }
}



export async function getPinsHandler(req: Request, res: Response) {
  try {
    const pins = await getAllPins();
    res.json(pins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pins' });
  }
}

export async function getPinsForTilesHandler(req: Request, res: Response) {
  try {
    const tiles: TileQueryInput['tiles'] = Array.isArray(req.body?.tiles) ? req.body.tiles : [];

    // How:
    // - The client always sends an array of z/x/y tiles in the request body.
    // - We validate that every tile has integer coordinates before touching the service layer.
    if (tiles.some((tile) =>
      !tile ||
      !Number.isInteger(tile.x) ||
      !Number.isInteger(tile.y) ||
      !Number.isInteger(tile.z)
    )) {
      return res.status(400).json({ error: 'Invalid tile query' });
    }

    // Raw pin tiles are used only once the client is zoomed in enough to show individual places.
    const pins = await getPinsForTiles({ tiles });

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
    const tiles: TileQueryInput['tiles'] = Array.isArray(req.body?.tiles) ? req.body.tiles : [];

    // How:
    // - Same validation path as raw tiles.
    // - The only difference is that the service returns one aggregate marker per tile instead of raw pins.
    if (tiles.some((tile) =>
      !tile ||
      !Number.isInteger(tile.x) ||
      !Number.isInteger(tile.y) ||
      !Number.isInteger(tile.z)
    )) {
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

export async function deletePinHandler(req: any, res: Response) {
  try {
    const user = req.user;
    const pinId = req.params.id;

    const deletedPin = await deletePinById(pinId, user.id);

    if (!deletedPin) {
      return res.status(404).json({ error: 'Pin not found or not owned by user' });
    }

    return res.status(200).json({ id: deletedPin.id });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete pin' });
  }
}

export async function updatePinHandler(req: any, res: Response) {
  try {
    const user = req.user;
    const pinId = req.params.id;

    const updatedPin = await updatePinById(pinId, user.id, req.body);

    if (!updatedPin) {
      return res.status(404).json({ error: 'Pin not found or not owned by user' });
    }

    return res.status(200).json(updatedPin);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update pin' });
  }
}

export async function searchPinsHandler(req: Request, res: Response) {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const limitParam = parseInt(req.query.limit as string, 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 6;

    // Optional viewport bounds for proximity-biased ordering.
    const north = parseFloat(req.query.north as string);
    const south = parseFloat(req.query.south as string);
    const east  = parseFloat(req.query.east as string);
    const west  = parseFloat(req.query.west as string);

    const bounds =
      Number.isFinite(north) && Number.isFinite(south) &&
      Number.isFinite(east) && Number.isFinite(west)
        ? { north, south, east, west }
        : null;

    const pins = await searchPins({ query, limit, bounds });
    return res.json(pins);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to search pins' });
  }
}
