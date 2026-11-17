import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Studio from "../src/pages/Studio.jsx";
import { ToastProvider } from "../src/components/ui/overlay.jsx";

function renderStudio() {
  return render(
    <ToastProvider>
      <Studio />
    </ToastProvider>,
  );
}
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new TypeError("offline"))),
  );
});

describe("Studio", () => {
  it("generates offline and keeps Wi-Fi export disabled until its password is present", async () => {
    const user = userEvent.setup();
    renderStudio();
    expect(await screen.findByRole("img", { name: "Your QR code" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Wi-Fi", exact: true }));
    await user.type(screen.getByLabelText("Network name (SSID)"), "Cafe");
    expect(screen.getByRole("button", { name: "Download PNG" }).disabled).toBe(true);
    expect(screen.getByLabelText("Password").type).toBe("text");
    await user.type(screen.getByLabelText("Password"), "espresso");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Download PNG" }).disabled).toBe(false),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("blocks invalid content and restores it through undo", async () => {
    const user = userEvent.setup();
    renderStudio();
    await user.clear(screen.getByLabelText("Website URL"));
    expect(screen.getByRole("button", { name: "Download PNG" }).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: "Undo", exact: true }));
    expect(screen.getByLabelText("Website URL").value).toBe("https://clyvora.tech");
    expect(screen.getByRole("button", { name: "Download PNG" }).disabled).toBe(false);
  });

  it("exposes low contrast feedback while editing colors", async () => {
    const user = userEvent.setup();
    renderStudio();
    await user.click(screen.getByRole("button", { name: "Customize", exact: true }));
    const input = screen.getByLabelText("Code color");
    await user.clear(input);
    await user.type(input, "#eeeeee");
    await user.tab();
    expect(await screen.findByText("Review your design before sharing.")).toBeTruthy();
    expect(screen.getByText(/very low contrast/)).toBeTruthy();
  });

  it("keeps content and design when entering and leaving the separate customization screen", async () => {
    const user = userEvent.setup();
    renderStudio();
    await user.clear(screen.getByLabelText("Website URL"));
    await user.type(screen.getByLabelText("Website URL"), "https://example.com/keep-this");
    await user.click(screen.getByRole("button", { name: "Customize", exact: true }));
    expect(screen.queryByLabelText("Website URL")).toBeNull();
    await user.click(
      within(screen.getByRole("group", { name: "Pattern" })).getByRole("button", {
        name: "Dots",
        exact: true,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Done customizing", exact: true }));
    expect(screen.getByLabelText("Website URL").value).toBe("https://example.com/keep-this");
    await user.click(screen.getByRole("button", { name: "Customize", exact: true }));
    expect(
      within(screen.getByRole("group", { name: "Pattern" }))
        .getByRole("button", { name: "Dots", exact: true })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
