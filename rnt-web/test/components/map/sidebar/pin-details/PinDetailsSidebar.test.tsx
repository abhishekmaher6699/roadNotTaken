import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PinDetailsSidebar } from "../../../../../components/map/sidebar/pin-details/PinDetailsSidebar";

vi.mock("../../../../../components/map/sidebar/MapSidebarShell", () => ({
  MapSidebarShell: ({
    children,
    title,
    description,
  }: {
    children: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <div data-testid="sidebar-shell">
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </div>
  ),
}));

vi.mock("../../../../../components/map/sidebar/pin-details/PinDetailsHero", () => ({
  PinDetailsHero: () => <div data-testid="hero" />,
}));

vi.mock("../../../../../components/map/sidebar/pin-details/PinDetailsGallery", () => ({
  PinDetailsGallery: () => <div data-testid="gallery" />,
}));

afterEach(() => {
  cleanup();
});

describe("PinDetailsSidebar", () => {
  const defaultPin = {
    id: "pin-123",
    title: "Hidden Fort",
    user_id: "user-1",
    latitude: 10.1234,
    longitude: 20.5678,
    address: "123 Fake St",
    status: "active",
    access_level: "public",
    posted_by: "owner@example.com",
    description: "An old fort on the hill.",
    likes_count: 3,
    comment_count: 7,
    viewer_has_liked: false,
    created_at: "2025-01-05T00:00:00.000Z",
    updated_at: "2025-01-06T00:00:00.000Z",
    image_urls: ["https://example.com/1.jpg"],
  };

  it("renders nothing if no pin is provided", () => {
    const { container } = render(
      <PinDetailsSidebar
        open={true}
        pin={null}
        currentUserId="user-2"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleLike={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the sidebar shell, overview, and formatted coordinates", () => {
    render(
      <PinDetailsSidebar
        open={true}
        pin={defaultPin}
        currentUserId="user-2"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleLike={vi.fn()}
      />
    );

    expect(screen.getByTestId("sidebar-shell")).toBeInTheDocument();
    expect(screen.getByText("Pin Details")).toBeInTheDocument();
    expect(screen.getByText("123 Fake St")).toBeInTheDocument();
    expect(screen.getByText("10.1234, 20.5678")).toBeInTheDocument();
    expect(screen.getByText("An old fort on the hill.")).toBeInTheDocument();
  });

  it("shows fallback values when optional pin metadata is missing", () => {
    render(
      <PinDetailsSidebar
        open={true}
        pin={{
          ...defaultPin,
          address: null,
          status: null,
          access_level: null,
          posted_by: null,
          created_at: null,
          updated_at: null,
          description: null,
          image_urls: [],
          thumbnail_url: null,
        }}
        currentUserId="user-2"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleLike={vi.fn()}
      />
    );

    expect(screen.getAllByText("Unknown").length).toBeGreaterThanOrEqual(4);
    expect(screen.queryByTestId("gallery")).not.toBeInTheDocument();
  });

  it("hides edit and delete buttons if the current user is not the owner", () => {
    render(
      <PinDetailsSidebar
        open={true}
        pin={defaultPin}
        currentUserId="user-2"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleLike={vi.fn()}
      />
    );

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  it("shows the gallery when images are present", () => {
    render(
      <PinDetailsSidebar
        open={true}
        pin={defaultPin}
        currentUserId="user-2"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleLike={vi.fn()}
      />
    );

    expect(screen.getByTestId("gallery")).toBeInTheDocument();
  });

  it("shows owner actions and calls onEdit when edit is clicked", () => {
    const onEdit = vi.fn();

    render(
      <PinDetailsSidebar
        open={true}
        pin={defaultPin}
        currentUserId="user-1"
        onClose={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onToggleLike={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Edit"));

    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("opens the confirm dialog and calls onDelete for the owner", async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);

    render(
      <PinDetailsSidebar
        open={true}
        pin={defaultPin}
        currentUserId="user-1"
        onClose={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onToggleLike={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Delete this pin?")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Delete pin"));

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith("pin-123");
    });

    await waitFor(() => {
      expect(screen.queryByText("Delete this pin?")).not.toBeInTheDocument();
    });
  });
});
