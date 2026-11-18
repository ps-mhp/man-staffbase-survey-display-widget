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
 * Die linke Spalte des Fensters „Umfrage wählen“: oben die Suche, darunter
 * die Umfragen, die die Autorin verwalten darf. Ein Klick wählt die Umfrage.
 *
 * Jeder Zustand ist zu sehen – Laden, keine Umfragen, keine Treffer. Eine
 * stumm leere Spalte sähe aus wie ein kaputtes Fenster.
 */

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@man/config-ui/primitives/input";
import { ItemList, ListItem } from "@man/config-ui/sidebar/item-list";
import { SidebarPanel } from "@man/config-ui/sidebar/sidebar-panel";

import type { SurveyCatalog } from "./survey-catalog-state";

export interface SurveySidebarProps {
  catalog: SurveyCatalog;
  /** Die gewählte ID, lesbar gemacht; `null` ohne Wahl. */
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const SEARCH_LABEL = "Umfrage suchen";

const EMPTY_TEXT =
  "Keine Umfragen gefunden. Die Liste zeigt nur Umfragen, die Sie verwalten dürfen – die ID oder Adresse lässt sich rechts von Hand eintragen.";

/** Die Zeile kennt nur den Titel; zur Unterscheidung gleich benannter Umfragen steht das Ende der ID darunter. */
const descriptionOf = (id: string): string => `ID …${id.slice(-6)}`;

/** Das Suchfeld; Escape leert es zuerst, erst ein leeres Feld lässt Escape an den Rahmen. */
function SurveySearch({ query, onQueryChange }: { query: string; onQueryChange: (query: string) => void }): React.ReactElement {
  return (
    <div className="sticky top-0 z-10 -mx-2 bg-muted px-4 pb-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          aria-label={SEARCH_LABEL}
          placeholder={SEARCH_LABEL}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Escape" || query === "") return;
            event.preventDefault();
            onQueryChange("");
          }}
          className="h-10 bg-background pl-[38px]"
        />
      </div>
    </div>
  );
}

function itemsOf(catalog: SurveyCatalog, query: string): ListItem[] {
  if (catalog.status !== "ready") return [];
  const needle = query.trim().toLowerCase();
  return catalog.surveys
    .filter((survey) => needle === "" || survey.title.toLowerCase().includes(needle) || survey.id.includes(needle))
    .map((survey) => ({ id: survey.id, label: survey.title, description: descriptionOf(survey.id) }));
}

function emptyTextOf(catalog: SurveyCatalog, query: string): string {
  if (catalog.status === "loading") return "Umfragen werden geladen …";
  return query.trim() === "" ? EMPTY_TEXT : `Keine Treffer für „${query.trim()}“`;
}

export function SurveySidebar({ catalog, selectedId, onSelect }: SurveySidebarProps): React.ReactElement {
  const [query, setQuery] = React.useState("");
  const items = itemsOf(catalog, query);
  const total = catalog.status === "ready" ? catalog.surveys.length : undefined;

  return (
    <SidebarPanel title="Umfragen" count={total}>
      <SurveySearch query={query} onQueryChange={setQuery} />
      <ItemList
        aria-label="Umfragen"
        items={items}
        selectedId={selectedId}
        onSelect={onSelect}
        emptyState={emptyTextOf(catalog, query)}
      />
    </SidebarPanel>
  );
}
