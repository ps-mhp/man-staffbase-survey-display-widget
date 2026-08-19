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

import { registerDocsExamples } from "@shared/docs/register-docs-examples";
import { fetchEntityCatalog } from "@shared/entity-picker/entity-catalog";
import { surveyCatalogSource } from "./survey-catalog";

/** The first non-disabled option, or the first option if all are disabled. */
function firstUsableId(options: { id: string; disabled?: boolean }[]): string | null {
  return options.find((option) => !option.disabled)?.id ?? options[0]?.id ?? null;
}

/**
 * The pragmatic "first available entity" rule: reuses the same catalog
 * source the widget's own config dialog picker uses (`survey-catalog.ts`),
 * so the docs example is only ever able to pick a survey the current user
 * could also have picked by hand.
 */
registerDocsExamples("survey-display-widget", async () => {
  const surveys = await fetchEntityCatalog(surveyCatalogSource);
  const installationId = firstUsableId(surveys);
  const attributes: Record<string, string> = {};
  if (installationId) attributes["installation-id"] = installationId;
  return attributes;
});
