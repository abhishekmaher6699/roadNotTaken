import { beforeEach, describe, expect, it, vi } from "vitest";
import * as dbModule from "../../../src/config/db";
import { getPublicProfile, updateProfile } from "../../../src/modules/profiles/profiles.service";

vi.mock("../../../src/config/db", () => ({
  getPool: vi.fn(),
}));

describe("profiles.service", () => {
  let mockQuery: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = vi.fn();
    (dbModule.getPool as any).mockReturnValue({ query: mockQuery });
  });

  it("backfills profile rows before loading public profile stats", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          user_id: "user-1",
          username: "abhishek",
          display_name: "Abhishek",
          bio: null,
          avatar_url: null,
          location: null,
          website: null,
          created_at: "2026-05-01T00:00:00.000Z",
          pin_count: 2,
          pin_karma: 5,
          comment_count: 3,
          comment_karma: 4,
        }],
      });

    const profile = await getPublicProfile("user-1");

    expect(mockQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO profiles"),
      ["user-1"],
    );
    expect(profile?.stats.total_karma).toBe(9);
  });

  it("normalizes blank editable fields to null", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          user_id: "user-1",
          username: "old",
          display_name: "Old",
          bio: null,
          avatar_url: null,
          location: null,
          website: null,
          created_at: "2026-05-01T00:00:00.000Z",
          updated_at: "2026-05-01T00:00:00.000Z",
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          user_id: "user-1",
          username: null,
          display_name: "New",
          bio: null,
          avatar_url: null,
          location: null,
          website: null,
          created_at: "2026-05-01T00:00:00.000Z",
          updated_at: "2026-05-02T00:00:00.000Z",
        }],
      });

    await updateProfile("user-1", {
      username: "",
      display_name: " New ",
    });

    expect(mockQuery).toHaveBeenLastCalledWith(
      expect.stringContaining("UPDATE profiles"),
      ["user-1", null, "New", null, null, null, null],
    );
  });
});
