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

/** The element the survey plugin registers and this widget places. */
export const SURVEY_ELEMENT = "survey-plugin-employee-block";

/** Where the survey plugin lives unless the author says otherwise. */
export const DEFAULT_PLUGIN_URL = "https://pluginsurveys-de1.staffbase.com";

/** The shape of a Staffbase backend id: 24 hex digits. */
const INSTALLATION_ID = /[0-9a-f]{24}/gi;

/**
 * Stand-ins for what the app would otherwise state about itself.
 *
 * They matter more than they look. The element takes the modern API path only
 * when base url, branch slug, distribution type, platform and version are all
 * present; with any of them missing it falls back to a path that authenticates
 * with a plugin token, which a widget has no way to obtain. The values
 * themselves only travel in the `Staffbase-App` header, so a stand-in costs
 * nothing — an empty attribute would cost the survey.
 */
const FALLBACK_BRANCH_SLUG = "staffbase";
const FALLBACK_APP_VERSION = "0.0.0";

/** What `widgetApi.getBranchInformation()` tells us, as far as it is needed. */
export interface BranchContext {
  slug?: string;
  webUrl?: string;
}

export interface SurveyAttributeInput {
  installationId: string;
  pluginUrl: string;
  branch: BranchContext | null;
  /** Die Sprache des Nutzers; ohne Angabe die des Dokuments. */
  locale?: string;
}

/**
 * The installation id out of whatever the author typed.
 *
 * A pasted survey URL is accepted as well: it is the obvious thing to copy out
 * of the address bar, and the id is the last run of hex digits in it.
 */
export function readInstallationId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const matches = raw.trim().match(INSTALLATION_ID);
  return matches === null ? null : matches[matches.length - 1].toLowerCase();
}

/**
 * Die Sprache, die das Dokument nennt — nicht die des Nutzers.
 *
 * Staffbase mischt beides: die Oberfläche folgt der Browsersprache, während
 * die Inhalte der Spracheinstellung des Nutzers folgen. Auf einer laufenden
 * App gemessen stand hier `de`, während der Nutzer auf `it_IT` eingestellt
 * war. Deshalb ist das hier nur der Rückfall für `fetchUserLocale`.
 */
export function documentLocale(): string {
  const meta = document.querySelector('meta[http-equiv="content-language"]');
  const candidates = [
    document.documentElement.getAttribute("lang"),
    meta?.getAttribute("content"),
    navigator.language,
  ];

  for (const candidate of candidates) {
    const locale = candidate?.trim().replace("-", "_");
    if (locale) return locale;
  }
  return "en_US";
}

/**
 * Die Spracheinstellung des Nutzers, wie die App sie führt.
 *
 * `SBUserProfile` aus dem Widget-SDK hat kein Sprachfeld, `/api/users/me` aber
 * schon (`config.locale`). Der Aufruf läuft same-origin mit der Sitzung des
 * Nutzers und kostet auf einer Seite mit Umfrage einen Request.
 *
 * Schlägt er fehl, tritt das Dokument an seine Stelle: eine Umfrage in der
 * falschen Sprache ist immer noch eine Umfrage, eine ausgefallene keine.
 */
export async function fetchUserLocale(): Promise<string> {
  try {
    const response = await fetch("/api/users/me", {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return documentLocale();

    const user = (await response.json()) as { config?: { locale?: string } };
    const locale = user.config?.locale?.trim().replace("-", "_");
    return locale || documentLocale();
  } catch {
    return documentLocale();
  }
}

/**
 * Everything the plugin's element expects, as the plugin's own page would set it.
 *
 * `installation-id` is written twice because the element reads
 * `data-installation-id` first and only then the plain spelling; writing both
 * makes the widget independent of which one a future version keeps.
 */
export function buildSurveyAttributes(input: SurveyAttributeInput): Record<string, string> {
  const { installationId, pluginUrl, branch, locale } = input;

  return {
    "installation-id": installationId,
    "data-installation-id": installationId,
    "api-url": pluginUrl,
    "data-app-base-url": branch?.webUrl || window.location.origin,
    "data-app-branch-slug": branch?.slug || FALLBACK_BRANCH_SLUG,
    "data-app-distribution-type": "web",
    "data-app-is-native": "false",
    "data-app-platform": "web",
    "data-app-version": FALLBACK_APP_VERSION,
    "data-is-preview": "false",
    "data-lang-informal": "false",
    "data-locale": locale ?? documentLocale(),
    dir: document.documentElement.getAttribute("dir") === "rtl" ? "rtl" : "ltr",
  };
}
