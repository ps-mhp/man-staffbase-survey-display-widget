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
 * Das Fenster „Umfrage wählen“ im gemeinsamen Rahmen, eingehängt in einen
 * echten RJSF-Dialog: Ausgangsstand aus den alten Feldern, erstes Übernehmen
 * nach `survey-config`, Prüfung, Ausblenden nur im eigenen Dialog, Nachladen.
 */

import * as React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { modalRoot, settleModal, settleEditor, clickElement } from "@shared/ui/config-modal.testing";
import { configurationSchema } from "./configuration-schema";
import { DEFAULT_PLUGIN_URL } from "./survey-attributes";
import { readSurveyConfigParts, resolveSurvey } from "./survey-config";
import { startSurveyDialog, surveyEditorShell } from "./survey-dialog";

const EDITOR_SELECTOR = "Pulscheck";

const mockEditorLoaded = jest.fn();
jest.mock("./survey-editor", () => {
  mockEditorLoaded();
  return jest.requireActual("./survey-editor");
});

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const US = "https://pluginsurveys-us1.staffbase.com";

/** Die Umfrageliste, wie die App sie liefert: zwei Umfragen. */
function answer(url: string): Response {
  if (url.startsWith("/api/plugins/surveys/installations/search")) {
    return Response.json({
      entries: [
        { data: { id: A, config: { localization: { de_DE: { title: "Mitarbeiterbefragung" } } } } },
        { data: { id: B, config: { localization: { de_DE: { title: "Pulscheck" } } } } },
      ],
    });
  }
  return new Response("{}", { status: 404 });
}

beforeEach(() => {
  jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => answer(String(input)));
});

afterEach(() => {
  jest.restoreAllMocks();
});

const fieldValue = (container: HTMLElement): string =>
  container.querySelector<HTMLInputElement>("#survey #root_survey-config")!.value;

const inModal = (selector: string): HTMLElement | null => modalRoot()?.querySelector<HTMLElement>(selector) ?? null;

const rowNamed = (name: string): Element | null =>
  Array.from(modalRoot()?.querySelectorAll('[role="row"]') ?? []).find((row) => row.textContent?.includes(name)) ?? null;

/** Der eigene Dialog neben einem fremden mit gleichem Feldnamen (`plugin-url`). */
function Dialogs({ formData }: { formData: Record<string, string> }): React.ReactElement {
  return (
    <>
      <div id="survey">
        <Form schema={configurationSchema} validator={validator} formData={formData} />
      </div>
      <form id="foreign">
        <div data-row="plugin-url">
          <label htmlFor="root_plugin-url">Fremd</label>
          <input id="root_plugin-url" defaultValue="x" />
        </div>
      </form>
    </>
  );
}

async function open(formData: Record<string, string>): Promise<{ container: HTMLElement; stop: () => void }> {
  const { container } = render(<Dialogs formData={formData} />);
  let stop = (): void => {};
  await act(async () => {
    stop = startSurveyDialog(container);
  });
  await settleEditor(EDITOR_SELECTOR);
  return { container, stop };
}

describe("Nachladen", () => {
  // Muss zuerst laufen: einmal geladen, bleibt das Modul im Speicher.
  it("lädt den Editor erst, wenn ein eigener Dialog erscheint", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    const stop = startSurveyDialog(container);
    await settleModal();

    expect(mockEditorLoaded).not.toHaveBeenCalled();
    await act(async () => stop());
    container.remove();

    const opened = await open({});
    expect(mockEditorLoaded).toHaveBeenCalledTimes(1);
    expect(inModal('[data-testid="survey-editor"]')).not.toBeNull();
    await act(async () => opened.stop());
  });
});

