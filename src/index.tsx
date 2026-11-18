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

import { startWidget } from "@shared/dev-mode/start-widget";
import { setPublicPathFromBundle } from "@shared/public-path";

// Must run before any dynamic `import()`, so that lazily loaded chunks come
// from the CDN the bundle was served from and not from the hosting page.
setPublicPathFromBundle("survey-display-widget.js");
import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock } from "widget-sdk";
import { ALL_ATTRIBUTES, configurationSchema, uiSchema } from "./configuration-schema";
import { BranchContext } from "./survey-attributes";
import { resolveSurvey } from "./survey-config";
import { startSurveyDialog } from "./survey-dialog";
import { SurveyView } from "./survey-view";
import icon from "../resources/survey-display-widget.svg";
import pkg from "../package.json";

export {
  INSTALLATION_ID_ATTRIBUTE,
  PLUGIN_URL_ATTRIBUTE,
  SURVEY_CONFIG_ATTRIBUTE,
} from "./configuration-schema";
export { readPluginUrl } from "./survey-attributes";

/** Alle angemeldeten Attribute: `survey-config` zuerst, die Einzelfelder älterer Fassungen dahinter. */
const widgetAttributes: string[] = ALL_ATTRIBUTES;

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
      // `survey-config`, je Schlüssel ergänzt um die Einzelfelder älterer
      // Fassungen (`survey-config.ts`): ein alter Block rendert wie bisher.
      const { installationId, pluginUrl } = resolveSurvey(this.parseAttributes<Record<string, unknown>>());

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
// Registration runs through `startWidget`, which first asks whether a local
// development server serves this widget. On virtually every browser the answer
// is no and this registers immediately; on the developer's machine the local
// bundle takes over and registers instead. Only ever one of the two, a block
// name cannot be claimed twice.
//
// Das Fenster „Umfrage wählen“ hängt am Anmelden, nicht am Laden: auf
// Modulebene gestartet, belegte das installierte Bündel das Feld
// `survey-config`, bevor feststeht, ob ein lokaler Entwicklungsserver
// übernimmt.
if (typeof window.defineBlock === "function") {
  void startWidget({
    name: "survey-display-widget",
    version: pkg.version,
    register: () => {
      startSurveyDialog();
      window.defineBlock(externalBlockDefinition);
    },
  });
}
