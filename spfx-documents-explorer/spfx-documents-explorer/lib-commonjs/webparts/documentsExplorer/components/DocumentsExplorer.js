"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = tslib_1.__importStar(require("react"));
var sp_http_1 = require("@microsoft/sp-http");
var DocumentsExplorer_module_scss_1 = tslib_1.__importDefault(require("./DocumentsExplorer.module.scss"));
var DocumentsExplorer = function (props) {
    var title = props.title, roots = props.roots, configurationError = props.configurationError, hasTeamsContext = props.hasTeamsContext, spHttpClient = props.spHttpClient;
    var _a = React.useState(), activeRoot = _a[0], setActiveRoot = _a[1];
    var _b = React.useState(''), currentPath = _b[0], setCurrentPath = _b[1];
    var _c = React.useState([]), items = _c[0], setItems = _c[1];
    var _d = React.useState(false), isLoading = _d[0], setIsLoading = _d[1];
    var _e = React.useState(''), loadError = _e[0], setLoadError = _e[1];
    var _f = React.useState(false), isBusy = _f[0], setIsBusy = _f[1];
    var _g = React.useState(''), operationError = _g[0], setOperationError = _g[1];
    var _h = React.useState(''), operationInfo = _h[0], setOperationInfo = _h[1];
    var _j = React.useState(new Set()), selectedItemUrls = _j[0], setSelectedItemUrls = _j[1];
    var _k = React.useState(), clipboard = _k[0], setClipboard = _k[1];
    var _l = React.useState(0), refreshToken = _l[0], setRefreshToken = _l[1];
    var uploadInputRef = React.useRef(null);
    var selectedItems = React.useMemo(function () { return items.filter(function (item) { return selectedItemUrls.has(item.serverRelativeUrl); }); }, [items, selectedItemUrls]);
    var refreshItems = React.useCallback(function () {
        setRefreshToken(function (previous) { return previous + 1; });
    }, []);
    React.useEffect(function () {
        if (!activeRoot) {
            return;
        }
        var disposed = false;
        var loadItems = function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
            var response, payload, nextItems, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setIsLoading(true);
                        setLoadError('');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, spHttpClient.get(buildFolderApiUrl(activeRoot.siteUrl, currentPath), sp_http_1.SPHttpClient.configurations.v1, {
                                headers: {
                                    Accept: 'application/json;odata=nometadata'
                                }
                            })];
                    case 2:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("SharePoint returned ".concat(response.status, " ").concat(response.statusText));
                        }
                        return [4 /*yield*/, response.json()];
                    case 3:
                        payload = _a.sent();
                        nextItems = mapFolderResponse(payload);
                        if (!disposed) {
                            setItems(nextItems);
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        error_1 = _a.sent();
                        if (!disposed) {
                            setItems([]);
                            setLoadError(error_1 instanceof Error ? error_1.message : 'Unable to load folder contents.');
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        if (!disposed) {
                            setIsLoading(false);
                        }
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        loadItems().catch(function () { return undefined; });
        return function () {
            disposed = true;
        };
    }, [activeRoot, currentPath, refreshToken, spHttpClient]);
    React.useEffect(function () {
        setSelectedItemUrls(new Set());
    }, [currentPath, activeRoot]);
    var openRoot = function (root) {
        setActiveRoot(root);
        setCurrentPath(normalizeServerRelativePath(root.rootPath));
        setItems([]);
        setLoadError('');
    };
    var navigateToPath = function (path) {
        setCurrentPath(normalizeServerRelativePath(path));
    };
    var resetToRoots = function () {
        setActiveRoot(undefined);
        setCurrentPath('');
        setItems([]);
        setLoadError('');
    };
    var openSharePointUrl = function (url) {
        window.open(url, '_blank', 'noopener');
    };
    var clearOperationMessages = function () {
        setOperationError('');
        setOperationInfo('');
    };
    var runOperation = function (operation, successMessage) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeRoot) {
                        return [2 /*return*/];
                    }
                    clearOperationMessages();
                    setIsBusy(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, operation()];
                case 2:
                    _a.sent();
                    setOperationInfo(successMessage);
                    refreshItems();
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    setOperationError(error_2 instanceof Error ? error_2.message : 'The operation did not complete successfully.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsBusy(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var toggleSelection = function (serverRelativeUrl) {
        setSelectedItemUrls(function (previous) {
            var next = new Set(previous);
            if (next.has(serverRelativeUrl)) {
                next.delete(serverRelativeUrl);
            }
            else {
                next.add(serverRelativeUrl);
            }
            return next;
        });
    };
    var createFolder = function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var folderName, sanitizedName;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeRoot) {
                        return [2 /*return*/];
                    }
                    folderName = window.prompt('Folder name');
                    sanitizedName = sanitizeItemName(folderName === null ? undefined : folderName);
                    if (!sanitizedName) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, runOperation(function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
                            var targetPath, requestUrl, response;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        targetPath = joinServerRelativePath(currentPath, sanitizedName);
                                        requestUrl = "".concat(activeRoot.siteUrl, "/_api/web/folders/addusingpath(decodedurl='").concat(escapeODataLiteral(targetPath), "')");
                                        return [4 /*yield*/, spHttpClient.post(requestUrl, sp_http_1.SPHttpClient.configurations.v1, {
                                                headers: {
                                                    Accept: 'application/json;odata=nometadata'
                                                }
                                            })];
                                    case 1:
                                        response = _a.sent();
                                        if (!response.ok) {
                                            throw new Error("Unable to create folder (".concat(response.status, " ").concat(response.statusText, ")."));
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }, "Created folder ".concat(sanitizedName, "."))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var createFile = function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var fileName, sanitizedName;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeRoot) {
                        return [2 /*return*/];
                    }
                    fileName = window.prompt('File name', 'new-file.txt');
                    sanitizedName = sanitizeItemName(fileName === null ? undefined : fileName);
                    if (!sanitizedName) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, runOperation(function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
                            var requestUrl, response;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        requestUrl = "".concat(activeRoot.siteUrl, "/_api/web/GetFolderByServerRelativePath(decodedurl='").concat(escapeODataLiteral(currentPath), "')/Files/AddUsingPath(decodedurl='").concat(escapeODataLiteral(sanitizedName), "',overwrite=false)");
                                        return [4 /*yield*/, spHttpClient.post(requestUrl, sp_http_1.SPHttpClient.configurations.v1, {
                                                body: '',
                                                headers: {
                                                    Accept: 'application/json;odata=nometadata',
                                                    'Content-Type': 'text/plain;charset=utf-8'
                                                }
                                            })];
                                    case 1:
                                        response = _a.sent();
                                        if (!response.ok) {
                                            throw new Error("Unable to create file (".concat(response.status, " ").concat(response.statusText, ")."));
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }, "Created file ".concat(sanitizedName, "."))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var onFileInputChanged = function (event) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var input, files;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    input = event.target;
                    if (!activeRoot || !input.files || input.files.length === 0) {
                        return [2 /*return*/];
                    }
                    files = Array.from(input.files);
                    input.value = '';
                    return [4 /*yield*/, runOperation(function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
                            var _i, files_1, file, requestUrl, response;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _i = 0, files_1 = files;
                                        _a.label = 1;
                                    case 1:
                                        if (!(_i < files_1.length)) return [3 /*break*/, 4];
                                        file = files_1[_i];
                                        requestUrl = "".concat(activeRoot.siteUrl, "/_api/web/GetFolderByServerRelativePath(decodedurl='").concat(escapeODataLiteral(currentPath), "')/Files/AddUsingPath(decodedurl='").concat(escapeODataLiteral(file.name), "',overwrite=true)");
                                        return [4 /*yield*/, spHttpClient.post(requestUrl, sp_http_1.SPHttpClient.configurations.v1, {
                                                body: file,
                                                headers: {
                                                    Accept: 'application/json;odata=nometadata'
                                                }
                                            })];
                                    case 2:
                                        response = _a.sent();
                                        if (!response.ok) {
                                            throw new Error("Unable to upload ".concat(file.name, " (").concat(response.status, " ").concat(response.statusText, ")."));
                                        }
                                        _a.label = 3;
                                    case 3:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        }); }, "Uploaded ".concat(files.length, " file").concat(files.length === 1 ? '' : 's', "."))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var startClipboardAction = function (mode) {
        if (!activeRoot || selectedItems.length === 0) {
            return;
        }
        clearOperationMessages();
        setClipboard({
            mode: mode,
            sourceSiteUrl: activeRoot.siteUrl,
            items: selectedItems
        });
        setOperationInfo("".concat(mode === 'copy' ? 'Copied' : 'Cut', " ").concat(selectedItems.length, " item").concat(selectedItems.length === 1 ? '' : 's', " to clipboard."));
    };
    var pasteClipboard = function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeRoot || !clipboard || clipboard.items.length === 0) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, runOperation(function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
                            var _i, _a, item, destinationPath;
                            return tslib_1.__generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _i = 0, _a = clipboard.items;
                                        _b.label = 1;
                                    case 1:
                                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                                        item = _a[_i];
                                        destinationPath = joinServerRelativePath(currentPath, item.name);
                                        if (!(clipboard.mode === 'copy')) return [3 /*break*/, 3];
                                        return [4 /*yield*/, copyOrMoveItem(activeRoot.siteUrl, clipboard.sourceSiteUrl, item, destinationPath, false, spHttpClient)];
                                    case 2:
                                        _b.sent();
                                        return [3 /*break*/, 5];
                                    case 3: return [4 /*yield*/, copyOrMoveItem(activeRoot.siteUrl, clipboard.sourceSiteUrl, item, destinationPath, true, spHttpClient)];
                                    case 4:
                                        _b.sent();
                                        _b.label = 5;
                                    case 5:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 6:
                                        if (clipboard.mode === 'cut') {
                                            setClipboard(undefined);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }, "".concat(clipboard.mode === 'copy' ? 'Copied' : 'Moved', " ").concat(clipboard.items.length, " item").concat(clipboard.items.length === 1 ? '' : 's', "."))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var deleteSelectedItems = function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
        var proceed;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeRoot || selectedItems.length === 0) {
                        return [2 /*return*/];
                    }
                    proceed = window.confirm("Delete ".concat(selectedItems.length, " item").concat(selectedItems.length === 1 ? '' : 's', "? They will be moved to Recycle Bin."));
                    if (!proceed) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, runOperation(function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
                            var _i, selectedItems_1, item, endpoint, response;
                            return tslib_1.__generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _i = 0, selectedItems_1 = selectedItems;
                                        _a.label = 1;
                                    case 1:
                                        if (!(_i < selectedItems_1.length)) return [3 /*break*/, 4];
                                        item = selectedItems_1[_i];
                                        endpoint = item.isFolder
                                            ? "".concat(activeRoot.siteUrl, "/_api/web/GetFolderByServerRelativePath(decodedurl='").concat(escapeODataLiteral(item.serverRelativeUrl), "')/recycle()")
                                            : "".concat(activeRoot.siteUrl, "/_api/web/GetFileByServerRelativePath(decodedurl='").concat(escapeODataLiteral(item.serverRelativeUrl), "')/recycle()");
                                        return [4 /*yield*/, spHttpClient.post(endpoint, sp_http_1.SPHttpClient.configurations.v1, {
                                                headers: {
                                                    Accept: 'application/json;odata=nometadata'
                                                }
                                            })];
                                    case 2:
                                        response = _a.sent();
                                        if (!response.ok) {
                                            throw new Error("Unable to delete ".concat(item.name, " (").concat(response.status, " ").concat(response.statusText, ")."));
                                        }
                                        _a.label = 3;
                                    case 3:
                                        _i++;
                                        return [3 /*break*/, 1];
                                    case 4:
                                        setSelectedItemUrls(new Set());
                                        return [2 /*return*/];
                                }
                            });
                        }); }, "Moved ".concat(selectedItems.length, " item").concat(selectedItems.length === 1 ? '' : 's', " to Recycle Bin."))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    var breadcrumbs = activeRoot ? buildBreadcrumbs(activeRoot, currentPath) : [];
    var currentFolderUrl = activeRoot ? toAbsoluteUrl(activeRoot.siteUrl, currentPath) : '';
    return (React.createElement("section", { className: "".concat(DocumentsExplorer_module_scss_1.default.documentsExplorer, " ").concat(hasTeamsContext ? DocumentsExplorer_module_scss_1.default.teams : '') },
        React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.header },
            React.createElement("div", null,
                React.createElement("p", { className: DocumentsExplorer_module_scss_1.default.kicker }, "Unified Team Libraries"),
                React.createElement("h2", { className: DocumentsExplorer_module_scss_1.default.title }, title),
                React.createElement("p", { className: DocumentsExplorer_module_scss_1.default.subtitle }, "Browse approved SharePoint libraries in one web part while respecting each user's existing permissions."))),
        configurationError && React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.error }, configurationError),
        !activeRoot && (React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.rootGrid }, roots.map(function (root) { return (React.createElement("button", { key: "".concat(root.siteUrl).concat(root.rootPath), className: DocumentsExplorer_module_scss_1.default.rootCard, onClick: function () { return openRoot(root); } },
            React.createElement("span", { className: DocumentsExplorer_module_scss_1.default.rootCardLabel }, "Library Root"),
            React.createElement("strong", null, root.name),
            React.createElement("span", { className: DocumentsExplorer_module_scss_1.default.rootCardPath }, root.rootPath))); }))),
        activeRoot && (React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.browserShell },
            React.createElement("input", { ref: uploadInputRef, type: "file", multiple: true, className: DocumentsExplorer_module_scss_1.default.hiddenInput, onChange: function (event) {
                    onFileInputChanged(event).catch(function () { return undefined; });
                } }),
            React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.toolbar },
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: resetToRoots }, "Back to libraries"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: function () { return navigateToPath(activeRoot.rootPath); } }, "Root"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: function () { createFolder().catch(function () { return undefined; }); }, disabled: isBusy }, "New folder"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: function () { createFile().catch(function () { return undefined; }); }, disabled: isBusy }, "New file"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: function () { var _a; return (_a = uploadInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, disabled: isBusy }, "Upload file"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: function () { return startClipboardAction('copy'); }, disabled: selectedItems.length === 0 || isBusy }, "Copy"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: function () { return startClipboardAction('cut'); }, disabled: selectedItems.length === 0 || isBusy }, "Cut"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: function () { pasteClipboard().catch(function () { return undefined; }); }, disabled: !clipboard || isBusy }, "Paste"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: function () { deleteSelectedItems().catch(function () { return undefined; }); }, disabled: selectedItems.length === 0 || isBusy }, "Delete"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.secondaryButton, onClick: refreshItems, disabled: isBusy }, "Refresh"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.primaryButton, onClick: function () { return openSharePointUrl(currentFolderUrl); } }, "Open current folder in SharePoint")),
            clipboard && (React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.infoBanner },
                "Clipboard: ",
                clipboard.mode === 'copy' ? 'Copy' : 'Cut',
                " ",
                clipboard.items.length,
                " item",
                clipboard.items.length === 1 ? '' : 's',
                ".")),
            operationInfo && React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.infoBanner }, operationInfo),
            React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.breadcrumbs }, breadcrumbs.map(function (crumb, index) { return (React.createElement(React.Fragment, { key: crumb.path },
                index > 0 && React.createElement("span", { className: DocumentsExplorer_module_scss_1.default.breadcrumbDivider }, "/"),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.breadcrumbButton, onClick: function () { return navigateToPath(crumb.path); } }, crumb.label))); })),
            isLoading && React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.loading }, "Loading folder contents..."),
            loadError && React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.error }, loadError),
            operationError && React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.error }, operationError),
            !isLoading && !loadError && items.length === 0 && (React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.emptyState }, "This folder is empty or no visible content is available for your account.")),
            !isLoading && !loadError && items.length > 0 && (React.createElement("div", { className: DocumentsExplorer_module_scss_1.default.itemList }, items.map(function (item) { return (React.createElement("div", { key: item.serverRelativeUrl, className: "".concat(DocumentsExplorer_module_scss_1.default.itemRow, " ").concat(selectedItemUrls.has(item.serverRelativeUrl) ? DocumentsExplorer_module_scss_1.default.itemRowSelected : '') },
                React.createElement("label", { className: DocumentsExplorer_module_scss_1.default.selectCell },
                    React.createElement("input", { type: "checkbox", checked: selectedItemUrls.has(item.serverRelativeUrl), onChange: function () { return toggleSelection(item.serverRelativeUrl); } })),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.itemMain, onClick: function () { return item.isFolder
                        ? navigateToPath(item.serverRelativeUrl)
                        : openSharePointUrl(toAbsoluteUrl(activeRoot.siteUrl, item.serverRelativeUrl)); } },
                    React.createElement("span", { className: "".concat(DocumentsExplorer_module_scss_1.default.itemBadge, " ").concat(item.isFolder ? DocumentsExplorer_module_scss_1.default.folderBadge : DocumentsExplorer_module_scss_1.default.fileBadge) }, item.isFolder ? 'Folder' : 'File'),
                    React.createElement("span", { className: DocumentsExplorer_module_scss_1.default.itemText },
                        React.createElement("strong", null, item.name),
                        React.createElement("span", { className: DocumentsExplorer_module_scss_1.default.itemMeta },
                            item.modifiedLabel && React.createElement("span", null, item.modifiedLabel),
                            item.sizeLabel && React.createElement("span", null, item.sizeLabel)))),
                React.createElement("button", { className: DocumentsExplorer_module_scss_1.default.inlineLink, onClick: function () { return openSharePointUrl(toAbsoluteUrl(activeRoot.siteUrl, item.serverRelativeUrl)); } }, "Open"))); })))))));
};
function buildFolderApiUrl(siteUrl, folderPath) {
    var normalizedPath = normalizeServerRelativePath(folderPath);
    var odataPath = normalizedPath.replace(/'/g, "''");
    var query = "$select=Name,ServerRelativeUrl,Folders/Name,Folders/ServerRelativeUrl,Files/Name,Files/ServerRelativeUrl,Files/TimeLastModified,Files/Length&$expand=Folders,Files";
    return "".concat(siteUrl, "/_api/web/GetFolderByServerRelativePath(decodedurl='").concat(odataPath, "')?").concat(query);
}
function mapFolderResponse(payload) {
    var folders = ensureArray(payload.Folders)
        .filter(function (folder) { return folder.Name && folder.Name !== 'Forms'; })
        .map(function (folder) { return ({
        name: folder.Name,
        serverRelativeUrl: folder.ServerRelativeUrl,
        isFolder: true
    }); });
    var files = ensureArray(payload.Files)
        .map(function (file) { return ({
        name: file.Name,
        serverRelativeUrl: file.ServerRelativeUrl,
        isFolder: false,
        sizeLabel: formatFileSize(file.Length),
        modifiedLabel: formatModifiedDate(file.TimeLastModified)
    }); });
    return tslib_1.__spreadArray(tslib_1.__spreadArray([], folders.sort(function (left, right) { return left.name.localeCompare(right.name); }), true), files.sort(function (left, right) { return left.name.localeCompare(right.name); }), true);
}
function ensureArray(collection) {
    if (!collection) {
        return [];
    }
    if (Array.isArray(collection)) {
        return collection;
    }
    return collection.results || [];
}
function normalizeServerRelativePath(path) {
    if (!path) {
        return '/';
    }
    var trimmed = path.trim().replace(/\/+$/g, '');
    return trimmed.startsWith('/') ? trimmed : "/".concat(trimmed);
}
function joinServerRelativePath(basePath, leafName) {
    var base = normalizeServerRelativePath(basePath);
    var trimmedLeaf = leafName.replace(/^\/+|\/+$/g, '');
    return "".concat(base, "/").concat(trimmedLeaf).replace(/\/+/g, '/');
}
function sanitizeItemName(value) {
    if (!value) {
        return undefined;
    }
    var trimmed = value.trim();
    if (!trimmed || trimmed === '.' || trimmed === '..' || /[\\/:*?"<>|]/.test(trimmed)) {
        return undefined;
    }
    return trimmed;
}
function escapeODataLiteral(value) {
    return value.replace(/'/g, "''");
}
function copyOrMoveItem(destinationSiteUrl, sourceSiteUrl, item, destinationServerRelativePath, move, spHttpClient) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var method, endpoint, requestBody, response;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    method = item.isFolder
                        ? (move ? 'MoveFolderByPath' : 'CopyFolderByPath')
                        : (move ? 'MoveFileByPath' : 'CopyFileByPath');
                    endpoint = "".concat(destinationSiteUrl, "/_api/SP.MoveCopyUtil.").concat(method, "()");
                    requestBody = {
                        srcPath: {
                            DecodedUrl: toAbsoluteUrl(sourceSiteUrl, item.serverRelativeUrl)
                        },
                        destPath: {
                            DecodedUrl: toAbsoluteUrl(destinationSiteUrl, destinationServerRelativePath)
                        },
                        options: {
                            KeepBoth: false,
                            ShouldBypassSharedLocks: true,
                            ResetAuthorAndCreatedOnCopy: false
                        }
                    };
                    return [4 /*yield*/, spHttpClient.post(endpoint, sp_http_1.SPHttpClient.configurations.v1, {
                            body: JSON.stringify(requestBody),
                            headers: {
                                Accept: 'application/json;odata=nometadata',
                                'Content-Type': 'application/json;odata=verbose;charset=utf-8'
                            }
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("Unable to ".concat(move ? 'move' : 'copy', " ").concat(item.name, " (").concat(response.status, " ").concat(response.statusText, ")."));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function buildBreadcrumbs(root, currentPath) {
    var rootPath = normalizeServerRelativePath(root.rootPath);
    var normalizedCurrentPath = normalizeServerRelativePath(currentPath);
    var relativePath = normalizedCurrentPath.startsWith(rootPath)
        ? normalizedCurrentPath.slice(rootPath.length)
        : '';
    var segments = relativePath.split('/').filter(Boolean);
    var breadcrumbs = [{ label: root.name, path: rootPath }];
    var runningPath = rootPath;
    segments.forEach(function (segment) {
        runningPath = "".concat(runningPath, "/").concat(segment);
        breadcrumbs.push({ label: segment, path: runningPath });
    });
    return breadcrumbs;
}
function toAbsoluteUrl(siteUrl, serverRelativeUrl) {
    return new URL(normalizeServerRelativePath(serverRelativeUrl), siteUrl).toString();
}
function formatFileSize(rawLength) {
    if (!rawLength) {
        return undefined;
    }
    var bytes = parseInt(rawLength, 10);
    if (Number.isNaN(bytes)) {
        return undefined;
    }
    if (bytes < 1024) {
        return "".concat(bytes, " B");
    }
    if (bytes < 1024 * 1024) {
        return "".concat((bytes / 1024).toFixed(1), " KB");
    }
    if (bytes < 1024 * 1024 * 1024) {
        return "".concat((bytes / (1024 * 1024)).toFixed(1), " MB");
    }
    return "".concat((bytes / (1024 * 1024 * 1024)).toFixed(1), " GB");
}
function formatModifiedDate(value) {
    if (!value) {
        return undefined;
    }
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return undefined;
    }
    return date.toLocaleString();
}
exports.default = DocumentsExplorer;
//# sourceMappingURL=DocumentsExplorer.js.map