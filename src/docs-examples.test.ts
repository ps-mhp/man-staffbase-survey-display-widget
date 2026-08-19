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

import "./docs-examples";
import { getDocsExamplesResolver } from "@shared/docs/register-docs-examples";
import { CATALOG_ENDPOINT } from "./survey-catalog";

function mockFetch(implementation: (input: RequestInfo | URL) => Promise<Response>): jest.SpyInstance {
  return jest.spyOn(globalThis, "fetch").mockImplementation(implementation as never);
}

describe("survey-display-widget docs-examples", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("registers a resolver that returns the first survey's installation id", async () => {
    mockFetch(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.startsWith(CATALOG_ENDPOINT)) {
        return new Response(
          JSON.stringify({ entries: [{ data: { id: "survey-1", config: { localization: {} } } }] }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const resolver = getDocsExamplesResolver("survey-display-widget");
    expect(resolver).toBeDefined();

    const result = await resolver!();
    expect(result["installation-id"]).toBe("survey-1");
  });

  it("omits the installation-id key when no survey is available", async () => {
    mockFetch(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.startsWith(CATALOG_ENDPOINT)) {
        return new Response(JSON.stringify({ entries: [] }), { status: 200 });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    const resolver = getDocsExamplesResolver("survey-display-widget");
    const result = await resolver!();

    expect(result["installation-id"]).toBeUndefined();
  });
});
