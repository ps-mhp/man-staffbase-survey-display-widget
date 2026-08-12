/*!
 * Copyright 2026, Staffbase SE and contributors.
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
import { render, screen, waitFor } from "@testing-library/react";

import { SurveyView } from "./survey-view";
import { SURVEY_ELEMENT, DEFAULT_PLUGIN_URL } from "./survey-attributes";
import * as loader from "./plugin-loader";
import * as attributes from "./survey-attributes";

const INSTALLATION_ID = "6a7c13cf2b9a846ee2d8955d";

const branch = { slug: "mansales", webUrl: "https://www.onetruck.man" };

describe("SurveyView", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("places the plugin's element with the attributes it needs", async () => {
    jest.spyOn(loader, "loadSurveyPlugin").mockResolvedValue(undefined);

    const { container } = render(
      <SurveyView installationId={INSTALLATION_ID} pluginUrl={DEFAULT_PLUGIN_URL} branch={branch} />,
    );

    const element = await waitFor(() => {
      const found = container.querySelector(SURVEY_ELEMENT);
      expect(found).not.toBeNull();
      return found!;
    });

    expect(element.getAttribute("installation-id")).toBe(INSTALLATION_ID);
    expect(element.getAttribute("data-app-base-url")).toBe("https://www.onetruck.man");
    expect(element.getAttribute("data-app-branch-slug")).toBe("mansales");
    expect(element.getAttribute("data-app-version")).toBeTruthy();
    expect(loader.loadSurveyPlugin).toHaveBeenCalledWith(DEFAULT_PLUGIN_URL);
  });

  it("hands the element the user's own language, not the document's", async () => {
    // Staffbase runs the interface in the browser's language while the content
    // follows the user's setting; on the live app the document said `de` for a
    // user set to `it_IT`. Reading the document here would show the survey in
    // a language the user did not choose.
    jest.spyOn(loader, "loadSurveyPlugin").mockResolvedValue(undefined);
    jest.spyOn(attributes, "fetchUserLocale").mockResolvedValue("it_IT");
    document.documentElement.setAttribute("lang", "de");

    const { container } = render(
      <SurveyView installationId={INSTALLATION_ID} pluginUrl={DEFAULT_PLUGIN_URL} branch={branch} />,
    );

    const element = await waitFor(() => {
      const found = container.querySelector(SURVEY_ELEMENT);
      expect(found).not.toBeNull();
      return found!;
    });

    expect(element.getAttribute("data-locale")).toBe("it_IT");
    document.documentElement.removeAttribute("lang");
  });

  it("reports a missing installation id without loading anything", async () => {
    const load = jest.spyOn(loader, "loadSurveyPlugin").mockResolvedValue(undefined);

    render(<SurveyView installationId={null} pluginUrl={DEFAULT_PLUGIN_URL} branch={branch} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(/Installations-ID/i);
    expect(load).not.toHaveBeenCalled();
  });

  it("reports a plugin that will not load", async () => {
    jest.spyOn(loader, "loadSurveyPlugin").mockRejectedValue(new Error("kaputt"));

    render(
      <SurveyView installationId={INSTALLATION_ID} pluginUrl={DEFAULT_PLUGIN_URL} branch={branch} />,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(/kaputt/);
  });
});
