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

import { DEFAULT_PLUGIN_URL } from "./survey-attributes";
import { PLUGIN_ISSUE, SURVEY_ISSUE, surveyChangesStatus, validateSurveyConfig } from "./survey-editor-rules";

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const ok = { installationId: A, pluginUrl: DEFAULT_PLUGIN_URL };

describe("validateSurveyConfig", () => {
  it("lässt eine Umfrage mit Voreinstellung zu", () => {
    expect(validateSurveyConfig(ok)).toEqual([]);
    expect(validateSurveyConfig({ installationId: `https://x/${A}`, pluginUrl: "" })).toEqual([]);
  });

  it("verlangt eine lesbare ID", () => {
    expect(validateSurveyConfig({ ...ok, installationId: "" }).map((issue) => issue.id)).toEqual([SURVEY_ISSUE]);
    expect(validateSurveyConfig({ ...ok, installationId: "kurz" }).map((issue) => issue.id)).toEqual([SURVEY_ISSUE]);
  });

  it("verlangt eine Web-Adresse, wo eine eingetragen ist", () => {
    expect(validateSurveyConfig({ ...ok, pluginUrl: "keine adresse" }).map((issue) => issue.id)).toEqual([PLUGIN_ISSUE]);
    expect(validateSurveyConfig({ ...ok, pluginUrl: "ftp://x.test" }).map((issue) => issue.id)).toEqual([PLUGIN_ISSUE]);
  });
});

describe("surveyChangesStatus", () => {
  it("schweigt ohne Änderung", () => {
    expect(surveyChangesStatus(ok, ok)).toBeUndefined();
  });

  it("nennt, was sich geändert hat", () => {
    expect(surveyChangesStatus({ ...ok, installationId: B }, ok)).toBe("Umfrage gewählt");
    expect(surveyChangesStatus({ ...ok, pluginUrl: "https://x.test" }, ok)).toBe("Plugin-Adresse geändert");
    expect(surveyChangesStatus({ installationId: B, pluginUrl: "https://x.test" }, ok)).toBe(
      "Umfrage gewählt, Plugin-Adresse geändert",
    );
  });
});
