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

import { UiSchema } from "@rjsf/utils";
import { JSONSchema7 } from "json-schema";

import { DEFAULT_PLUGIN_URL } from "./survey-attributes";

/**
 * Die Namen, unter denen die Konfiguration läuft.
 *
 * Jeder muss an drei Stellen gleich geschrieben sein: als Schlüssel im
 * Konfigurationsschema, als beim Host angemeldetes Attribut und beim
 * Zurücklesen in `index.tsx`. Es sind zugleich die Attribute, die dieses
 * Widget in `widgets.json` führt: der Host speichert einen Wert wörtlich unter
 * seinem Schema-Schlüssel, liest ihn unter dem angemeldeten Namen vom Element
 * zurück und verwirft ein Attribut, das ihm nie genannt wurde.
 */

/** Die ganze Konfiguration in einem Feld — siehe `survey-config.ts`. */
export const SURVEY_CONFIG_ATTRIBUTE = "survey-config";
export const INSTALLATION_ID_ATTRIBUTE = "installation-id";
export const PLUGIN_URL_ATTRIBUTE = "plugin-url";

/**
 * Die Einzelfelder älterer Fassungen. Sie bleiben im Schema, damit der Dialog
 * ihre Werte weiter führt und Blöcke ohne `survey-config` unverändert
 * rendern; im Dialog sind sie ausgeblendet (`@shared/legacy-fields`).
 */
export const LEGACY_ATTRIBUTES = [INSTALLATION_ID_ATTRIBUTE, PLUGIN_URL_ATTRIBUTE] as const;

/**
 * Schema für den Konfigurationsdialog.
 *
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/
 */
export const configurationSchema: JSONSchema7 = {
  properties: {
    [SURVEY_CONFIG_ATTRIBUTE]: {
      type: "string",
      title: "Umfrage-Anzeige",
      default: "",
    },
    [INSTALLATION_ID_ATTRIBUTE]: {
      type: "string",
      title: "Installations-ID der Umfrage",
    },
    [PLUGIN_URL_ATTRIBUTE]: {
      type: "string",
      title: "Adresse des Umfragen-Plugins",
      default: DEFAULT_PLUGIN_URL,
    },
  },
};

/** Alle Attribute, in der Reihenfolge des Schemas. */
export const ALL_ATTRIBUTES: string[] = Object.keys(configurationSchema.properties ?? {});

/**
 * @see https://rjsf-team.github.io/react-jsonschema-form/docs/api-reference/uiSchema
 */
export const uiSchema: UiSchema = {
  [SURVEY_CONFIG_ATTRIBUTE]: {
    "ui:help":
      "Die Umfrage wird im Fenster „Umfrage wählen“ gewählt; das Textfeld dahinter ist die Rohfassung.",
  },
};
