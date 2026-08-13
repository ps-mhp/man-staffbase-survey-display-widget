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

// `act` via Testing Library rather than React directly: importing it is also
// what marks this file as an act environment, which React otherwise warns about.
import { act } from "@testing-library/react";

import * as catalog from "./survey-catalog";
import { startSurveyPickerInjector } from "./survey-picker-injector";

const OPTIONS = [
  { id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Erste Umfrage" },
  { id: "bbbbbbbbbbbbbbbbbbbbbbbb", title: "Zweite Umfrage" },
];

/** The field RJSF renders for the `installation-id` schema key. */
function renderRjsfField(container: HTMLElement, value = ""): HTMLInputElement {
  const input = document.createElement("input");
  input.id = "root_installation-id";
  input.type = "text";
  input.value = value;
  container.appendChild(input);
  return input;
}

/** Lets the observer fire and the catalog promise settle. */
async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("startSurveyPickerInjector", () => {
  let container: HTMLElement;
  let stop: (() => void) | null = null;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    jest.spyOn(catalog, "fetchSurveyCatalog").mockResolvedValue(OPTIONS);
  });

  afterEach(async () => {
    // Stopping unmounts React roots, which is a state update like any other.
    await act(async () => {
      stop?.();
      container.remove();
    });
    stop = null;
    jest.restoreAllMocks();
  });

  it("leaves a page without a configuration dialog untouched", async () => {
    // The bundle also runs on published pages, where this field never appears.
    stop = startSurveyPickerInjector(container);
    await settle();

    expect(catalog.fetchSurveyCatalog).not.toHaveBeenCalled();
    expect(container.querySelector("select")).toBeNull();
  });

  it("puts a dropdown in front of the field once the dialog opens", async () => {
    stop = startSurveyPickerInjector(container);
    const input = renderRjsfField(container);
    await settle();

    expect(catalog.fetchSurveyCatalog).toHaveBeenCalledTimes(1);
    expect(container.querySelector("select")).not.toBeNull();
    expect(input.style.display).toBe("none");
  });

  it("writes the chosen id where the form will read it", async () => {
    stop = startSurveyPickerInjector(container);
    const input = renderRjsfField(container);
    await settle();

    const events: string[] = [];
    input.addEventListener("input", () => events.push(input.value));

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "bbbbbbbbbbbbbbbbbbbbbbbb";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(input.value).toBe("bbbbbbbbbbbbbbbbbbbbbbbb");
    // Without the event React never learns of the change and the form saves
    // the old value.
    expect(events).toEqual(["bbbbbbbbbbbbbbbbbbbbbbbb"]);
  });

  it("gives the field back when the author wants to type an id", async () => {
    stop = startSurveyPickerInjector(container);
    const input = renderRjsfField(container);
    await settle();

    const select = container.querySelector("select") as HTMLSelectElement;
    await act(async () => {
      select.value = "__manual__";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(input.style.display).not.toBe("none");
  });

  it("keeps an id the list does not contain visible and editable", async () => {
    stop = startSurveyPickerInjector(container);
    const input = renderRjsfField(container, "cccccccccccccccccccccccc");
    await settle();

    expect(input.style.display).not.toBe("none");
    expect(input.value).toBe("cccccccccccccccccccccccc");
  });

  it("leaves the field alone when the catalog cannot be read", async () => {
    jest.spyOn(catalog, "fetchSurveyCatalog").mockResolvedValue([]);

    stop = startSurveyPickerInjector(container);
    const input = renderRjsfField(container);
    await settle();

    expect(container.querySelector("select")).toBeNull();
    expect(input.style.display).not.toBe("none");
  });

  it("does not mount a second dropdown when the dialog re-renders", async () => {
    stop = startSurveyPickerInjector(container);
    renderRjsfField(container);
    await settle();

    container.appendChild(document.createElement("span"));
    await settle();

    expect(container.querySelectorAll("select")).toHaveLength(1);
    expect(catalog.fetchSurveyCatalog).toHaveBeenCalledTimes(1);
  });

  it("clears up after itself when the dialog closes", async () => {
    stop = startSurveyPickerInjector(container);
    const input = renderRjsfField(container);
    await settle();

    await act(async () => {
      input.remove();
    });
    await settle();

    expect(container.querySelector("select")).toBeNull();
  });
});
