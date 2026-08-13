/*!
 * Copyright 2026, MHP Management und IT-Beratung GmbH and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { MANUAL_OPTION_VALUE, SurveyPicker } from "./survey-picker";
import { SurveyOption } from "./survey-catalog";

const OPTIONS: SurveyOption[] = [
  { id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Erste Umfrage" },
  { id: "bbbbbbbbbbbbbbbbbbbbbbbb", title: "Zweite Umfrage" },
];

describe("SurveyPicker", () => {
  it("offers every survey it was given", () => {
    render(<SurveyPicker options={OPTIONS} value="" onChange={jest.fn()} />);

    expect(screen.getByRole("option", { name: /Erste Umfrage/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Zweite Umfrage/ })).toBeInTheDocument();
  });

  it("reports the id of the chosen survey", () => {
    const onChange = jest.fn();
    render(<SurveyPicker options={OPTIONS} value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "bbbbbbbbbbbbbbbbbbbbbbbb" },
    });

    expect(onChange).toHaveBeenCalledWith("bbbbbbbbbbbbbbbbbbbbbbbb");
  });

  it("shows the survey a saved configuration already points at", () => {
    render(
      <SurveyPicker options={OPTIONS} value="aaaaaaaaaaaaaaaaaaaaaaaa" onChange={jest.fn()} />,
    );

    expect(screen.getByRole("combobox")).toHaveValue("aaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("hands over to the id field when the author asks for it", () => {
    const onManual = jest.fn();
    render(<SurveyPicker options={OPTIONS} value="" onChange={jest.fn()} onManual={onManual} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: MANUAL_OPTION_VALUE },
    });

    expect(onManual).toHaveBeenCalled();
  });

  it("steps aside for an id it does not know", () => {
    // A survey outside this author's permissions is missing from the list.
    // Showing the dropdown would misrepresent the saved value as unset, and
    // the next save would quietly drop it.
    const onManual = jest.fn();
    render(
      <SurveyPicker
        options={OPTIONS}
        value="cccccccccccccccccccccccc"
        onChange={jest.fn()}
        onManual={onManual}
      />,
    );

    expect(onManual).toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("steps aside when there is no list to choose from", () => {
    const onManual = jest.fn();
    render(<SurveyPicker options={[]} value="" onChange={jest.fn()} onManual={onManual} />);

    expect(onManual).toHaveBeenCalled();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.getByText(/nicht geladen/i)).toBeInTheDocument();
  });

  it("says nothing about a missing list while it is still loading", () => {
    render(<SurveyPicker options={[]} value="" onChange={jest.fn()} loading />);

    expect(screen.queryByText(/nicht geladen/i)).not.toBeInTheDocument();
  });
});

describe("looking like a control", () => {
  function renderPicker(): HTMLSelectElement {
    render(<SurveyPicker options={OPTIONS} value="" onChange={jest.fn()} />);
    return screen.getByRole("combobox");
  }

  it("draws its own frame and background", () => {
    // The dialog's stylesheet strips the browser's default control styling, so
    // an unstyled select reads as plain text and nobody clicks it.
    const style = renderPicker().style;

    expect(style.border).not.toBe("");
    expect(style.borderRadius).not.toBe("");
    expect(style.backgroundColor).not.toBe("");
  });

  it("draws its own arrow", () => {
    // The same reset removes the native arrow, the one mark that says a list
    // is hiding behind this — so it is painted back in.
    const style = renderPicker().style;

    expect(style.appearance).toBe("none");
    expect(style.backgroundImage).toContain("svg");
  });

  it("offers a pointer to the mouse", () => {
    expect(renderPicker().style.cursor).toBe("pointer");
  });
});
