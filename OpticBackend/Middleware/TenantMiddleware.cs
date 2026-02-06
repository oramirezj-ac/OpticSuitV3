using OpticBackend.Services;

namespace OpticBackend.Middleware
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TenantMiddleware> _logger;

        public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, TenantService tenantService)
        {
            // ✅ Leer tenant del claim "tenant" en el JWT
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var tenantClaim = context.User.FindFirst("tenant")?.Value;
                var rolesClaim = context.User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
                // Ojo: En Identity los roles pueden venir como "role" simple o soap xml schema role
                var isRoot = context.User.IsInRole("Root"); 

                // Si es Root y envía un header explícito para cambiar de tenant
                if (isRoot && context.Request.Headers.TryGetValue("X-Tenant-ID", out var headerTenant))
                {
                    var targetTenant = headerTenant.ToString();
                    if (!string.IsNullOrWhiteSpace(targetTenant))
                    {
                        tenantService.TenantId = targetTenant;
                        _logger.LogInformation("🚀 [ROOT OVERRIDE] Cambiando contexto a Schema: {Schema}", targetTenant);
                    }
                    else
                    {
                        tenantService.TenantId = tenantClaim;
                    }
                }
                else if (!string.IsNullOrEmpty(tenantClaim))
                {
                    tenantService.TenantId = tenantClaim;
                    _logger.LogInformation("🔵 Usuario autenticado, Schema: {Schema}", tenantClaim);
                }
                else
                {
                    _logger.LogWarning("⚠️ Usuario autenticado pero sin claim 'tenant'");
                }
            }
            else
            {
                _logger.LogInformation("🔴 Usuario NO autenticado, usando schema por defecto: {Schema}", tenantService.TenantId);
            }

            await _next(context);
        }
    }
}