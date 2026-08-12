/*!
 * Copyright 2026, Staffbase SE and contributors.
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

import React from "react";

import * as loader from "./plugin-loader";
import * as surveyAttributes from "./survey-attributes";
import { BranchContext, SURVEY_ELEMENT } from "./survey-attributes";

const MISSING_ID =
  "Keine Installations-ID konfiguriert. Bitte die ID der Umfrage in den Widget-Einstellungen eintragen.";

interface SurveyViewProps {
  installationId: string | null;
  pluginUrl: string;
  branch: BranchContext | null;
}

type State =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

/**
 * A single Staffbase survey, rendered by the survey plugin itself.
 *
 * The element is created by hand rather than written as JSX, and its
 * attributes are set before it enters the document. The plugin reads all of
 * them in `connectedCallback` and never again, so an element that is inserted
 * first and configured afterwards renders once with nothing to go on.
 */
export function SurveyView({ installationId, pluginUrl, branch }: SurveyViewProps): React.JSX.Element {
  const host = React.useRef<HTMLDivElement>(null);
  const [state, setState] = React.useState<State>(
    installationId === null ? { status: "error", message: MISSING_ID } : { status: "loading" },
  );

  React.useEffect(() => {
    if (installationId === null) {
      setState({ status: "error", message: MISSING_ID });
      return;
    }

    // A changed configuration makes the running load's outcome the wrong one;
    // the flag keeps it from writing over the newer state.
    let current = true;
    setState({ status: "loading" });

    // Sprache und Bundle zusammen: die Sprache ist ein eigener Request und
    // haette nacheinander die Wartezeit verdoppelt.
    Promise.all([loader.loadSurveyPlugin(pluginUrl), surveyAttributes.fetchUserLocale()])
      .then(([, locale]) => {
        if (!current || host.current === null) return;

        const element = document.createElement(SURVEY_ELEMENT);
        const attributes = surveyAttributes.buildSurveyAttributes({
          installationId,
          pluginUrl,
          branch,
          locale,
        });
        for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);

        host.current.replaceChildren(element);
        setState({ status: "ready" });
      })
      .catch((error: unknown) => {
        if (!current) return;
        const reason = error instanceof Error ? error.message : String(error);
        setState({ status: "error", message: `Umfrage konnte nicht geladen werden: ${reason}` });
      });

    return () => {
      current = false;
    };
  }, [installationId, pluginUrl, branch?.slug, branch?.webUrl]);

  return (
    <div className="survey-display" data-testid="survey-display">
      {state.status === "loading" && <p className="survey-display__status">Umfrage wird geladen …</p>}
      {state.status === "error" && (
        <p className="survey-display__error" role="alert">
          {state.message}
        </p>
      )}
      <div ref={host} />
    </div>
  );
}