describe("startSurveyDialog", () => {
  it("öffnet das Fenster im gemeinsamen Rahmen mit Vorschau-Umschalter und Umfrageliste", async () => {
    const { stop } = await open({});

    expect(modalRoot()!.textContent).toContain("Umfrage-Anzeige");
    expect(modalRoot()!.querySelector("h1")).toHaveTextContent("Umfrage wählen");
    expect(inModal('[aria-label="Ansicht"]')).not.toBeNull();
    expect(inModal('[role="grid"][aria-label="Umfragen"]')).toHaveTextContent("Mitarbeiterbefragung");
    expect(inModal('input[type="search"]')).not.toBeNull();

    await act(async () => stop());
  });

  it("blendet die alten Felder nur im eigenen Dialog aus", async () => {
    const { container, stop } = await open({});

    for (const key of ["installation-id", "plugin-url"]) {
      const field = container.querySelector(`#survey [id="root_${key}"]`);
      expect(field).not.toBeNull();
      expect(field!.closest<HTMLElement>('[style*="display: none"]')).not.toBeNull();
    }
    expect(container.querySelector<HTMLElement>('#foreign [data-row="plugin-url"]')?.style.display).toBe("");

    await act(async () => stop());
    expect(container.querySelector('#survey [id="root_installation-id"]')!.closest('[style*="display: none"]')).toBeNull();
  });

  it("zeigt die Altwerte, ändert den Block aber nicht, solange nichts geändert wird", async () => {
    const { container, stop } = await open({ "installation-id": A, "plugin-url": US });

    expect(fieldValue(container)).toBe("");
    expect(inModal('[data-testid="config-shell-apply"]')).toBeDisabled();
    expect(inModal('[role="row"][aria-selected="true"]')).toHaveTextContent("Mitarbeiterbefragung");

    await act(async () => stop());
  });

  it("schreibt beim ersten Übernehmen beide Werte nach survey-config; die Altfelder bleiben", async () => {
    const { container, stop } = await open({ "installation-id": A, "plugin-url": US });

    await clickElement(rowNamed("Pulscheck"));
    await clickElement(inModal('[data-testid="config-shell-apply"]'));

    expect(readSurveyConfigParts(fieldValue(container))).toEqual({ installationId: B, pluginUrl: US });
    expect(container.querySelector<HTMLInputElement>('#survey [id="root_installation-id"]')!.value).toBe(A);
    // Die Leseseite nimmt jetzt den neuen Wert.
    expect(
      resolveSurvey({ "survey-config": fieldValue(container), "installation-id": A, "plugin-url": US }),
    ).toEqual({ installationId: B, pluginUrl: US });

    await act(async () => stop());
  });

  it("nimmt eine vorhandene survey-config vor den alten Feldern", async () => {
    const raw = JSON.stringify({ installationId: B, pluginUrl: DEFAULT_PLUGIN_URL });
    const { stop } = await open({ "survey-config": raw, "installation-id": A });

    expect(inModal('[role="row"][aria-selected="true"]')).toHaveTextContent("Pulscheck");

    await act(async () => stop());
  });

  it("übernimmt nichts ohne Umfrage und zeigt den Fehler am Feld", async () => {
    const { container, stop } = await open({});
    const input = inModal('input[type="text"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: DEFAULT_PLUGIN_URL } });
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.change(input, { target: { value: "nichts" } });

    await clickElement(inModal('[data-testid="config-shell-apply"]'));
    expect(fieldValue(container)).toBe("");
    expect(inModal('[role="alert"]')).toHaveTextContent("Umfrage auswählen");

    await clickElement(rowNamed("Mitarbeiterbefragung"));
    await clickElement(inModal('[data-testid="config-shell-apply"]'));
    expect(readSurveyConfigParts(fieldValue(container))?.installationId).toBe(A);

    await act(async () => stop());
  });

  it("macht aus einer eingefügten Adresse die ID", async () => {
    const { container, stop } = await open({});
    const input = inModal('input[type="text"]') as HTMLInputElement;

    fireEvent.change(input, { target: { value: `https://x.test/surveys/${B}` } });
    await clickElement(inModal('[data-testid="config-shell-apply"]'));

    expect(readSurveyConfigParts(fieldValue(container))?.installationId).toBe(B);

    await act(async () => stop());
  });

  it("filtert die Liste mit der Suche und leert sie mit Escape", async () => {
    const { stop } = await open({});
    const search = inModal('input[type="search"]') as HTMLInputElement;

    fireEvent.change(search, { target: { value: "puls" } });
    expect(rowNamed("Mitarbeiterbefragung")).toBeNull();
    expect(rowNamed("Pulscheck")).not.toBeNull();

    await act(async () => {
      fireEvent.keyDown(search, { key: "Escape" });
    });
    expect(search.value).toBe("");
    expect(inModal('[data-testid="config-shell"]')).not.toBeNull();

    await act(async () => stop());
  });

  it("zeigt in der Geräteansicht die Beispielvorschau mit dem gewählten Titel", async () => {
    const { stop } = await open({ "installation-id": A });

    await clickElement(Array.from(modalRoot()!.querySelectorAll<HTMLElement>('button, [role="radio"]')).find((b) => b.textContent?.trim() === "Desktop") ?? null);
    await settleModal();

    expect(inModal('[data-testid="survey-preview"]')).toHaveAttribute("inert");
    expect(inModal('[data-testid="survey-preview"]')).toHaveTextContent("Mitarbeiterbefragung");
    // Keine echte Umfrage im Studio: das Plugin wird nicht geladen.
    expect(document.querySelector("survey-plugin-employee-block")).toBeNull();

    await act(async () => stop());
  });
});

describe("surveyEditorShell", () => {
  it("erklärt in der Hilfe Auswahl, Handeingabe und Plugin-Adresse", () => {
    const { container } = render(<>{surveyEditorShell.help}</>);

    expect(container).toHaveTextContent("Umfrage");
    expect(container).toHaveTextContent("ID oder die ganze Adresse");
    expect(container).toHaveTextContent("Adresse des Plugins");
  });
});
