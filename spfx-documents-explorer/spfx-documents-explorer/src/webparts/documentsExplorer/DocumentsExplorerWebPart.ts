import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'DocumentsExplorerWebPartStrings';
import DocumentsExplorer from './components/DocumentsExplorer';
import { IDocumentsExplorerProps, IExplorerRoot } from './components/IDocumentsExplorerProps';

export interface IDocumentsExplorerWebPartProps {
  title: string;
  rootsJson: string;
}

const DEFAULT_ROOTS_JSON: string = JSON.stringify([
  {
    name: 'Board Of Directors',
    siteUrl: 'https://nomadcyclingclub.sharepoint.com/sites/Board',
    rootPath: '/sites/Board/Shared Documents'
  },
  {
    name: 'Nomads Main Sharepoint Group',
    siteUrl: 'https://nomadcyclingclub.sharepoint.com/sites/MemberSpace',
    rootPath: '/sites/MemberSpace/Shared Documents'
  },
  {
    name: 'Nomads Yammer',
    siteUrl: 'https://nomadcyclingclub.sharepoint.com/sites/nomads',
    rootPath: '/sites/nomads/Shared Documents'
  },
  {
    name: 'Group for Answers in Viva Engage',
    siteUrl: 'https://nomadcyclingclub.sharepoint.com/sites/groupforanswersinvivaengagedonotdelete5337890816587',
    rootPath: '/sites/groupforanswersinvivaengagedonotdelete5337890816587/Shared Documents'
  }
], null, 2);

export default class DocumentsExplorerWebPart extends BaseClientSideWebPart<IDocumentsExplorerWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _configurationError: string = '';

  public render(): void {
    const roots = this._parseRoots();
    const element: React.ReactElement<IDocumentsExplorerProps> = React.createElement(
      DocumentsExplorer,
      {
        title: this.properties.title,
        roots,
        configurationError: this._configurationError,
        isDarkTheme: this._isDarkTheme,
        hasTeamsContext: !!this.context.sdks.microsoftTeams,
        spHttpClient: this.context.spHttpClient
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    if (!this.properties.title) {
      this.properties.title = 'Documents Hub';
    }

    if (!this.properties.rootsJson) {
      this.properties.rootsJson = DEFAULT_ROOTS_JSON;
    }

    return Promise.resolve();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyBackground', semanticColors.bodyBackground || '#ffffff');
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
      this.domElement.style.setProperty('--cardBackground', semanticColors.bodyBackground || '#ffffff');
      this.domElement.style.setProperty('--cardBorder', semanticColors.variantBorder || '#d0d7de');
      this.domElement.style.setProperty('--mutedText', semanticColors.bodySubtext || '#616161');
      this.domElement.style.setProperty('--buttonBackground', semanticColors.primaryButtonBackground || '#0f6cbd');
      this.domElement.style.setProperty('--buttonText', semanticColors.primaryButtonText || '#ffffff');
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField('title', {
                  label: strings.TitleFieldLabel
                }),
                PropertyPaneTextField('rootsJson', {
                  label: strings.RootsJsonFieldLabel,
                  multiline: true,
                  rows: 14,
                  description: strings.RootsJsonFieldDescription
                })
              ]
            }
          ]
        }
      ]
    };
  }

  private _parseRoots(): IExplorerRoot[] {
    try {
      const parsed = JSON.parse(this.properties.rootsJson) as IExplorerRoot[];

      if (!Array.isArray(parsed)) {
        throw new Error('Configuration must be a JSON array.');
      }

      const validRoots = parsed.filter((root) => root && root.name && root.siteUrl && root.rootPath);

      if (!validRoots.length) {
        throw new Error('At least one valid root is required.');
      }

      this._configurationError = '';
      return validRoots;
    } catch (error) {
      this._configurationError = error instanceof Error
        ? `Roots configuration is invalid: ${error.message}`
        : 'Roots configuration is invalid.';

      return [];
    }
  }
}
