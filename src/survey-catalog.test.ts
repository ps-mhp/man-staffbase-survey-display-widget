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

import { CATALOG_ENDPOINT, fetchSurveyCatalog } from "./survey-catalog";

const entry = (id: string, localization: unknown): unknown => ({
  data: { id, config: { localization } },
});

const respondWith = (body: unknown): jest.SpyInstance =>
  jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));

describe("fetchSurveyCatalog", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    document.documentElement.removeAttribute("lang");
  });

  it("asks only for surveys the author may actually manage", async () => {
    const fetchMock = respondWith({ total: 0, entries: [] });

    await fetchSurveyCatalog();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url.startsWith(CATALOG_ENDPOINT)).toBe(true);
    expect(url).toContain("permission=manage");
    // Without the cookie the endpoint answers 401 and the list stays empty.
    expect(init.credentials).toBe("same-origin");
  });

  it("names each survey in the language of the page", async () => {
    document.documentElement.setAttribute("lang", "de-DE");
    respondWith({
      total: 1,
      entries: [entry("6a7c2c3581f6c51d454ab4ca", { en_US: { title: "Poll" }, de_DE: { title: "Umfrage" } })],
    });

    await expect(fetchSurveyCatalog()).resolves.toEqual([
      { id: "6a7c2c3581f6c51d454ab4ca", title: "Umfrage" },
    ]);
  });

  it("falls back to English and then to whatever title exists", async () => {
    document.documentElement.setAttribute("lang", "fr-FR");
    respondWith({
      total: 2,
      entries: [
        entry("aaaaaaaaaaaaaaaaaaaaaaaa", { en_US: { title: "English" }, it_IT: { title: "Italiano" } }),
        entry("bbbbbbbbbbbbbbbbbbbbbbbb", { it_IT: { title: "Solo italiano" } }),
      ],
    });

    await expect(fetchSurveyCatalog()).resolves.toEqual([
      { id: "aaaaaaaaaaaaaaaaaaaaaaaa", title: "English" },
      { id: "bbbbbbbbbbbbbbbbbbbbbbbb", title: "Solo italiano" },
    ]);
  });

  it("shows the id when a survey carries no title at all", async () => {
    // A nameless row in the list would be indistinguishable from its
    // neighbours; the id at least identifies it.
    respondWith({ total: 1, entries: [entry("cccccccccccccccccccccccc", {})] });

    await expect(fetchSurveyCatalog()).resolves.toEqual([
      { id: "cccccccccccccccccccccccc", title: "cccccccccccccccccccccccc" },
    ]);
  });

  it("skips entries without an id rather than listing a broken one", async () => {
    respondWith({ total: 2, entries: [{ data: { config: {} } }, entry("dddddddddddddddddddddddd", {})] });

    await expect(fetchSurveyCatalog()).resolves.toEqual([
      { id: "dddddddddddddddddddddddd", title: "dddddddddddddddddddddddd" },
    ]);
  });

  it("answers with an empty list when the request fails", async () => {
    // The caller falls back to the plain id field; an exception here would
    // instead take the whole configuration dialog down with it.
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    await expect(fetchSurveyCatalog()).resolves.toEqual([]);
  });

  it("answers with an empty list when the author may not see the surveys", async () => {
    jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 403 }));

    await expect(fetchSurveyCatalog()).resolves.toEqual([]);
  });
});
