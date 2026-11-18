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

/**
 * Prüfung und Status des Fensters „Umfrage wählen“.
 *
 * Liegt im Seitenbündel, nicht beim nachgeladenen Editor: der Rahmen braucht
 * beides schon, bevor der Editor da ist. Darum nur reine Funktionen.
 */

import type { ValidationIssue } from "@man/config-ui/shell/shell-context";

import { readInstallationId, readPluginUrl } from "./survey-attributes";
import type { SurveyConfig } from "./survey-config";

export const SURVEY_ISSUE = "installation";
export const PLUGIN_ISSUE = "plugin";

export const SURVEY_ISSUE_TEXT = "Umfrage auswählen oder die ID bzw. Adresse der Umfrage eintragen";
export const PLUGIN_ISSUE_TEXT = "Adresse mit https:// angeben";

/** Eine Adresse, die der Browser als Web-Adresse lädt; leer heißt Voreinstellung. */
export function isValidPluginUrl(raw: string): boolean {
  if (raw.trim() === "") return true;
  try {
    const { protocol } = new URL(readPluginUrl(raw));
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Was fehlt, damit die Seite eine Umfrage zeigen kann. Ohne lesbare ID stünde
 * dort nur der Hinweis „Keine Installations-ID konfiguriert“.
 */
export function validateSurveyConfig(config: SurveyConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (readInstallationId(config.installationId) === null) {
    issues.push({ id: SURVEY_ISSUE, message: SURVEY_ISSUE_TEXT });
  }
  if (!isValidPluginUrl(config.pluginUrl)) issues.push({ id: PLUGIN_ISSUE, message: PLUGIN_ISSUE_TEXT });
  return issues;
}

/** Was sich gegenüber dem übernommenen Stand geändert hat: „Umfrage gewählt“, „Plugin-Adresse geändert“. */
export function surveyChangesStatus(draft: SurveyConfig, saved: SurveyConfig): string | undefined {
  const parts: string[] = [];
  if (readInstallationId(draft.installationId) !== readInstallationId(saved.installationId)) {
    parts.push("Umfrage gewählt");
  }
  if (readPluginUrl(draft.pluginUrl) !== readPluginUrl(saved.pluginUrl)) parts.push("Plugin-Adresse geändert");
  return parts.length === 0 ? undefined : parts.join(", ");
}
