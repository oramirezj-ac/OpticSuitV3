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
                
                if (!string.IsNullOrEmpty(tenantClaim))
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