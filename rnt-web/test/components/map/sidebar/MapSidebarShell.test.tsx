import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapSidebarShell } from "../../../../components/map/sidebar/MapSidebarShell";

afterEach(() => {
  cleanup();
});

describe("MapSidebarShell", () => {
  it("defaults to the left desktop side", () => {
    const { container } = render(
      <MapSidebarShell
        open={true}
        title="Details"
        description="Pin details"
        onClose={vi.fn()}
      >
        Content
      </MapSidebarShell>
    );

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("sm:left-4");
  });

  it("can mount on the right desktop side", () => {
    const { container } = render(
      <MapSidebarShell
        open={false}
        title="Profile"
        description="User profile"
        side="right"
        onClose={vi.fn()}
      >
        Content
      </MapSidebarShell>
    );

    expect(container.firstChild).toHaveClass("sm:right-4");
    expect(container.firstChild).toHaveClass("sm:translate-x-4");
  });
});
