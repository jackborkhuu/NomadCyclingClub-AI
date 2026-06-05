"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = tslib_1.__importStar(require("react"));
var ReactDom = tslib_1.__importStar(require("react-dom"));
var sp_core_library_1 = require("@microsoft/sp-core-library");
var sp_property_pane_1 = require("@microsoft/sp-property-pane");
var sp_webpart_base_1 = require("@microsoft/sp-webpart-base");
var strings = tslib_1.__importStar(require("DocumentsExplorerWebPartStrings"));
var DocumentsExplorer_1 = tslib_1.__importDefault(require("./components/DocumentsExplorer"));
var DEFAULT_ROOTS_JSON = JSON.stringify([
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
var DocumentsExplorerWebPart = /** @class */ (function (_super) {
    tslib_1.__extends(DocumentsExplorerWebPart, _super);
    function DocumentsExplorerWebPart() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._isDarkTheme = false;
        _this._configurationError = '';
        return _this;
    }
    DocumentsExplorerWebPart.prototype.render = function () {
        var roots = this._parseRoots();
        var element = React.createElement(DocumentsExplorer_1.default, {
            title: this.properties.title,
            roots: roots,
            configurationError: this._configurationError,
            isDarkTheme: this._isDarkTheme,
            hasTeamsContext: !!this.context.sdks.microsoftTeams,
            spHttpClient: this.context.spHttpClient
        });
        ReactDom.render(element, this.domElement);
    };
    DocumentsExplorerWebPart.prototype.onInit = function () {
        if (!this.properties.title) {
            this.properties.title = 'Documents Hub';
        }
        if (!this.properties.rootsJson) {
            this.properties.rootsJson = DEFAULT_ROOTS_JSON;
        }
        return Promise.resolve();
    };
    DocumentsExplorerWebPart.prototype.onThemeChanged = function (currentTheme) {
        if (!currentTheme) {
            return;
        }
        this._isDarkTheme = !!currentTheme.isInverted;
        var semanticColors = currentTheme.semanticColors;
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
    };
    DocumentsExplorerWebPart.prototype.onDispose = function () {
        ReactDom.unmountComponentAtNode(this.domElement);
    };
    Object.defineProperty(DocumentsExplorerWebPart.prototype, "dataVersion", {
        get: function () {
            return sp_core_library_1.Version.parse('1.0');
        },
        enumerable: false,
        configurable: true
    });
    DocumentsExplorerWebPart.prototype.getPropertyPaneConfiguration = function () {
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
                                (0, sp_property_pane_1.PropertyPaneTextField)('title', {
                                    label: strings.TitleFieldLabel
                                }),
                                (0, sp_property_pane_1.PropertyPaneTextField)('rootsJson', {
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
    };
    DocumentsExplorerWebPart.prototype._parseRoots = function () {
        try {
            var parsed = JSON.parse(this.properties.rootsJson);
            if (!Array.isArray(parsed)) {
                throw new Error('Configuration must be a JSON array.');
            }
            var validRoots = parsed.filter(function (root) { return root && root.name && root.siteUrl && root.rootPath; });
            if (!validRoots.length) {
                throw new Error('At least one valid root is required.');
            }
            this._configurationError = '';
            return validRoots;
        }
        catch (error) {
            this._configurationError = error instanceof Error
                ? "Roots configuration is invalid: ".concat(error.message)
                : 'Roots configuration is invalid.';
            return [];
        }
    };
    return DocumentsExplorerWebPart;
}(sp_webpart_base_1.BaseClientSideWebPart));
exports.default = DocumentsExplorerWebPart;
//# sourceMappingURL=DocumentsExplorerWebPart.js.map