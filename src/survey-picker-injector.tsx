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

import React, { useCallback, useEffect, useState } from "react";

import { setNativeFieldValue, startConfigFieldInjector } from "@shared/config-field-injector";

import * as catalog from "./survey-catalog";
import { SurveyOption } from "./survey-catalog";
import { SurveyPicker } from "./survey-picker";

/** The schema property whose field the picker takes over. */
const FIELD_KEY = "installation-id";

interface InjectedPickerProps {
  input: HTMLInputElement;
}

/**
 * Bridges the picker with the plain-DOM field RJSF owns.
 *
 * The field stays the single source of truth; this component only writes into
 * it. Hiding it is deliberate rather than removing it — RJSF keeps reading its
 * value on submit.
 */
function InjectedPicker({ input }: InjectedPickerProps): React.JSX.Element | null {
  const [options, setOptions] = useState<SurveyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    let current = true;
    catalog
      .fetchSurveyCatalog()
      .then((loaded) => {
        if (!current) return;
        setOptions(loaded);
        setLoading(false);
      })
      .catch(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  // The field belongs to RJSF, so its visibility is set as an effect of what is
  // shown here rather than during render.
  useEffect(() => {
    input.style.display = manual || loading ? "" : "none";
  }, [input, manual, loading]);

  const handleManual = useCallback(() => {
    setManual(true);
    input.focus();
  }, [input]);

  if (loading) return null;

  return (
    <SurveyPicker
      options={options}
      value={input.value}
      loading={loading}
      onChange={(id) => setNativeFieldValue(input, id)}
      onManual={handleManual}
    />
  );
}

/**
 * Watches for the widget's configuration dialog and puts a survey list in front
 * of its id field.
 *
 * The field is left visible on purpose: the picker hides it itself once the
 * catalog has arrived, and shows it again when the author chooses to type an
 * id. Hiding it here would blank the field for the moment the list is still on
 * its way — and permanently if it never arrives.
 *
 * @param root the subtree to watch; defaults to the document. Exposed for tests.
 * @returns a function that stops watching and unmounts the picker.
 */
export function startSurveyPickerInjector(root: ParentNode = document): () => void {
  return startConfigFieldInjector<HTMLInputElement>({
    fieldKey: FIELD_KEY,
    root,
    render: (input) => <InjectedPicker input={input} />,
  });
}
