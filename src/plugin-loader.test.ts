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

import { loadSurveyPlugin, bundleUrl, resetLoaderForTests } from "./plugin-loader";
import { SURVEY_ELEMENT } from "./survey-attributes";

const PLUGIN_URL = "https://pluginsurveys-de1.staffbase.com";

/** Answers whatever script the loader appended, the way a browser would. */
function settleScript(outcome: "load" | "error"): void {
  const script = document.querySelector<HTMLScriptElement>("script[data-survey-plugin]");
  script?.dispatchEvent(new Event(outcome));
}

describe("bundleUrl", () => {
  it("points at the plugin's employee bundle", () => {
    expect(bundleUrl(PLUGIN_URL)).toBe(`${PLUGIN_URL}/employee/bundle.mjs`);
  });

  it("survives a trailing slash on the configured host", () => {
    expect(bundleUrl(`${PLUGIN_URL}/`)).toBe(`${PLUGIN_URL}/employee/bundle.mjs`);
  });
});

describe("loadSurveyPlugin", () => {
  beforeEach(() => {
    resetLoaderForTests();
    document.head.innerHTML = "";
  });

  it("appends one module script and resolves when it loads", async () => {
    const loading = loadSurveyPlugin(PLUGIN_URL);

    const scripts = document.querySelectorAll<HTMLScriptElement>("script[data-survey-plugin]");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].type).toBe("module");
    expect(scripts[0].src).toBe(`${PLUGIN_URL}/employee/bundle.mjs`);

    settleScript("load");
    await expect(loading).resolves.toBeUndefined();
  });

  it("does not load a second time for a second block on the page", async () => {
    const first = loadSurveyPlugin(PLUGIN_URL);
    const second = loadSurveyPlugin(PLUGIN_URL);
    settleScript("load");
    await Promise.all([first, second]);

    await loadSurveyPlugin(PLUGIN_URL);
    expect(document.querySelectorAll("script[data-survey-plugin]")).toHaveLength(1);
  });

  it("reports a bundle that will not load", async () => {
    const loading = loadSurveyPlugin(PLUGIN_URL);
    settleScript("error");
    await expect(loading).rejects.toThrow(/nicht geladen/i);
  });

  it("loads nothing when the page already defines the element", async () => {
    class Stub extends HTMLElement {}
    if (window.customElements.get(SURVEY_ELEMENT) === undefined) {
      window.customElements.define(SURVEY_ELEMENT, Stub);
    }

    await loadSurveyPlugin(PLUGIN_URL);
    expect(document.querySelectorAll("script[data-survey-plugin]")).toHaveLength(0);
  });
});
