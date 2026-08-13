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

import { SURVEY_ELEMENT } from "./survey-attributes";

/** Marks the script this widget appended, so it is found again. */
const SCRIPT_MARKER = "data-survey-plugin";

/**
 * The load in flight or already finished, keyed by bundle url.
 *
 * Several surveys may sit on one page and each block asks for the bundle as it
 * mounts. Without the shared promise they would race, and the plugin would be
 * fetched and evaluated once per block.
 */
const loads = new Map<string, Promise<void>>();

/** Drops the cache so each test starts from an untouched document. */
export function resetLoaderForTests(): void {
  loads.clear();
}

/** The plugin's employee bundle under a given plugin host. */
export function bundleUrl(pluginUrl: string): string {
  return `${pluginUrl.replace(/\/+$/, "")}/employee/bundle.mjs`;
}

/**
 * Makes sure the survey plugin is loaded and its element registered.
 *
 * The bundle is an ES module and registers the element itself, so nothing here
 * needs to know what it contains. When the element is already defined —
 * because the page carries a plugin survey of its own — there is nothing to do
 * and nothing is fetched.
 */
export function loadSurveyPlugin(pluginUrl: string): Promise<void> {
  if (window.customElements.get(SURVEY_ELEMENT) !== undefined) return Promise.resolve();

  const url = bundleUrl(pluginUrl);
  const running = loads.get(url);
  if (running !== undefined) return running;

  const loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = url;
    script.setAttribute(SCRIPT_MARKER, "");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => {
      // A failed load must not be remembered as done: the next block, or the
      // same one after a re-render, should be able to try again.
      loads.delete(url);
      script.remove();
      reject(new Error(`Umfragen-Plugin konnte nicht geladen werden (${url}).`));
    });
    document.head.appendChild(script);
  });

  loads.set(url, loading);
  return loading;
}
