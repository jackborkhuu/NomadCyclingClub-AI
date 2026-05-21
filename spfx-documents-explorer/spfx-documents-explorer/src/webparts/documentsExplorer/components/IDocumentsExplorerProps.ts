import type { SPHttpClient } from '@microsoft/sp-http';

export interface IExplorerRoot {
  name: string;
  siteUrl: string;
  rootPath: string;
}

export interface IDocumentsExplorerProps {
  title: string;
  roots: IExplorerRoot[];
  configurationError?: string;
  isDarkTheme: boolean;
  hasTeamsContext: boolean;
  spHttpClient: SPHttpClient;
}
