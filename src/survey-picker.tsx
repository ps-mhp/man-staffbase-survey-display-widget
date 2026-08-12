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

import React, { useEffect } from "react";

import { SurveyOption } from "./survey-catalog";

/** The entry that hands the field back to manual entry. */
export const MANUAL_OPTION_VALUE = "__manual__";

export interface SurveyPickerProps {
  options: SurveyOption[];
  /** The id the widget is configured with, if any. */
  value: string;
  onChange: (id: string) => void;
  /** Called when the author should type the id instead of picking it. */
  onManual?: () => void;
  /** Whether the catalog is still on its way. */
  loading?: boolean;
}

/**
 * The arrow, inlined as a data URI.
 *
 * A separate file would have to survive bundling and be reachable from the CDN
 * the bundle was served from; a background image carried in the style needs
 * neither. Base64 rather than plain markup, because the raw form contains
 * quotes and angle brackets that some CSS parsers reject outright.
 */
const ARROW_ICON =
  "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMicgaGVpZ2h0PSc4JyB2aWV3Qm94PScwIDAgMTIgOCc+PHBhdGggZD0nTTEgMS41IDYgNi41bDUtNScgZmlsbD0nbm9uZScgc3Ryb2tlPScjNmI3MjgwJyBzdHJva2Utd2lkdGg9JzEuNzUnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWxpbmVqb2luPSdyb3VuZCcvPjwvc3ZnPg==)";

/**
 * Everything a select normally gets for free.
 *
 * The dialog's stylesheet resets control styling, which leaves the select
 * looking like a line of text — nothing about it invites a click. So the frame,
 * the background and the arrow are all spelled out here, matching the plain
 * text fields it sits among. Inline rather than in a stylesheet because the
 * element is mounted into the host's dialog, where no stylesheet of ours is
 * guaranteed to apply.
 */
const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 32px 8px 12px",
  boxSizing: "border-box",
  font: "inherit",
  fontSize: "14px",
  lineHeight: "1.4",
  color: "#111827",
  backgroundColor: "#ffffff",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  cursor: "pointer",
  appearance: "none",
  backgroundImage: ARROW_ICON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
};

const noticeStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "12px",
  color: "#6b7280",
};

/**
 * Picks a survey from the list, or steps aside so the id can be typed.
 *
 * Stepping aside is not a fallback for errors alone. An id that the list does
 * not contain — a survey outside this author's permissions, or one saved before
 * the list existed — must not be represented by an empty dropdown: the value
 * would look unset, and the next save would quietly drop it.
 */
export function SurveyPicker({
  options,
  value,
  onChange,
  onManual,
  loading = false,
}: SurveyPickerProps): React.JSX.Element | null {
  const known = options.some((option) => option.id === value);
  const stepAside = options.length === 0 || (value !== "" && !known);

  useEffect(() => {
    if (stepAside) onManual?.();
  }, [stepAside, onManual]);

  if (stepAside) {
    return loading || options.length > 0 ? null : (
      <p style={noticeStyle}>
        Die Liste der Umfragen konnte nicht geladen werden. Bitte die Installations-ID eintragen.
      </p>
    );
  }

  return (
    <select
      style={selectStyle}
      value={known ? value : ""}
      onChange={(event) => {
        if (event.target.value === MANUAL_OPTION_VALUE) {
          onManual?.();
          return;
        }
        onChange(event.target.value);
      }}
    >
      <option value="">Umfrage auswählen …</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.title}
        </option>
      ))}
      <option value={MANUAL_OPTION_VALUE}>Andere ID eingeben …</option>
    </select>
  );
}
