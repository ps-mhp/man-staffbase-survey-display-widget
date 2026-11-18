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
 * Das Fenster „Umfrage wählen“ im gemeinsamen Rahmen von `@man/config-ui`,
 * eingehängt in den RJSF-Dialog: Ausgangsstand aus den alten Feldern, erstes
 * Übernehmen nach `survey-config`, Prüfung, Ausblenden der alten Felder nur
 * im eigenen Dialog, Nachladen des Editors.
 */

import * as React from "react";
import { ListChecks } from "lucide-react";

import { FieldModalShellOptions, startFieldModalInjector } from "@shared/config-modal";
import { legacyFieldsFromSchema, readLegacyFields, startHiddenFields } from "@shared/legacy-fields";

import { LEGACY_ATTRIBUTES, SURVEY_CONFIG_ATTRIBUTE, configurationSchema } from "./configuration-schema";
import { LegacySurveyAttributes, SurveyConfig, parseSurveyConfig, serializeSurveyConfig } from "./survey-config";
import { surveyChangesStatus, validateSurveyConfig } from "./survey-editor-rules";

const LEGACY_FIELDS = legacyFieldsFromSchema(LEGACY_ATTRIBUTES, configurationSchema);

/** Die alten Felder, wie der eigene Dialog sie gerade führt. */
const readLegacyFromDialog = (root: ParentNode): LegacySurveyAttributes =>
  readLegacyFields(LEGACY_FIELDS, SURVEY_CONFIG_ATTRIBUTE, root).values as LegacySurveyAttributes;

/**
 * Der Editor kommt erst, wenn das Fenster aufgeht: Tailwind und react-aria
 * gehören nicht in das Seitenbündel, das jede Leserin lädt.
 */
const LazySurveyEditor = React.lazy(() =>
  import("./survey-editor").then((module) => ({ default: module.SurveyEditor })),
);

const LOADING = <p className="p-6 text-sm text-muted-foreground">Editor wird geladen …</p>;

/** Tasten und den Satz zu „Übernehmen“ ergänzt der Rahmen selbst. */
const HELP = (
  <ul className="flex list-disc flex-col gap-2 pl-5">
    <li>
      Links die <strong>Umfrage</strong> wählen. Die Liste zeigt die Umfragen, die Sie verwalten dürfen; die Suche
      darüber filtert nach dem Titel.
    </li>
    <li>
      Fehlt eine Umfrage oder lädt die Liste nicht, lässt sich rechts unter „Inhalt“ die ID oder die ganze Adresse der
      Umfrage einfügen.
    </li>
    <li>
      Die <strong>Adresse des Plugins</strong> unter „Erweitert“ ist eine technische Einstellung und bleibt in aller
      Regel unverändert.
    </li>
    <li>
      Desktop, Tablet und Mobil zeigen eine Beispielansicht; die echte Umfrage erscheint erst auf der Seite, so wie
      die Umfragen-App sie darstellt.
    </li>
  </ul>
);

/** Was der gemeinsame Rahmen von der Umfrage-Anzeige wissen muss. Offengelegt für Tests. */
export const surveyEditorShell: FieldModalShellOptions<SurveyConfig> = {
  widgetName: "Umfrage-Anzeige",
  title: "Umfrage wählen",
  icon: ListChecks,
  preview: true,
  help: HELP,
  statusText: surveyChangesStatus,
  validate: validateSurveyConfig,
};

/**
 * Hängt das Fenster an das Feld `survey-config` und blendet die alten Felder
 * aus. Gibt eine Funktion zurück, die beides wieder aufhebt.
 */
export function startSurveyDialog(root: ParentNode = document): () => void {
  const stopModal = startFieldModalInjector<SurveyConfig>({
    fieldKey: SURVEY_CONFIG_ATTRIBUTE,
    root,
    reopenLabel: "Umfrage wählen",
    modalTestId: "survey-editor-modal",
    reopenTestId: "survey-editor-reopen",
    parse: (raw) => parseSurveyConfig(raw, readLegacyFromDialog(root)),
    serialize: serializeSurveyConfig,
    shell: surveyEditorShell,
    render: ({ value, onChange }) => (
      <React.Suspense fallback={LOADING}>
        <LazySurveyEditor value={value} onChange={onChange} />
      </React.Suspense>
    ),
  });
  const stopHiding = startHiddenFields(LEGACY_ATTRIBUTES, SURVEY_CONFIG_ATTRIBUTE, root);
  return () => {
    stopModal();
    stopHiding();
  };
}
