import * as React from 'react';
import { SPHttpClient } from '@microsoft/sp-http';
import styles from './DocumentsExplorer.module.scss';
import type { IDocumentsExplorerProps, IExplorerRoot } from './IDocumentsExplorerProps';

interface ISharePointFolderResponse {
  Name?: string;
  ServerRelativeUrl?: string;
  Folders?: ISharePointFolderChild[] | { results: ISharePointFolderChild[] };
  Files?: ISharePointFileChild[] | { results: ISharePointFileChild[] };
}

interface ISharePointFolderChild {
  Name: string;
  ServerRelativeUrl: string;
}

interface ISharePointFileChild {
  Name: string;
  ServerRelativeUrl: string;
  Length?: string;
  TimeLastModified?: string;
}

interface IExplorerItem {
  name: string;
  serverRelativeUrl: string;
  isFolder: boolean;
  sizeLabel?: string;
  modifiedLabel?: string;
}

interface IClipboardState {
  mode: 'copy' | 'cut';
  sourceSiteUrl: string;
  items: IExplorerItem[];
}

const DocumentsExplorer = (props: IDocumentsExplorerProps): React.ReactElement<IDocumentsExplorerProps> => {
  const { title, roots, configurationError, hasTeamsContext, spHttpClient } = props;
  const [activeRoot, setActiveRoot] = React.useState<IExplorerRoot | undefined>();
  const [currentPath, setCurrentPath] = React.useState<string>('');
  const [items, setItems] = React.useState<IExplorerItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<string>('');
  const [isBusy, setIsBusy] = React.useState<boolean>(false);
  const [operationError, setOperationError] = React.useState<string>('');
  const [operationInfo, setOperationInfo] = React.useState<string>('');
  const [selectedItemUrls, setSelectedItemUrls] = React.useState<Set<string>>(new Set<string>());
  const [clipboard, setClipboard] = React.useState<IClipboardState | undefined>();
  const [refreshToken, setRefreshToken] = React.useState<number>(0);
  const uploadInputRef = React.useRef<HTMLInputElement>(null);

  const selectedItems = React.useMemo(() => items.filter((item) => selectedItemUrls.has(item.serverRelativeUrl)), [items, selectedItemUrls]);

  const refreshItems = React.useCallback((): void => {
    setRefreshToken((previous) => previous + 1);
  }, []);

  React.useEffect(() => {
    if (!activeRoot) {
      return;
    }

    let disposed = false;

    const loadItems = async (): Promise<void> => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await spHttpClient.get(
          buildFolderApiUrl(activeRoot.siteUrl, currentPath),
          SPHttpClient.configurations.v1,
          {
            headers: {
              Accept: 'application/json;odata=nometadata'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`SharePoint returned ${response.status} ${response.statusText}`);
        }

        const payload = await response.json() as ISharePointFolderResponse;
        const nextItems = mapFolderResponse(payload);

        if (!disposed) {
          setItems(nextItems);
        }
      } catch (error) {
        if (!disposed) {
          setItems([]);
          setLoadError(error instanceof Error ? error.message : 'Unable to load folder contents.');
        }
      } finally {
        if (!disposed) {
          setIsLoading(false);
        }
      }
    };

    loadItems().catch(() => undefined);

    return () => {
      disposed = true;
    };
  }, [activeRoot, currentPath, refreshToken, spHttpClient]);

  React.useEffect(() => {
    setSelectedItemUrls(new Set<string>());
  }, [currentPath, activeRoot]);

  const openRoot = (root: IExplorerRoot): void => {
    setActiveRoot(root);
    setCurrentPath(normalizeServerRelativePath(root.rootPath));
    setItems([]);
    setLoadError('');
  };

  const navigateToPath = (path: string): void => {
    setCurrentPath(normalizeServerRelativePath(path));
  };

  const resetToRoots = (): void => {
    setActiveRoot(undefined);
    setCurrentPath('');
    setItems([]);
    setLoadError('');
  };

  const openSharePointUrl = (url: string): void => {
    window.open(url, '_blank', 'noopener');
  };

  const clearOperationMessages = (): void => {
    setOperationError('');
    setOperationInfo('');
  };

  const runOperation = async (operation: () => Promise<void>, successMessage: string): Promise<void> => {
    if (!activeRoot) {
      return;
    }

    clearOperationMessages();
    setIsBusy(true);

    try {
      await operation();
      setOperationInfo(successMessage);
      refreshItems();
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'The operation did not complete successfully.');
    } finally {
      setIsBusy(false);
    }
  };

  const toggleSelection = (serverRelativeUrl: string): void => {
    setSelectedItemUrls((previous) => {
      const next = new Set(previous);

      if (next.has(serverRelativeUrl)) {
        next.delete(serverRelativeUrl);
      } else {
        next.add(serverRelativeUrl);
      }

      return next;
    });
  };

  const createFolder = async (): Promise<void> => {
    if (!activeRoot) {
      return;
    }

    const folderName = window.prompt('Folder name');
    const sanitizedName = sanitizeItemName(folderName === null ? undefined : folderName);

    if (!sanitizedName) {
      return;
    }

    await runOperation(async () => {
      const targetPath = joinServerRelativePath(currentPath, sanitizedName);
      const requestUrl = `${activeRoot.siteUrl}/_api/web/folders/addusingpath(decodedurl='${escapeODataLiteral(targetPath)}')`;
      const response = await spHttpClient.post(requestUrl, SPHttpClient.configurations.v1, {
        headers: {
          Accept: 'application/json;odata=nometadata'
        }
      });

      if (!response.ok) {
        throw new Error(`Unable to create folder (${response.status} ${response.statusText}).`);
      }
    }, `Created folder ${sanitizedName}.`);
  };

  const createFile = async (): Promise<void> => {
    if (!activeRoot) {
      return;
    }

    const fileName = window.prompt('File name', 'new-file.txt');
    const sanitizedName = sanitizeItemName(fileName === null ? undefined : fileName);

    if (!sanitizedName) {
      return;
    }

    await runOperation(async () => {
      const requestUrl = `${activeRoot.siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${escapeODataLiteral(currentPath)}')/Files/AddUsingPath(decodedurl='${escapeODataLiteral(sanitizedName)}',overwrite=false)`;
      const response = await spHttpClient.post(requestUrl, SPHttpClient.configurations.v1, {
        body: '',
        headers: {
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'text/plain;charset=utf-8'
        }
      });

      if (!response.ok) {
        throw new Error(`Unable to create file (${response.status} ${response.statusText}).`);
      }
    }, `Created file ${sanitizedName}.`);
  };

  const onFileInputChanged = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const input = event.target;

      if (!activeRoot || !input.files || input.files.length === 0) {
      return;
    }

      const files = Array.from(input.files);
      input.value = '';

    await runOperation(async () => {
      for (const file of files) {
        const requestUrl = `${activeRoot.siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${escapeODataLiteral(currentPath)}')/Files/AddUsingPath(decodedurl='${escapeODataLiteral(file.name)}',overwrite=true)`;
        const response = await spHttpClient.post(requestUrl, SPHttpClient.configurations.v1, {
          body: file,
          headers: {
            Accept: 'application/json;odata=nometadata'
          }
        });

        if (!response.ok) {
          throw new Error(`Unable to upload ${file.name} (${response.status} ${response.statusText}).`);
        }
      }
    }, `Uploaded ${files.length} file${files.length === 1 ? '' : 's'}.`);

  };

  const startClipboardAction = (mode: 'copy' | 'cut'): void => {
    if (!activeRoot || selectedItems.length === 0) {
      return;
    }

    clearOperationMessages();
    setClipboard({
      mode,
      sourceSiteUrl: activeRoot.siteUrl,
      items: selectedItems
    });
    setOperationInfo(`${mode === 'copy' ? 'Copied' : 'Cut'} ${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} to clipboard.`);
  };

  const pasteClipboard = async (): Promise<void> => {
    if (!activeRoot || !clipboard || clipboard.items.length === 0) {
      return;
    }

    await runOperation(async () => {
      for (const item of clipboard.items) {
        const destinationPath = joinServerRelativePath(currentPath, item.name);

        if (clipboard.mode === 'copy') {
          await copyOrMoveItem(activeRoot.siteUrl, clipboard.sourceSiteUrl, item, destinationPath, false, spHttpClient);
        } else {
          await copyOrMoveItem(activeRoot.siteUrl, clipboard.sourceSiteUrl, item, destinationPath, true, spHttpClient);
        }
      }

      if (clipboard.mode === 'cut') {
        setClipboard(undefined);
      }
    }, `${clipboard.mode === 'copy' ? 'Copied' : 'Moved'} ${clipboard.items.length} item${clipboard.items.length === 1 ? '' : 's'}.`);
  };

  const deleteSelectedItems = async (): Promise<void> => {
    if (!activeRoot || selectedItems.length === 0) {
      return;
    }

    const proceed = window.confirm(`Delete ${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'}? They will be moved to Recycle Bin.`);

    if (!proceed) {
      return;
    }

    await runOperation(async () => {
      for (const item of selectedItems) {
        const endpoint = item.isFolder
          ? `${activeRoot.siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${escapeODataLiteral(item.serverRelativeUrl)}')/recycle()`
          : `${activeRoot.siteUrl}/_api/web/GetFileByServerRelativePath(decodedurl='${escapeODataLiteral(item.serverRelativeUrl)}')/recycle()`;

        const response = await spHttpClient.post(endpoint, SPHttpClient.configurations.v1, {
          headers: {
            Accept: 'application/json;odata=nometadata'
          }
        });

        if (!response.ok) {
          throw new Error(`Unable to delete ${item.name} (${response.status} ${response.statusText}).`);
        }
      }

      setSelectedItemUrls(new Set<string>());
    }, `Moved ${selectedItems.length} item${selectedItems.length === 1 ? '' : 's'} to Recycle Bin.`);
  };

  const breadcrumbs = activeRoot ? buildBreadcrumbs(activeRoot, currentPath) : [];
  const currentFolderUrl = activeRoot ? toAbsoluteUrl(activeRoot.siteUrl, currentPath) : '';

  return (
    <section className={`${styles.documentsExplorer} ${hasTeamsContext ? styles.teams : ''}`}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Unified Team Libraries</p>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>Browse approved SharePoint libraries in one web part while respecting each user&apos;s existing permissions.</p>
        </div>
      </div>

      {configurationError && <div className={styles.error}>{configurationError}</div>}

      {!activeRoot && (
        <div className={styles.rootGrid}>
          {roots.map((root) => (
            <button key={`${root.siteUrl}${root.rootPath}`} className={styles.rootCard} onClick={() => openRoot(root)}>
              <span className={styles.rootCardLabel}>Library Root</span>
              <strong>{root.name}</strong>
              <span className={styles.rootCardPath}>{root.rootPath}</span>
            </button>
          ))}
        </div>
      )}

      {activeRoot && (
        <div className={styles.browserShell}>
          <input
            ref={uploadInputRef}
            type="file"
            multiple
            className={styles.hiddenInput}
            onChange={(event) => {
              onFileInputChanged(event).catch(() => undefined);
            }}
          />

          <div className={styles.toolbar}>
            <button className={styles.secondaryButton} onClick={resetToRoots}>Back to libraries</button>
            <button className={styles.secondaryButton} onClick={() => navigateToPath(activeRoot.rootPath)}>Root</button>
            <button className={styles.secondaryButton} onClick={() => { createFolder().catch(() => undefined); }} disabled={isBusy}>New folder</button>
            <button className={styles.secondaryButton} onClick={() => { createFile().catch(() => undefined); }} disabled={isBusy}>New file</button>
            <button className={styles.secondaryButton} onClick={() => uploadInputRef.current?.click()} disabled={isBusy}>Upload file</button>
            <button className={styles.secondaryButton} onClick={() => startClipboardAction('copy')} disabled={selectedItems.length === 0 || isBusy}>Copy</button>
            <button className={styles.secondaryButton} onClick={() => startClipboardAction('cut')} disabled={selectedItems.length === 0 || isBusy}>Cut</button>
            <button className={styles.secondaryButton} onClick={() => { pasteClipboard().catch(() => undefined); }} disabled={!clipboard || isBusy}>Paste</button>
            <button className={styles.secondaryButton} onClick={() => { deleteSelectedItems().catch(() => undefined); }} disabled={selectedItems.length === 0 || isBusy}>Delete</button>
            <button className={styles.secondaryButton} onClick={refreshItems} disabled={isBusy}>Refresh</button>
            <button className={styles.primaryButton} onClick={() => openSharePointUrl(currentFolderUrl)}>Open current folder in SharePoint</button>
          </div>

          {clipboard && (
            <div className={styles.infoBanner}>
              Clipboard: {clipboard.mode === 'copy' ? 'Copy' : 'Cut'} {clipboard.items.length} item{clipboard.items.length === 1 ? '' : 's'}.
            </div>
          )}

          {operationInfo && <div className={styles.infoBanner}>{operationInfo}</div>}

          <div className={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && <span className={styles.breadcrumbDivider}>/</span>}
                <button className={styles.breadcrumbButton} onClick={() => navigateToPath(crumb.path)}>{crumb.label}</button>
              </React.Fragment>
            ))}
          </div>

          {isLoading && <div className={styles.loading}>Loading folder contents...</div>}
          {loadError && <div className={styles.error}>{loadError}</div>}
          {operationError && <div className={styles.error}>{operationError}</div>}

          {!isLoading && !loadError && items.length === 0 && (
            <div className={styles.emptyState}>This folder is empty or no visible content is available for your account.</div>
          )}

          {!isLoading && !loadError && items.length > 0 && (
            <div className={styles.itemList}>
              {items.map((item) => (
                <div
                  key={item.serverRelativeUrl}
                  className={`${styles.itemRow} ${selectedItemUrls.has(item.serverRelativeUrl) ? styles.itemRowSelected : ''}`}
                >
                  <label className={styles.selectCell}>
                    <input
                      type="checkbox"
                      checked={selectedItemUrls.has(item.serverRelativeUrl)}
                      onChange={() => toggleSelection(item.serverRelativeUrl)}
                    />
                  </label>
                  <button
                    className={styles.itemMain}
                    onClick={() => item.isFolder
                      ? navigateToPath(item.serverRelativeUrl)
                      : openSharePointUrl(toAbsoluteUrl(activeRoot.siteUrl, item.serverRelativeUrl))}
                  >
                    <span className={`${styles.itemBadge} ${item.isFolder ? styles.folderBadge : styles.fileBadge}`}>
                      {item.isFolder ? 'Folder' : 'File'}
                    </span>
                    <span className={styles.itemText}>
                      <strong>{item.name}</strong>
                      <span className={styles.itemMeta}>
                        {item.modifiedLabel && <span>{item.modifiedLabel}</span>}
                        {item.sizeLabel && <span>{item.sizeLabel}</span>}
                      </span>
                    </span>
                  </button>
                  <button
                    className={styles.inlineLink}
                    onClick={() => openSharePointUrl(toAbsoluteUrl(activeRoot.siteUrl, item.serverRelativeUrl))}
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

function buildFolderApiUrl(siteUrl: string, folderPath: string): string {
  const normalizedPath = normalizeServerRelativePath(folderPath);
  const odataPath = normalizedPath.replace(/'/g, "''");
  const query = "$select=Name,ServerRelativeUrl,Folders/Name,Folders/ServerRelativeUrl,Files/Name,Files/ServerRelativeUrl,Files/TimeLastModified,Files/Length&$expand=Folders,Files";
  return `${siteUrl}/_api/web/GetFolderByServerRelativePath(decodedurl='${odataPath}')?${query}`;
}

function mapFolderResponse(payload: ISharePointFolderResponse): IExplorerItem[] {
  const folders = ensureArray<ISharePointFolderChild>(payload.Folders)
    .filter((folder) => folder.Name && folder.Name !== 'Forms')
    .map((folder) => ({
      name: folder.Name,
      serverRelativeUrl: folder.ServerRelativeUrl,
      isFolder: true
    }));

  const files = ensureArray<ISharePointFileChild>(payload.Files)
    .map((file) => ({
      name: file.Name,
      serverRelativeUrl: file.ServerRelativeUrl,
      isFolder: false,
      sizeLabel: formatFileSize(file.Length),
      modifiedLabel: formatModifiedDate(file.TimeLastModified)
    }));

  return [
    ...folders.sort((left, right) => left.name.localeCompare(right.name)),
    ...files.sort((left, right) => left.name.localeCompare(right.name))
  ];
}

function ensureArray<T>(collection: T[] | { results: T[] } | undefined): T[] {
  if (!collection) {
    return [];
  }

  if (Array.isArray(collection)) {
    return collection;
  }

  return collection.results || [];
}

function normalizeServerRelativePath(path: string): string {
  if (!path) {
    return '/';
  }

  const trimmed = path.trim().replace(/\/+$/g, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function joinServerRelativePath(basePath: string, leafName: string): string {
  const base = normalizeServerRelativePath(basePath);
  const trimmedLeaf = leafName.replace(/^\/+|\/+$/g, '');
  return `${base}/${trimmedLeaf}`.replace(/\/+/g, '/');
}

function sanitizeItemName(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed === '.' || trimmed === '..' || /[\\/:*?"<>|]/.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

function escapeODataLiteral(value: string): string {
  return value.replace(/'/g, "''");
}

async function copyOrMoveItem(
  destinationSiteUrl: string,
  sourceSiteUrl: string,
  item: IExplorerItem,
  destinationServerRelativePath: string,
  move: boolean,
  spHttpClient: SPHttpClient
): Promise<void> {
  const method = item.isFolder
    ? (move ? 'MoveFolderByPath' : 'CopyFolderByPath')
    : (move ? 'MoveFileByPath' : 'CopyFileByPath');
  const endpoint = `${destinationSiteUrl}/_api/SP.MoveCopyUtil.${method}()`;
  const requestBody = {
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

  const response = await spHttpClient.post(endpoint, SPHttpClient.configurations.v1, {
    body: JSON.stringify(requestBody),
    headers: {
      Accept: 'application/json;odata=nometadata',
      'Content-Type': 'application/json;odata=verbose;charset=utf-8'
    }
  });

  if (!response.ok) {
    throw new Error(`Unable to ${move ? 'move' : 'copy'} ${item.name} (${response.status} ${response.statusText}).`);
  }
}

function buildBreadcrumbs(root: IExplorerRoot, currentPath: string): Array<{ label: string; path: string }> {
  const rootPath = normalizeServerRelativePath(root.rootPath);
  const normalizedCurrentPath = normalizeServerRelativePath(currentPath);
  const relativePath = normalizedCurrentPath.startsWith(rootPath)
    ? normalizedCurrentPath.slice(rootPath.length)
    : '';
  const segments = relativePath.split('/').filter(Boolean);
  const breadcrumbs = [{ label: root.name, path: rootPath }];
  let runningPath = rootPath;

  segments.forEach((segment) => {
    runningPath = `${runningPath}/${segment}`;
    breadcrumbs.push({ label: segment, path: runningPath });
  });

  return breadcrumbs;
}

function toAbsoluteUrl(siteUrl: string, serverRelativeUrl: string): string {
  return new URL(normalizeServerRelativePath(serverRelativeUrl), siteUrl).toString();
}

function formatFileSize(rawLength: string | undefined): string | undefined {
  if (!rawLength) {
    return undefined;
  }

  const bytes = parseInt(rawLength, 10);

  if (Number.isNaN(bytes)) {
    return undefined;
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatModifiedDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toLocaleString();
}

export default DocumentsExplorer;
