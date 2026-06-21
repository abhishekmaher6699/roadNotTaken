import type { Response, NextFunction } from "express";
import { getFeed } from "./feed.service";
import { parseFeedPageQuery } from "./feed.pagination";

export async function getFeedHandler(req: any, res: Response, next: NextFunction) {
  try {
    const viewerUserId = req.user?.id;
    if (!viewerUserId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const input = parseFeedPageQuery(req.query);
    const page = await getFeed(viewerUserId, input);
    return res.json(page);
  } catch (err) {
    return next(err);
  }
}
