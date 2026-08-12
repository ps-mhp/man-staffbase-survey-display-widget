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

import { UiSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";

import { DEFAULT_PLUGIN_URL } from "./survey-attributes";

/**
 * Schema for the widget's configuration dialog.
 *
 * The keys are byte-identical to the declared attributes and to the entry in
 * `widgets.json`: the host saves a value under its schema key verbatim and
 * reads it back off the element under the declared attribute name, and it
 * drops an attribute it was never told about.
 *
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    "installation-id": {
      type: "string",
      title: "Installations-ID der Umfrage",
    },
    "plugin-url": {
      type: "string",
      title: "Adresse des Umfragen-Plugins",
      default: DEFAULT_PLUGIN_URL,
    },
  },
};

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  "installation-id": {
    "ui:help":
      "ID der Umfragen-Installation — die 24-stellige Zeichenfolge am Ende der Umfragen-URL. " +
      "Die vollständige URL kann ebenfalls eingefügt werden.",
  },
  "plugin-url": {
    "ui:help":
      "Nur ändern, wenn die App in einer anderen Region liegt. Voreingestellt ist " +
      `${DEFAULT_PLUGIN_URL}.`,
  },
};
