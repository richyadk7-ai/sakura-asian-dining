import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MenuExplorer } from "@/components/menu-explorer";
import { foodItems } from "@/data/menu";
import { en } from "@/locales/en";

describe("MenuExplorer item details", () => {
  it("offers a safe expandable description for every food item", () => {
    const items = foodItems.filter((item) => item.kind !== "notice");
    const { container } = render(<MenuExplorer locale="en" dictionary={en} items={items} />);

    const disclosures = container.querySelectorAll(".menu-item-details");
    expect(disclosures).toHaveLength(items.length);

    fireEvent.click(screen.getAllByText(en.menu.aboutItem)[0]);
    expect(screen.getAllByText("Green Salad is listed in Sakura’s Salads selection.")[0]).toBeInTheDocument();
    expect(screen.getAllByText(en.menu.ingredientNotice)[0]).toBeInTheDocument();
  });
});
