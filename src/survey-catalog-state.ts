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

/** Die Umfrageliste des Fensters: einmal laden, solange es offen ist. */

import * as React from "react";

import { EntityOption, fetchEntityCatalog } from "@shared/entity-picker/entity-catalog";

import { surveyCatalogSource } from "./survey-catalog";

export type SurveyCatalog =
  | { status: "loading" }
  | { status: "ready"; surveys: readonly EntityOption[] };

export type SurveyCatalogLoader = () => Promise<EntityOption[]>;

/** Woher die Liste kommt; offengelegt für Tests. */
export const DEFAULT_CATALOG_LOADER: SurveyCatalogLoader = () => fetchEntityCatalog(surveyCatalogSource);

export function useSurveyCatalog(load: SurveyCatalogLoader): SurveyCatalog {
  const [catalog, setCatalog] = React.useState<SurveyCatalog>({ status: "loading" });

  React.useEffect(() => {
    let current = true;
    load()
      .then((surveys) => current && setCatalog({ status: "ready", surveys }))
      // `fetchEntityCatalog` fängt Fehler schon ab; ein anderer Lader soll
      // trotzdem nur eine leere Liste kosten, nicht das Fenster.
      .catch(() => current && setCatalog({ status: "ready", surveys: [] }));
    return () => {
      current = false;
    };
  }, [load]);

  return catalog;
}
