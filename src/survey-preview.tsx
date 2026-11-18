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
 * Die Vorschau im Gerätrahmen des Fensters: eine Beispielansicht, keine echte
 * Umfrage.
 *
 * Die echte Anzeige lädt das Plugin der Umfragen-App und ruft die Umfrage ab –
 * beides gehört nicht ins Studio, und die Umfrage sähe dort ohnehin je nach
 * Teilnahme der Person anders aus. Die Beispielansicht zeigt, wie viel Platz
 * eine Umfrage auf der Seite braucht und welche gewählt ist.
 *
 * `inert`: nichts darin ist zu bedienen.
 */

import * as React from "react";

export interface SurveyPreviewProps {
  /** Titel der gewählten Umfrage; `null` ohne Wahl. */
  title: string | null;
}

const ANSWERS = ["Sehr zufrieden", "Eher zufrieden", "Eher unzufrieden", "Sehr unzufrieden"];
const SELECTED = 1;

export function SurveyPreview({ title }: SurveyPreviewProps): React.ReactElement {
  return (
    <div inert className="px-10 py-8 text-foreground" data-testid="survey-preview">
      <div className="flex max-w-[640px] flex-col gap-4 rounded-lg border border-border bg-background p-6">
        <span className="text-[13px] text-muted-foreground">
          {title ?? "Keine Umfrage gewählt"} · Beispielansicht
        </span>
        <h2 className="text-xl font-semibold">Wie zufrieden sind Sie mit der Zusammenarbeit in Ihrem Team?</h2>
        <div role="radiogroup" aria-label="Antwort" className="flex flex-col gap-2">
          {ANSWERS.map((answer, index) => (
            <span
              key={answer}
              className={
                index === SELECTED
                  ? "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm ring-2 ring-primary ring-inset"
                  : "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm ring-1 ring-border ring-inset"
              }
            >
              <span
                className={
                  index === SELECTED
                    ? "size-[18px] rounded-full border-[6px] border-primary"
                    : "size-[18px] rounded-full border-2 border-muted-foreground"
                }
              />
              {answer}
            </span>
          ))}
        </div>
        <span className="self-end rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          Weiter
        </span>
      </div>
    </div>
  );
}
