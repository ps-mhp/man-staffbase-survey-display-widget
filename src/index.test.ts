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

import {
  INSTALLATION_ID_ATTRIBUTE,
  PLUGIN_URL_ATTRIBUTE,
  readPluginUrl,
  stopSurveyPickerInjector,
} from "./index";
import { configurationSchema, uiSchema } from "./configuration-schema";
import { DEFAULT_PLUGIN_URL } from "./survey-attributes";

describe("the widget's attributes", () => {
  it("are exactly the keys the configuration schema stores under", () => {
    // The host saves a value under its schema key verbatim and reads it back
    // under the declared attribute. Any difference puts the value where
    // nothing looks.
    expect(Object.keys(configurationSchema.properties!)).toEqual([
      INSTALLATION_ID_ATTRIBUTE,
      PLUGIN_URL_ATTRIBUTE,
    ]);
    expect(INSTALLATION_ID_ATTRIBUTE).toBe(INSTALLATION_ID_ATTRIBUTE.toLowerCase());
    expect(PLUGIN_URL_ATTRIBUTE).toBe(PLUGIN_URL_ATTRIBUTE.toLowerCase());
  });

  it("are the keys the dialog's ui hints are filed under", () => {
    expect(Object.keys(uiSchema)).toEqual([INSTALLATION_ID_ATTRIBUTE, PLUGIN_URL_ATTRIBUTE]);
  });
});

describe("readPluginUrl", () => {
  it("takes a configured host", () => {
    expect(readPluginUrl("https://pluginsurveys-us1.staffbase.com")).toBe(
      "https://pluginsurveys-us1.staffbase.com",
    );
  });

  it("falls back to the default host when the field is left alone", () => {
    expect(readPluginUrl(undefined)).toBe(DEFAULT_PLUGIN_URL);
    expect(readPluginUrl("")).toBe(DEFAULT_PLUGIN_URL);
    expect(readPluginUrl("   ")).toBe(DEFAULT_PLUGIN_URL);
    expect(readPluginUrl(42)).toBe(DEFAULT_PLUGIN_URL);
  });
});

describe("the picker injector", () => {
  it("is started at module load and can be stopped again", () => {
    // The dialog may open before or after the bundle loads, so the injector
    // has to be watching from the start rather than triggered by a render.
    expect(typeof stopSurveyPickerInjector).toBe("function");
    stopSurveyPickerInjector();
  });
});
