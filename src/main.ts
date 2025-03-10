import { css, html, nothing } from "lit";
import { customElement, property } from "lit/decorators";

import { applyThemesOnElement } from "@ha/common/dom/apply_themes_on_element";
import "@ha/layouts/ha-app-layout";
import "@ha/components/ha-top-app-bar-fixed";
import "@ha/components/ha-menu-button";
import "@ha/components/ha-tabs";
import { navigate } from "@ha/common/navigate";
import { makeDialogManager } from "@ha/dialogs/make-dialog-manager";
import "@ha/resources/ha-style";
import { haStyle } from "@ha/resources/styles";
import { HomeAssistant, Route } from "@ha/types";

import { knxElement } from "./knx";
import "./knx-router";
import { KNX } from "./types/knx";
import { LocationChangedEvent } from "./types/navigation";

@customElement("knx-frontend")
class KnxFrontend extends knxElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @property({ attribute: false }) public knx!: KNX;

  @property({ attribute: false }) public narrow!: boolean;

  @property({ attribute: false }) public route!: Route;

  protected firstUpdated(changedProps) {
    super.firstUpdated(changedProps);
    if (!this.hass) {
      return;
    }
    if (!this.knx) {
      this._getKNXConfigEntry();
    }
    this.addEventListener("knx-location-changed", (e) => this._setRoute(e as LocationChangedEvent));

    makeDialogManager(this, this.shadowRoot!);
    if (this.route.path === "" || this.route.path === "/") {
      navigate("/knx/info", { replace: true });
    }

    this._applyTheme();
  }

  protected render() {
    if (!this.hass || !this.knx) {
      return nothing;
    }

    return html`
      <ha-app-layout>
        <app-header fixed condenses slot="header">
          <ha-top-app-bar-fixed>
            <ha-menu-button
              slot="navigationIcon"
              .hass=${this.hass}
              .narrow=${this.narrow}
            ></ha-menu-button>
            <div slot="title">${this.knx.localize("title")}</div>
          </ha-top-app-bar-fixed>
          <ha-tabs
            scrollable
            attr-for-selected="page-name"
            .selected=${this.route.path}
            @iron-activate=${this.handleNavigationEvent}
          >
            <paper-tab page-name="/info"> ${this.knx.localize("info_title")} </paper-tab>
            <paper-tab page-name="/monitor">
              ${this.knx.localize("group_monitor_title")}
            </paper-tab>
          </ha-tabs>
        </app-header>
      </ha-app-layout>
      <knx-router
        .hass=${this.hass}
        .knx=${this.knx}
        .route=${this.route}
        .narrow=${this.narrow}
      ></knx-router>
    `;
  }

  private handleNavigationEvent(event: any) {
    const path = "/knx" + event.detail.item.getAttribute("page-name");
    navigate(path, { replace: true });
  }

  static get styles() {
    return [
      haStyle,
      css`
        ha-app-layout {
          z-index: 20;
        }

        app-header {
          background-color: var(--app-header-background-color);
          font-weight: 400;
          color: var(--app-header-text-color, white);
        }

        ha-tabs {
          --paper-tabs-selection-bar-color: var(
            --app-header-selection-bar-color,
            var(--app-header-text-color, #fff)
          );
        }
      `,
    ];
  }

  private _setRoute(ev: LocationChangedEvent): void {
    this.route = ev.detail!.route;
    navigate(this.route.path, { replace: true });
    this.requestUpdate();
  }

  private _applyTheme() {
    let options: Partial<HomeAssistant["selectedTheme"]> | undefined;

    const themeName =
      this.hass.selectedTheme?.theme ||
      (this.hass.themes.darkMode && this.hass.themes.default_dark_theme
        ? this.hass.themes.default_dark_theme!
        : this.hass.themes.default_theme);

    options = this.hass.selectedTheme;
    if (themeName === "default" && options?.dark === undefined) {
      options = {
        ...this.hass.selectedTheme,
      };
    }

    applyThemesOnElement(this.parentElement, this.hass.themes, themeName, {
      ...options,
      dark: this.hass.themes.darkMode,
    });
    this.parentElement!.style.backgroundColor = "var(--primary-background-color)";
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "knx-frontend": KnxFrontend;
  }
}
