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
 * Die Formularteile des Fensters: die Umfrage (ID oder Adresse von Hand) und
 * die Adresse des Plugins. Wie im Screen sitzen sie in den Reitern „Inhalt“
 * und „Erweitert“ des Inspektors; Fehler zeigen sie erst, nachdem
 * „Übernehmen“ an ihnen gescheitert ist.
 */

import * as React from "react";
import { Field } from "@man/config-ui/form/field";
import { Input } from "@man/config-ui/primitives/input";
import { useConfigShell } from "@man/config-ui/shell/shell-context";

import { DEFAULT_PLUGIN_URL } from "./survey-attributes";
import type { SurveyConfig } from "./survey-config";
import { PLUGIN_ISSUE, SURVEY_ISSUE, validateSurveyConfig } from "./survey-editor-rules";

export interface SectionProps {
  value: SurveyConfig;
  onChange: (value: SurveyConfig) => void;
}

/** Die Meldung zu `id`, aber erst, wenn „Übernehmen“ an ihr gescheitert ist. */
export function useIssue(value: SurveyConfig, id: string): string | undefined {
  const { issuesVisible } = useConfigShell();
  if (!issuesVisible) return undefined;
  return validateSurveyConfig(value).find((issue) => issue.id === id)?.message;
}

export function ContentSection({ value, onChange }: SectionProps): React.ReactElement {
  const error = useIssue(value, SURVEY_ISSUE);
  return (
    <div className="flex flex-col gap-6">
      <Field
        label="Installations-ID der Umfrage"
        required
        error={error}
        hint="Normalerweise links in der Liste wählen. Alternativ die ID – die 24-stellige Zeichenfolge am Ende der Umfragen-Adresse – oder die ganze Adresse einfügen."
      >
        <Input
          type="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="z. B. 5f1c… oder die Adresse der Umfrage"
          value={value.installationId}
          onChange={(event) => onChange({ ...value, installationId: event.target.value })}
        />
      </Field>
      <p className="text-[13px] text-muted-foreground">
        Die Umfrage selbst wählen Sie links. Fragen, Laufzeit und Ergebnisse pflegen Sie im Umfrage-Plugin des Studios.
      </p>
    </div>
  );
}

export function AdvancedSection({ value, onChange }: SectionProps): React.ReactElement {
  const error = useIssue(value, PLUGIN_ISSUE);
  return (
    <Field
      label="Adresse des Umfragen-Plugins"
      error={error}
      hint={`Technische Einstellung. Nur ändern, wenn die Umfragen-App in einer anderen Region liegt – das weiß die IT. Voreingestellt ist ${DEFAULT_PLUGIN_URL}.`}
    >
      <Input
        type="url"
        autoComplete="off"
        spellCheck={false}
        placeholder={DEFAULT_PLUGIN_URL}
        value={value.pluginUrl}
        onChange={(event) => onChange({ ...value, pluginUrl: event.target.value })}
      />
    </Field>
  );
}
