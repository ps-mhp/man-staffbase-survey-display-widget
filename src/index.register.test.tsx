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

// Ein Modul, kein Skript: sonst teilten sich die Testdateien aller Widgets
// einen Namensraum.
export {};

const mockStartWidget = jest.fn().mockResolvedValue(undefined);
const mockStartSurveyDialog = jest.fn(() => () => undefined);

jest.mock("@shared/dev-mode/start-widget", () => ({ startWidget: mockStartWidget }));
jest.mock("./survey-dialog", () => ({ startSurveyDialog: mockStartSurveyDialog }));

interface Host {
  defineBlock?: jest.Mock;
}

afterEach(() => {
  delete (window as unknown as Host).defineBlock;
});

describe("Anmeldung des Widgets", () => {
  it("startet das Fenster erst beim Anmelden und meldet survey-config mit an", async () => {
    const host = window as unknown as Host;
    host.defineBlock = jest.fn();

    jest.resetModules();
    await import("./index");

    expect(mockStartSurveyDialog).not.toHaveBeenCalled();

    const options = mockStartWidget.mock.calls[0][0] as { name: string; register: () => void };
    expect(options.name).toBe("survey-display-widget");
    options.register();

    expect(mockStartSurveyDialog).toHaveBeenCalledTimes(1);
    expect(host.defineBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        blockDefinition: expect.objectContaining({
          name: "survey-display-widget",
          attributes: ["survey-config", "installation-id", "plugin-url"],
        }),
      }),
    );
  });
});

describe("Attributname", () => {
  it("teilt survey-config mit keinem anderen Widget", async () => {
    const { readdirSync, readFileSync, existsSync } = await import("fs");
    const { join } = await import("path");
    const { SURVEY_CONFIG_ATTRIBUTE } = await import("./configuration-schema");
    const widgetsRoot = join(__dirname, "..", "..");
    const others = readdirSync(widgetsRoot).filter((name) => name !== "survey-display-widget");
    const clashes = others.filter((name) => {
      const schema = join(widgetsRoot, name, "src", "configuration-schema.ts");
      return existsSync(schema) && new RegExp(`["'\`]${SURVEY_CONFIG_ATTRIBUTE}["'\`]`).test(readFileSync(schema, "utf8"));
    });

    expect(others.length).toBeGreaterThan(0);
    expect(clashes).toEqual([]);
  });
});
