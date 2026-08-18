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

import { CATALOG_ENDPOINT, surveyCatalogSource } from "./survey-catalog";

const entry = (id: string, localization: unknown): unknown => ({
  data: { id, config: { localization } },
});

const respondWith = (body: unknown): jest.SpyInstance =>
  jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

describe("surveyCatalogSource.fetchList", () => {
  afterEach(() => jest.restoreAllMocks());

  it("asks only for surveys the author may actually manage", async () => {
    const fetchMock = respondWith({ total: 0, entries: [] });

    await surveyCatalogSource.fetchList();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith(CATALOG_ENDPOINT)).toBe(true);
    expect(url).toContain("permission=manage");
    expect(url).toContain("limit=100");
    expect(url).toContain("sort=created_DESC");
    // Without the cookie the endpoint answers 401 and the list stays empty.
    expect(init.credentials).toBe("same-origin");
  });

  it("returns the raw entries as-is for toOption to map", async () => {
    respondWith({ total: 1, entries: [entry("aaaaaaaaaaaaaaaaaaaaaaaa", { en_US: { title: "Poll" } })] });

    await expect(surveyCatalogSource.fetchList()).resolves.toEqual([
      entry("aaaaaaaaaaaaaaaaaaaaaaaa", { en_US: { title: "Poll" } }),
    ]);
  });

  it("answers with an empty list when the author may not see the surveys", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 403 }));

    await expect(surveyCatalogSource.fetchList()).resolves.toEqual([]);
  });

  it("lets a network failure propagate to the shared loader", async () => {
    // `fetchEntityCatalog` is the one that turns this into an empty list; this
    // source is not responsible for catching it itself.
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(surveyCatalogSource.fetchList()).rejects.toThrow("offline");
  });
});

describe("surveyCatalogSource.toOption", () => {
  afterEach(() => document.documentElement.removeAttribute("lang"));

  it("names the survey in the language of the page", () => {
    document.documentElement.setAttribute("lang", "de-DE");

    expect(
      surveyCatalogSource.toOption(
        entry("aaaaaaaaaaaaaaaaaaaaaaaa", { en_US: { title: "Poll" }, de_DE: { title: "Umfrage" } }) as never,
      ),
    ).toEqual({ id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "Umfrage" });
  });

  it("shows the id when a survey carries no title at all", () => {
    expect(
      surveyCatalogSource.toOption(entry("cccccccccccccccccccccccc", {}) as never),
    ).toEqual({ id: "cccccccccccccccccccccccc", title: "cccccccccccccccccccccccc" });
  });

  it("skips entries without an id rather than listing a broken one", () => {
    expect(surveyCatalogSource.toOption({ data: { config: {} } } as never)).toBeNull();
  });
});
