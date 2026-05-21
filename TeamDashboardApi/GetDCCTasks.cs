using System.Net;
using System.Text.Json;
using Azure.Core;
using Azure.Identity;
using Kusto.Data;
using Kusto.Data.Common;
using Kusto.Data.Net.Client;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

public sealed class GetDCCTasks
{
    private readonly KustoTicketClient _kustoTicketClient;
    private readonly ILogger<GetDCCTasks> _logger;

    public GetDCCTasks(KustoTicketClient kustoTicketClient, ILogger<GetDCCTasks> logger)
    {
        _kustoTicketClient = kustoTicketClient;
        _logger = logger;
    }

    [Function("GetDCCTasks")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "GetDCCTasks")] HttpRequestData req)
    {
        var userEmail = GetQueryParameter(req.Url.Query, "userEmail");
        if (string.IsNullOrWhiteSpace(userEmail))
        {
            var badRequest = req.CreateResponse(HttpStatusCode.BadRequest);
            await badRequest.WriteAsJsonAsync(new
            {
                error = "Missing required query parameter: userEmail"
            });
            return badRequest;
        }

        try
        {
            var rows = _kustoTicketClient.GetTicketsByEmail(userEmail);

            var ok = req.CreateResponse(HttpStatusCode.OK);
            await ok.WriteStringAsync(JsonSerializer.Serialize(rows));
            ok.Headers.Add("Content-Type", "application/json");
            return ok;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query Kusto for userEmail {Email}", userEmail);
            var error = req.CreateResponse(HttpStatusCode.InternalServerError);
            await error.WriteAsJsonAsync(new
            {
                error = "Failed to retrieve DCC tasks"
            });
            return error;
        }
    }

    private static string? GetQueryParameter(string query, string key)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return null;
        }

        var trimmed = query.StartsWith('?') ? query[1..] : query;
        var segments = trimmed.Split('&', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var segment in segments)
        {
            var kvp = segment.Split('=', 2);
            if (kvp.Length == 0)
            {
                continue;
            }

            var currentKey = Uri.UnescapeDataString(kvp[0]);
            if (!string.Equals(currentKey, key, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (kvp.Length == 1)
            {
                return string.Empty;
            }

            return Uri.UnescapeDataString(kvp[1]);
        }

        return null;
    }
}

public sealed class KustoTicketClient
{
    private readonly string _clusterUri;
    private readonly string _database;
    private readonly string _table;
    private readonly TokenCredential _credential;

    public KustoTicketClient()
    {
        _clusterUri = Environment.GetEnvironmentVariable("KustoClusterUri")
            ?? throw new InvalidOperationException("KustoClusterUri app setting is missing.");
        _database = Environment.GetEnvironmentVariable("KustoDatabase")
            ?? throw new InvalidOperationException("KustoDatabase app setting is missing.");
        _table = Environment.GetEnvironmentVariable("KustoTable")
            ?? "TicketsSnapshot";

        var managedIdentityClientId = Environment.GetEnvironmentVariable("ManagedIdentityClientId");
        _credential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
        {
            ManagedIdentityClientId = string.IsNullOrWhiteSpace(managedIdentityClientId) ? null : managedIdentityClientId
        });
    }

    public IReadOnlyList<TicketDto> GetTicketsByEmail(string userEmail)
    {
        var token = _credential.GetToken(
            new TokenRequestContext(new[] { "https://kusto.kusto.windows.net/.default" }),
            default).Token;

        var kcsb = new KustoConnectionStringBuilder(_clusterUri)
            .WithAadUserTokenAuthentication(token);

        using var queryProvider = KustoClientFactory.CreateCslQueryProvider(kcsb);

        var clientRequestProperties = new ClientRequestProperties();
        clientRequestProperties.SetParameter("userEmail", userEmail);

        var query = $@"
            declare query_parameters(userEmail:string);
            {_table}
            | where tolower(AssignedTo) == tolower(userEmail) or tolower(CreatedBy) == tolower(userEmail)
            | project TicketId, Title, Status, UpdatedOn
            | top 200 by UpdatedOn desc
        ";

        using var reader = queryProvider.ExecuteQuery(_database, query, clientRequestProperties);
        var results = new List<TicketDto>();

        while (reader.Read())
        {
            var ticketId = reader["TicketId"]?.ToString() ?? string.Empty;
            var title = reader["Title"]?.ToString() ?? string.Empty;
            var status = reader["Status"]?.ToString() ?? string.Empty;
            DateTime? updatedOn = null;
            if (reader["UpdatedOn"] != DBNull.Value && reader["UpdatedOn"] is DateTime dt)
            {
                updatedOn = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
            }

            results.Add(new TicketDto(ticketId, title, status, updatedOn));
        }

        return results;
    }
}

public sealed record TicketDto(
    string TicketId,
    string Title,
    string Status,
    DateTime? UpdatedOn);
