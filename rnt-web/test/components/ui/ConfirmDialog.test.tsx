import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

afterEach(() => {
  cleanup();
});

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Delete pin?"
        description="This cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders title, description, and custom actions when open", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete pin?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Delete pin?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep" })).toBeInTheDocument();
  });

  it("calls the confirm and cancel handlers", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        title="Delete pin?"
        description="This cannot be undone."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables the confirm button and shows waiting text while confirming", () => {
    render(
      <ConfirmDialog
        open={true}
        title="Delete pin?"
        description="This cannot be undone."
        isConfirming={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: "Please wait..." })
    ).toBeDisabled();
  });
});
