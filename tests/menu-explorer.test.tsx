import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MenuExplorer } from "@/components/menu-explorer";
import { foodItems } from "@/data/menu";
import { en } from "@/locales/en";

describe("MenuExplorer item details", () => {
  afterEach(() => cleanup());

  it("renders the complete featured selection as an intentional grid", () => {
    const { container } = render(<MenuExplorer locale="en" dictionary={en} items={foodItems} />);

    expect(container.querySelectorAll(".menu-featured-grid > button")).toHaveLength(6);
    expect(container.querySelector(".menu-featured-rail")).not.toBeInTheDocument();
  });

  it("shows only meaningful descriptions and omits formulaic card copy", () => {
    const baseItems = foodItems.filter((item) => item.kind !== "notice");
    const items = [{ ...baseItems[0], descriptionEn: "Fresh greens served as a light starter." }, ...baseItems.slice(1)];
    const { container } = render(<MenuExplorer locale="en" dictionary={en} items={items} />);

    const disclosures = container.querySelectorAll(".menu-item-details");
    expect(disclosures).toHaveLength(1);

    expect(screen.queryByText(en.menu.aboutItem)).not.toBeInTheDocument();
    expect(screen.getAllByText(en.menu.ingredientNotice)).toHaveLength(1);
    fireEvent.click(screen.getByText("Details"));
    expect(screen.getByText("Fresh greens served as a light starter.")).toBeInTheDocument();
    expect(screen.queryByText(/is listed in Sakura/)).not.toBeInTheDocument();
  });

  it("filters by category and reflects the state in the URL", () => {
    window.history.replaceState({}, "", "/en/menu");
    render(<MenuExplorer locale="en" dictionary={en} items={foodItems} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Salads" } });

    expect(screen.getByText("Green Salad")).toBeInTheDocument();
    expect(screen.queryByText("Papad")).not.toBeInTheDocument();
    expect(window.location.search).toContain("category=Salads");
  });
});
