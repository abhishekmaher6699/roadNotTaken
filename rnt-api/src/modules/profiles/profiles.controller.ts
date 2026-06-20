import { Response } from "express";
import { getOptionalAuthenticatedUser } from "../../middleware/auth.middleware";
import {
  followProfile,
  getProfileFollowers,
  getProfileFollowing,
  getPublicProfile,
  getOrCreateProfile,
  searchProfiles,
  unfollowProfile,
  updateProfile,
} from "./profiles.service";
import { ProfilesServiceError } from "./profiles.utils";

export async function getMyProfileHandler(req: any, res: Response) {
  try {
    const profile = await getOrCreateProfile(req.user.id, req.user.email);
    res.json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
}

export async function updateMyProfileHandler(req: any, res: Response) {
  try {
    const profile = await updateProfile(req.user.id, req.body, req.user.email);
    res.json(profile);
  } catch (error) {
    if (error instanceof ProfilesServiceError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

export async function getPublicProfileHandler(req: any, res: Response) {
  try {
    const user = await getOptionalAuthenticatedUser(req);

    if (user && user.id === req.params.userId) {
      await getOrCreateProfile(user.id, user.email);
    }

    const profile = await getPublicProfile(req.params.userId, user?.id ?? null);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.json(profile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
}

export async function followProfileHandler(req: any, res: Response) {
  try {
    const result = await followProfile(req.user.id, req.params.userId);
    return res.json(result);
  } catch (error) {
    if (error instanceof ProfilesServiceError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: "Failed to follow profile" });
  }
}

export async function unfollowProfileHandler(req: any, res: Response) {
  try {
    const result = await unfollowProfile(req.user.id, req.params.userId);
    return res.json(result);
  } catch (error) {
    if (error instanceof ProfilesServiceError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: "Failed to unfollow profile" });
  }
}

function parseFollowListQuery(req: any) {
  const limitParam = parseInt(req.query.limit as string, 10);

  return {
    cursor: typeof req.query.cursor === "string" ? req.query.cursor : undefined,
    limit:
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 50)
        : undefined,
  };
}

export async function getProfileFollowersHandler(req: any, res: Response) {
  try {
    const user = await getOptionalAuthenticatedUser(req);
    const page = await getProfileFollowers(
      req.params.userId,
      user?.id ?? null,
      parseFollowListQuery(req),
    );
    return res.json(page);
  } catch (error) {
    if (error instanceof ProfilesServiceError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: "Failed to fetch followers" });
  }
}

export async function getProfileFollowingHandler(req: any, res: Response) {
  try {
    const user = await getOptionalAuthenticatedUser(req);
    const page = await getProfileFollowing(
      req.params.userId,
      user?.id ?? null,
      parseFollowListQuery(req),
    );
    return res.json(page);
  } catch (error) {
    if (error instanceof ProfilesServiceError) {
      return res.status(error.status).json({ error: error.message });
    }

    console.error(error);
    return res.status(500).json({ error: "Failed to fetch following" });
  }
}

export async function searchProfilesHandler(req: any, res: Response) {
  try {
    const query = typeof req.query.q === "string" ? req.query.q : "";
    const limitParam = parseInt(req.query.limit as string, 10);
    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 50)
        : 8;

    const profiles = await searchProfiles(query, limit);
    return res.json(profiles);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to search profiles" });
  }
}
