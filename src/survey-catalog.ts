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

/** Where the app lists the survey installations of a plugin. */
export const CATALOG_ENDPOINT = "/api/plugins/surveys/installations/search";

/**
 * How many surveys the list offers at most.
 *
 * Newest first, so the cut-off hits what an author is least likely to be
 * looking for; anything beyond it is still reachable by typing the id.
 */
const CATALOG_LIMIT = 100;

/** A survey as the configuration dialog needs to show it. */
export interface SurveyOption {
  id: string;
  title: string;
}

interface CatalogResponse {
  entries?: {
    data?: {
      id?: unknown;
      config?: { localization?: Record<string, { title?: unknown }> };
    };
  }[];
}

/**
 * The title to show, in the language the author is reading the page in.
 *
 * Falls back to English and then to whatever exists: a survey translated into
 * neither is still a survey the author may want to pick, and a blank row would
 * be worse than a foreign one.
 */
function pickTitle(localization: Record<string, { title?: unknown }> | undefined): string | null {
  if (!localization) return null;

  const documentLanguage = document.documentElement.getAttribute("lang") ?? "";
  const preferred = documentLanguage.trim().replace("-", "_");
  const base = preferred.split("_")[0].toLowerCase();

  const keys = Object.keys(localization);
  const byLanguage = keys.find((key) => key.split("_")[0].toLowerCase() === base && base !== "");

  for (const key of [preferred, byLanguage, "en_US", ...keys]) {
    const title = key === undefined ? undefined : localization[key]?.title;
    if (typeof title === "string" && title.trim() !== "") return title;
  }
  return null;
}

/**
 * The surveys this author may put into a widget.
 *
 * Never rejects. The dialog falls back to the plain id field when the list
 * stays empty, so a failed request costs a convenience — while an exception
 * here would take the whole configuration dialog with it.
 */
export async function fetchSurveyCatalog(): Promise<SurveyOption[]> {
  const query = new URLSearchParams({
    // Anything less than `manage` would offer surveys the author cannot
    // administer, which reads like a permission they do not have.
    permission: "manage",
    limit: String(CATALOG_LIMIT),
    sort: "created_DESC",
  });

  try {
    const response = await fetch(`${CATALOG_ENDPOINT}?${query}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];

    const body = (await response.json()) as CatalogResponse;
    const options: SurveyOption[] = [];

    for (const entry of body.entries ?? []) {
      const id = entry?.data?.id;
      if (typeof id !== "string" || id === "") continue;
      options.push({ id, title: pickTitle(entry.data?.config?.localization) ?? id });
    }
    return options;
  } catch {
    return [];
  }
}
