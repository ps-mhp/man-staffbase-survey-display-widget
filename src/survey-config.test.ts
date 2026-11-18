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
import { parseSurveyConfig, readSurveyConfigParts, resolveSurvey, serializeSurveyConfig } from "./survey-config";

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const US = "https://pluginsurveys-us1.staffbase.com";

describe("resolveSurvey – alte Blöcke", () => {
  it("rendert einen Block ohne survey-config wie bisher", () => {
    expect(resolveSurvey({ "installation-id": A, "plugin-url": US })).toEqual({ installationId: A, pluginUrl: US });
    expect(resolveSurvey({ "installation-id": `https://x/surveys/${A}` })).toEqual({
      installationId: A,
      pluginUrl: DEFAULT_PLUGIN_URL,
    });
    expect(resolveSurvey({})).toEqual({ installationId: null, pluginUrl: DEFAULT_PLUGIN_URL });
  });

  it("behandelt ein leeres oder kaputtes survey-config wie ein fehlendes", () => {
    for (const raw of ["", "  ", "{kaputt", "[]", "42"]) {
      expect(resolveSurvey({ "survey-config": raw, "installation-id": A, "plugin-url": US })).toEqual({
        installationId: A,
        pluginUrl: US,
      });
    }
  });

  it("mischt je Schlüssel: neuer Wert vor Altattribut vor Vorgabe", () => {
    const onlyId = serializeSurveyConfig({ installationId: B, pluginUrl: "" });
    // Die Adresse ist leer geschrieben: das heißt Voreinstellung, nicht „Altwert gilt“.
    expect(resolveSurvey({ "survey-config": onlyId, "installation-id": A, "plugin-url": US })).toEqual({
      installationId: B,
      pluginUrl: DEFAULT_PLUGIN_URL,
    });
    // Fehlt ein Schlüssel im JSON ganz, gilt das Altattribut.
    const partial = JSON.stringify({ installationId: B });
    expect(resolveSurvey({ "survey-config": partial, "installation-id": A, "plugin-url": US })).toEqual({
      installationId: B,
      pluginUrl: US,
    });
  });
});

describe("parseSurveyConfig", () => {
  it("übernimmt beim ersten Öffnen die lesbaren Altwerte", () => {
    expect(parseSurveyConfig("", { "installation-id": A, "plugin-url": US })).toEqual({
      installationId: A,
      pluginUrl: US,
    });
  });

  it("nimmt Vorgaben, wo es weder Wert noch Altwert gibt", () => {
    expect(parseSurveyConfig("", {})).toEqual({ installationId: "", pluginUrl: DEFAULT_PLUGIN_URL });
  });

  it("lässt den eigenen Wert vor dem Altwert gelten", () => {
    const raw = serializeSurveyConfig({ installationId: B, pluginUrl: US });
    expect(parseSurveyConfig(raw, { "installation-id": A })).toEqual({ installationId: B, pluginUrl: US });
  });

  it("macht Öffnen ohne Änderung unsichtbar: gleicher Entwurf, gleiche Rohfassung", () => {
    const legacy = { "installation-id": A, "plugin-url": US };
    const first = parseSurveyConfig("", legacy);
    expect(serializeSurveyConfig(parseSurveyConfig(serializeSurveyConfig(first), legacy))).toBe(
      serializeSurveyConfig(first),
    );
  });
});

describe("serializeSurveyConfig", () => {
  it("macht aus einer eingefügten Adresse die reine ID", () => {
    const raw = serializeSurveyConfig({ installationId: `  https://x/surveys/${A.toUpperCase()}/ `, pluginUrl: " " + US + " " });
    expect(readSurveyConfigParts(raw)).toEqual({ installationId: A, pluginUrl: US });
  });

  it("behält Unlesbares getrimmt, statt es zu verwerfen", () => {
    expect(readSurveyConfigParts(serializeSurveyConfig({ installationId: " abc ", pluginUrl: "" }))).toEqual({
      installationId: "abc",
      pluginUrl: "",
    });
  });
});
