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

import {
  readInstallationId,
  documentLocale,
  buildSurveyAttributes,
  DEFAULT_PLUGIN_URL,
} from "./survey-attributes";

const INSTALLATION_ID = "6a7c13cf2b9a846ee2d8955d";

describe("readInstallationId", () => {
  it("accepts a 24-digit hex id and trims it", () => {
    expect(readInstallationId(`  ${INSTALLATION_ID} `)).toBe(INSTALLATION_ID);
  });

  it("reads the id out of a pasted survey url", () => {
    expect(readInstallationId(`https://www.onetruck.man/content/surveys/${INSTALLATION_ID}`)).toBe(
      INSTALLATION_ID,
    );
  });

  it("rejects anything that is not such an id", () => {
    expect(readInstallationId("")).toBeNull();
    expect(readInstallationId("nope")).toBeNull();
    expect(readInstallationId(undefined)).toBeNull();
    expect(readInstallationId(42)).toBeNull();
  });
});

describe("documentLocale", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("lang");
    document.head.innerHTML = "";
  });

  it("takes the document language in the api's spelling", () => {
    document.documentElement.setAttribute("lang", "de-DE");
    expect(documentLocale()).toBe("de_DE");
  });

  it("falls back to the content-language meta tag", () => {
    document.head.innerHTML = '<meta http-equiv="content-language" content="it-IT">';
    expect(documentLocale()).toBe("it_IT");
  });

  it("always names some locale", () => {
    expect(documentLocale()).toMatch(/^[a-z]{2}/i);
  });
});

describe("buildSurveyAttributes", () => {
  const branch = { slug: "mansales", webUrl: "https://www.onetruck.man" };

  it("names the installation under both spellings the element reads", () => {
    const attributes = buildSurveyAttributes({
      installationId: INSTALLATION_ID,
      pluginUrl: DEFAULT_PLUGIN_URL,
      branch,
    });

    expect(attributes["installation-id"]).toBe(INSTALLATION_ID);
    expect(attributes["data-installation-id"]).toBe(INSTALLATION_ID);
  });

  it("sets every data-app attribute, because a missing one drops the element to v1", () => {
    const attributes = buildSurveyAttributes({
      installationId: INSTALLATION_ID,
      pluginUrl: DEFAULT_PLUGIN_URL,
      branch,
    });

    for (const name of [
      "data-app-base-url",
      "data-app-branch-slug",
      "data-app-distribution-type",
      "data-app-platform",
      "data-app-version",
    ]) {
      expect(attributes[name]).toBeTruthy();
    }
    expect(attributes["data-app-base-url"]).toBe("https://www.onetruck.man");
    expect(attributes["data-app-branch-slug"]).toBe("mansales");
  });

  it("stands in for branch information the host did not give", () => {
    const attributes = buildSurveyAttributes({
      installationId: INSTALLATION_ID,
      pluginUrl: DEFAULT_PLUGIN_URL,
      branch: null,
    });

    expect(attributes["data-app-base-url"]).toBe(window.location.origin);
    expect(attributes["data-app-branch-slug"]).toBeTruthy();
    expect(attributes["data-app-version"]).toBeTruthy();
  });

  it("passes the plugin host on and states the reading direction", () => {
    const attributes = buildSurveyAttributes({
      installationId: INSTALLATION_ID,
      pluginUrl: DEFAULT_PLUGIN_URL,
      branch,
    });

    expect(attributes["api-url"]).toBe(DEFAULT_PLUGIN_URL);
    expect(attributes.dir).toBe("ltr");
    expect(attributes["data-locale"]).toBeTruthy();
  });
});
