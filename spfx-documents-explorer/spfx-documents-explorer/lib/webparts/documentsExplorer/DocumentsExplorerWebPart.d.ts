import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';
export interface IDocumentsExplorerWebPartProps {
    title: string;
    rootsJson: string;
}
export default class DocumentsExplorerWebPart extends BaseClientSideWebPart<IDocumentsExplorerWebPartProps> {
    private _isDarkTheme;
    private _configurationError;
    render(): void;
    protected onInit(): Promise<void>;
    protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void;
    protected onDispose(): void;
    protected get dataVersion(): Version;
    protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration;
    private _parseRoots;
}
//# sourceMappingURL=DocumentsExplorerWebPart.d.ts.map