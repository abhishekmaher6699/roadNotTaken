import { Request, Response } from 'express';
import { createPin, deletePinById, getAllPins, getPinsForTiles, updatePinById } from './pins.service';
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

    if (tiles.some((tile) =>
      !tile ||
      !Number.isInteger(tile.x) ||
      !Number.isInteger(tile.y) ||
      !Number.isInteger(tile.z)
    )) {
      return res.status(400).json({ error: 'Invalid tile query' });
    }

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
