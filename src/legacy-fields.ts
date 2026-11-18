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
 * Die Einzelfelder älterer Fassungen im Staffbase-Dialog: lesen und ausblenden.
 *
 * Sie bleiben im Schema, damit der Dialog ihre Werte weiter führt — das
 * Fenster übernimmt sie beim ersten Öffnen als Ausgangsstand. Zu sehen sollen
 * sie nicht mehr sein: zwei Wege zum selben Wert laden zu Widersprüchen ein.
 *
 * Gefunden wird jedes Feld über das, was RJSF und der Content Designer gleich
 * vergeben: `id="root_<key>"` am Eingabeelement oder `for="root_<key>"` an
 * seiner Beschriftung. Ausgeblendet wird die ganze Zeile: der größte
 * Vorfahre, der kein anderes Feld enthält.
 *
 * Nur im eigenen Dialog: dem Formular, das das eigene Feld
 * (`survey-config`) führt. Studio lädt alle Widget-Bündel in dasselbe
 * Dokument, und `root_<key>` ist widgetübergreifend.
 */

import { configFieldSelector } from "@shared/config-field-injector";

import { LEGACY_ATTRIBUTES, SURVEY_CONFIG_ATTRIBUTE } from "./configuration-schema";
import type { LegacySurveyAttributes } from "./survey-config";

const FIELD_MARK = '[id^="root_"], label[for^="root_"]';

const fieldKeyOf = (element: Element): string =>
  element instanceof HTMLLabelElement ? element.htmlFor : element.id;

function rowOf(anchor: Element): HTMLElement {
  const key = fieldKeyOf(anchor);
  let row = anchor as HTMLElement;
  while (row.parentElement !== null && row.parentElement.tagName !== "FORM") {
    const parent = row.parentElement;
    const foreign = Array.from(parent.querySelectorAll(FIELD_MARK)).some((node) => fieldKeyOf(node) !== key);
    if (foreign) break;
    row = parent;
  }
  return row;
}

function anchorOf(root: ParentNode, key: string): Element | null {
  const id = `root_${key}`;
  return root.querySelector(`[id="${id}"]`) ?? root.querySelector(`label[for="${id}"]`);
}

/** Die Formulare, die das eigene Feld führen — nur dort wird gelesen und ausgeblendet. */
function ownForms(root: ParentNode, ownKey: string): HTMLFormElement[] {
  const forms = Array.from(root.querySelectorAll(`[id="root_${ownKey}"]`)).map((field) => field.closest("form"));
  return Array.from(new Set(forms.filter((form): form is HTMLFormElement => form !== null)));
}

/**
 * Blendet die Zeilen der Einzelfelder aus und hält sie ausgeblendet, auch
 * wenn der Dialog sie neu zeichnet. Gibt die Zeilen beim Beenden wieder frei.
 */
export function startHiddenFields(keys: readonly string[], ownKey: string, root: ParentNode = document): () => void {
  const hidden = new Set<HTMLElement>();

  const apply = (): void => {
    for (const form of ownForms(root, ownKey)) {
      for (const key of keys) {
        const anchor = anchorOf(form, key);
        if (anchor === null) continue;
        const row = rowOf(anchor);
        if (row.style.display !== "none") row.style.display = "none";
        hidden.add(row);
      }
    }
  };

  apply();
  const observer = new MutationObserver(apply);
  const target = root === document ? document.body : (root as Node);
  observer.observe(target, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    hidden.forEach((row) => {
      row.style.display = "";
    });
    hidden.clear();
  };
}

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const isFormField = (element: Element | null | undefined): element is FormField =>
  element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement;

/** Das Eingabeelement hinter einem Schlüssel; `null`, wenn der Dialog keins liefert. */
function valueElementOf(form: ParentNode, key: string): FormField | null {
  const element = form.querySelector(configFieldSelector(key));
  if (isFormField(element)) return element;
  const named = form.querySelector(`[name="root_${key}"]`);
  return isFormField(named) ? named : null;
}

/**
 * Die Einzelfelder, wie der eigene Dialog sie gerade führt; leer ohne eigenen
 * Dialog. Beides sind Textfelder und damit lesbar; was sich nicht lesen
 * lässt, fehlt im Ergebnis – dann gilt später weiter das Altattribut.
 */
export function readLegacyFromDialog(root: ParentNode = document): LegacySurveyAttributes {
  const [form] = ownForms(root, SURVEY_CONFIG_ATTRIBUTE);
  if (form === undefined) return {};
  return Object.fromEntries(
    LEGACY_ATTRIBUTES.flatMap((key) => {
      const element = valueElementOf(form, key);
      return element === null ? [] : [[key, element.value]];
    }),
  );
}
