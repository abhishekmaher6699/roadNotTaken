import { Request, Response } from 'express';
import { getOptionalAuthenticatedUser } from '../../middleware/auth.middleware';
import { createPin, deletePinById, getAllPins, getPinSummariesForTiles, getPinsForTiles, likePinById, searchPins, unlikePinById, updatePinById } from './pins.service';
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

export async function likePinHandler(req: any, res: Response) {
  const pinId = req.params.id;
  const userId = req.user.id;

  console.log("[pins:like] received", {
    pinId,
    userId,
    method: req.method,
    path: req.originalUrl,
    at: new Date().toISOString(),
  });

  try {
    const result = await likePinById(pinId, userId);

    if (!result) {
      console.log("[pins:like] pin not found", {
        pinId,
        userId,
        at: new Date().toISOString(),
      });
      return res.status(404).json({ error: 'Pin not found' });
    }

    console.log("[pins:like] completed", {
      pinId,
      userId,
      liked: result.liked,
      likes_count: result.likes_count,
      at: new Date().toISOString(),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[pins:like] failed", {
      pinId,
      userId,
      error,
      at: new Date().toISOString(),
    });
    return res.status(500).json({ error: 'Failed to like pin' });
  }
}

export async function unlikePinHandler(req: any, res: Response) {
  const pinId = req.params.id;
  const userId = req.user.id;

  console.log("[pins:unlike] received", {
    pinId,
    userId,
    method: req.method,
    path: req.originalUrl,
    at: new Date().toISOString(),
  });

  try {
    const result = await unlikePinById(pinId, userId);

    if (!result) {
      console.log("[pins:unlike] pin not found", {
        pinId,
        userId,
        at: new Date().toISOString(),
      });
      return res.status(404).json({ error: 'Pin not found' });
    }

    console.log("[pins:unlike] completed", {
      pinId,
      userId,
      liked: result.liked,
      likes_count: result.likes_count,
      at: new Date().toISOString(),
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("[pins:unlike] failed", {
      pinId,
      userId,
      error,
      at: new Date().toISOString(),
    });
    return res.status(500).json({ error: 'Failed to unlike pin' });
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
