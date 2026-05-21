# TeamDashboardApi

Azure Functions (C# isolated worker) API for PowerApps dashboard data points.

## Endpoint

- `GET /api/GetDCCTasks?userEmail=<email>`
- Returns tickets from Kusto table `TicketsSnapshot` where `AssignedTo` or `CreatedBy` matches `userEmail`.

## Required Settings

Set these in local.settings.json (local) and Function App Configuration (Azure):

- `KustoClusterUri`
- `KustoDatabase` (default expected: `COIDG`)
- `KustoTable` (default expected: `TicketsSnapshot`)
- `ManagedIdentityClientId` (optional, only for user-assigned identity)

## Local Run

1. Install .NET 8 SDK and Azure Functions Core Tools v4.
2. From this folder:
   - `dotnet restore`
   - `func start`

## Deploy

1. Create Azure Function App (.NET isolated).
2. Enable Managed Identity on the Function App.
3. Grant this identity Kusto read access to DB/table.
4. Configure app settings listed above.
5. Deploy:
   - `func azure functionapp publish <your-functionapp-name>`

## Response Shape

```json
[
  {
    "ticketId": "TCK-12345",
    "title": "Investigate alert",
    "status": "Open",
    "updatedOn": "2026-05-13T10:20:30Z"
  }
]
```
