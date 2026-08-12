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

import { setPublicPathFromBundle } from "@shared/public-path";

// Must run before any dynamic `import()`, so that lazily loaded chunks come
// from the CDN the bundle was served from and not from the hosting page.
setPublicPathFromBundle("survey-display-widget.js");
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { configurationSchema, uiSchema } from "./configuration-schema";
import { BranchContext, DEFAULT_PLUGIN_URL, readInstallationId } from "./survey-attributes";
import { SurveyView } from "./survey-view";
import icon from "../resources/survey-display-widget.svg";
import pkg from "../package.json";

/**
 * The names the configuration goes by.
 *
 * Each has to be spelled the same in three places: the key in the
 * configuration schema, the attribute declared to the host, and the name read
 * back here. They are also the attributes registered for this widget in
 * `widgets.json`.
 */
export const INSTALLATION_ID_ATTRIBUTE = "installation-id";
export const PLUGIN_URL_ATTRIBUTE = "plugin-url";

/** Attributes handled by the widget; mirrored in the configuration schema. */
const widgetAttributes: string[] = [INSTALLATION_ID_ATTRIBUTE, PLUGIN_URL_ATTRIBUTE];

/**
 * The plugin host to load the survey bundle from.
 *
 * The field carries a default, but a saved configuration from before the field
 * existed has nothing under the key at all — so the default is applied here as
 * well and not only in the dialog.
 */
export function readPluginUrl(raw: unknown): string {
  if (typeof raw !== "string") return DEFAULT_PLUGIN_URL;
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed === "" ? DEFAULT_PLUGIN_URL : trimmed;
}

const factory: BlockFactory = (BaseBlockClass, widgetApi) => {
  return class SurveyDisplayWidgetBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;

    /**
     * What the app says about itself, as far as the plugin element needs it.
     *
     * Read through the SDK rather than guessed from the URL, and tolerant of
     * its absence: in the editor preview the call may not be there at all, and
     * a survey that fails to render because of a missing branch name would be
     * a poor trade.
     */
    private get branch(): BranchContext | null {
      try {
        return widgetApi.getBranchInformation() ?? null;
      } catch {
        return null;
      }
    }

    public renderBlock(container: HTMLElement): void {
      const attrs = this.parseAttributes<Record<string, unknown>>();
      const installationId = readInstallationId(attrs[INSTALLATION_ID_ATTRIBUTE]);
      const pluginUrl = readPluginUrl(attrs[PLUGIN_URL_ATTRIBUTE]);

      // The SDK is assumed to pass the same container for the life of the block.
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(
        <SurveyView installationId={installationId} pluginUrl={pluginUrl} branch={this.branch} />,
      );
    }

    public unmountBlock(_container: HTMLElement): void {
      this._root?.unmount();
      this._root = null;
    }

    public static get observedAttributes(): string[] {
      return widgetAttributes;
    }

    public attributeChangedCallback(...args: [string, string | undefined, string | undefined]): void {
      super.attributeChangedCallback.apply(this, args);
    }
  };
};

const blockDefinition: BlockDefinition = {
  name: "survey-display-widget",
  factory: factory,
  attributes: widgetAttributes,
  blockLevel: "block",
  configurationSchema: configurationSchema,
  uiSchema: uiSchema,
  label: "SurveyDisplay",
  iconUrl: icon,
};

const externalBlockDefinition: ExternalBlockDefinition = {
  blockDefinition,
  author: pkg.author,
  version: pkg.version,
};

// The guard lets the module load in Jest/jsdom where defineBlock is absent,
// while keeping the call unconditional in the real Staffbase host, where it is
// always present — in the editor and on a published page alike.
if (typeof window.defineBlock === "function") {
  window.defineBlock(externalBlockDefinition);
}
