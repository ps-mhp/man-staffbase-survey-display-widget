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
 * Der Rumpf des Fensters „Umfrage wählen“ im gemeinsamen Rahmen von
 * `@man/config-ui`: links die Umfragen mit Suche, in der Mitte die gewählte
 * Umfrage samt Beispielansicht, rechts der Inspektor mit den Reitern „Inhalt“
 * und „Erweitert“. In den Geräteansichten steht die Beispielansicht im
 * Geräterahmen.
 *
 * Nur im Studio nachgeladen (`survey-dialog.tsx`): er bringt react-aria und
 * Tailwind mit, und das hat im Seitenbündel, das jede Leserin lädt, nichts
 * verloren. Kopf, Übernehmen, Rückgängig und Rückfrage kommen vom Rahmen.
 */

import * as React from "react";
import { InspectorPanel, InspectorTab } from "@man/config-ui/inspector/inspector-panel";
import { ConfigWorkspace } from "@man/config-ui/layout/config-workspace";

import { useEntityCatalog } from "@shared/entity-picker/use-entity-catalog";

import { readInstallationId } from "./survey-attributes";
import { DEFAULT_CATALOG_LOADER, SurveyCatalog, SurveyCatalogLoader } from "./survey-catalog-state";
import type { SurveyConfig } from "./survey-config";
import { PLUGIN_ISSUE } from "./survey-editor-rules";
import { AdvancedSection, ContentSection, useIssue } from "./survey-editor-sections";
import { SurveyPreview } from "./survey-preview";
import { SurveySidebar } from "./survey-sidebar";

export interface SurveyEditorProps {
  value: SurveyConfig;
  onChange: (value: SurveyConfig) => void;
  /** Woher die Umfragen kommen; offengelegt für Tests. */
  loadSurveys?: SurveyCatalogLoader;
}

/** Titel der gewählten Umfrage, sofern sie in der Liste steht. */
function titleOf(catalog: SurveyCatalog, id: string | null): string | null {
  if (id === null || catalog.status !== "ready") return null;
  return catalog.items.find((survey) => survey.id === id)?.title ?? null;
}

/** Eine kleine Marke am Reiter „Erweitert“, solange dort ein Fehler wartet. */
function AdvancedBadge({ value }: { value: SurveyConfig }): React.ReactElement | null {
  if (useIssue(value, PLUGIN_ISSUE) === undefined) return null;
  return (
    <span aria-label="Fehler" className="size-2 rounded-full bg-destructive" />
  );
}

function Heading({ id, title }: { id: string | null; title: string | null }): React.ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] text-muted-foreground">Umfrage</span>
      <h2 className="text-xl font-semibold text-foreground">{title ?? (id === null ? "Keine Umfrage gewählt" : "Umfrage nicht in der Liste")}</h2>
      {id !== null && <span className="text-[13px] text-muted-foreground">ID {id}</span>}
    </div>
  );
}

export function SurveyEditor({ value, onChange, loadSurveys = DEFAULT_CATALOG_LOADER }: SurveyEditorProps): React.ReactElement {
  const catalog = useEntityCatalog(loadSurveys);
  const id = readInstallationId(value.installationId);
  const title = titleOf(catalog, id);

  const tabs: InspectorTab[] = [
    { id: "content", label: "Inhalt", content: <ContentSection value={value} onChange={onChange} /> },
    {
      id: "advanced",
      label: "Erweitert",
      badge: <AdvancedBadge value={value} />,
      content: <AdvancedSection value={value} onChange={onChange} />,
    },
  ];

  return (
    <ConfigWorkspace
      sidebar={
        <SurveySidebar
          catalog={catalog}
          selectedId={id}
          onSelect={(next) => onChange({ ...value, installationId: next })}
        />
      }
      preview={<SurveyPreview title={title} />}
      inspector={<InspectorPanel title="Einstellungen" tabs={tabs} />}
    >
      <div className="flex max-w-[720px] flex-col gap-6 px-10 pt-6 pb-12" data-testid="survey-editor">
        <Heading id={id} title={title} />
        <SurveyPreview title={title} />
      </div>
    </ConfigWorkspace>
  );
}
