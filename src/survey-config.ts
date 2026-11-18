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

import { decodePayload, encodePayload } from "@shared/payload";

import { DEFAULT_PLUGIN_URL, readInstallationId, readPluginUrl } from "./survey-attributes";

/** Was das Fenster bearbeitet. Beide Werte stehen so, wie sie getippt wurden. */
export interface SurveyConfig {
  /** Die ID oder eine eingefügte Umfragen-Adresse; leer, solange nichts gewählt ist. */
  installationId: string;
  /** Leer heißt „Voreinstellung“. */
  pluginUrl: string;
}

/** Die zwei Einzelfelder bis 0.3.0-rc.2, so wie sie am Element ankommen. */
export interface LegacySurveyAttributes {
  "installation-id"?: unknown;
  "plugin-url"?: unknown;
}

/** Was `survey-config` selbst enthält; ein fehlender Schlüssel lässt das Altattribut gelten. */
export type SurveyConfigParts = Partial<SurveyConfig>;

export const DEFAULT_SURVEY_CONFIG: SurveyConfig = { installationId: "", pluginUrl: DEFAULT_PLUGIN_URL };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Die Schlüssel, die `survey-config` wirklich trägt. `null` bei leerem oder
 * unbrauchbarem Wert – dann gilt allein das Altattribut.
 */
export function readSurveyConfigParts(raw: string): SurveyConfigParts | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = parseJson(decodePayload(trimmed) ?? trimmed);
  if (!isRecord(value)) return null;
  return {
    ...(typeof value.installationId === "string" ? { installationId: value.installationId } : {}),
    ...(typeof value.pluginUrl === "string" ? { pluginUrl: value.pluginUrl } : {}),
  };
}

const textOf = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);

/** Je Schlüssel: neuer Wert, sonst Altattribut, sonst Vorgabe. */
function mergeConfig(parts: SurveyConfigParts | null, legacy: LegacySurveyAttributes): SurveyConfig {
  return {
    installationId: parts?.installationId ?? textOf(legacy["installation-id"]) ?? DEFAULT_SURVEY_CONFIG.installationId,
    pluginUrl: parts?.pluginUrl ?? textOf(legacy["plugin-url"]) ?? DEFAULT_SURVEY_CONFIG.pluginUrl,
  };
}

/** Der Ausgangsstand des Fensters: `survey-config`, je Schlüssel ergänzt um die Einzelfelder des Dialogs. */
export function parseSurveyConfig(raw: string, legacy: LegacySurveyAttributes): SurveyConfig {
  return mergeConfig(readSurveyConfigParts(raw), legacy);
}

/**
 * Schreibt `survey-config`, kodiert wie die übrigen JSON-Attribute
 * (`@shared/payload`). Eine eingefügte Adresse wird dabei zur reinen ID.
 */
export function serializeSurveyConfig(config: SurveyConfig): string {
  const installationId = readInstallationId(config.installationId) ?? config.installationId.trim();
  return encodePayload(JSON.stringify({ installationId, pluginUrl: config.pluginUrl.trim() }));
}

/** Was die Ansicht braucht: lesbare ID (oder `null`) und Adresse des Plugins. */
export interface ResolvedSurvey {
  installationId: string | null;
  pluginUrl: string;
}

/**
 * Was gilt: je Schlüssel `survey-config`, sonst das Einzelfeld, sonst die
 * Vorgabe. Ein Block ohne `survey-config` rendert damit wie vor dem Umbau.
 */
export function resolveSurvey(attrs: LegacySurveyAttributes & { "survey-config"?: unknown }): ResolvedSurvey {
  const raw = attrs["survey-config"];
  const config = mergeConfig(typeof raw === "string" ? readSurveyConfigParts(raw) : null, attrs);
  return {
    installationId: readInstallationId(config.installationId),
    pluginUrl: readPluginUrl(config.pluginUrl),
  };
}
