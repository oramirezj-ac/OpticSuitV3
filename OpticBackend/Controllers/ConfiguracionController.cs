using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Models;
using OpticBackend.Services;

namespace OpticBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConfiguracionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ConfiguracionController> _logger;
        private readonly TenantService _tenantService;

        public ConfiguracionController(
            ApplicationDbContext context, 
            ILogger<ConfiguracionController> logger,
            TenantService tenantService)
        {
            _context = context;
            _logger = logger;
            _tenantService = tenantService;
        }

        // GET: api/configuracion
        [HttpGet]
        [Authorize] // ✅ Requiere JWT válido
        public async Task<ActionResult<ConfiguracionSistema>> GetConfiguracion()
        {
            _logger.LogInformation("📋 Solicitando configuración del sistema");
            _logger.LogInformation("🔍 TenantService.TenantId actual: {TenantId}", _tenantService.TenantId);
            
            // Tomamos la primera configuración disponible
            var config = await _context.Configuraciones.FirstOrDefaultAsync();

            if (config == null)
            {
                _logger.LogWarning("⚠️ No se encontró configuración en el schema actual");
                return NotFound("No se encontró la configuración del sistema.");
            }

            _logger.LogInformation("✅ Configuración encontrada: {NombreOptica}, Color: {Color}", 
                config.NombreOptica, config.ColorPrimario);
            
            return Ok(config);
        }
        
        // GET: api/configuracion/test - Endpoint de prueba SIN autenticación
        [HttpGet("test")]
        public ActionResult<object> GetTest()
        {
            return Ok(new
            {
                mensaje = "API funcionando correctamente",
                tenantIdActual = _tenantService.TenantId,
                timestamp = DateTime.UtcNow
            });
        }
    }
}