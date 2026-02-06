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
        
        // GET: api/configuracion/schemas
        [HttpGet("schemas")]
        [Authorize(Roles = "Root")]
        public async Task<ActionResult<IEnumerable<string>>> GetAvailableSchemas()
        {
            // Consultamos los schemas reales de Postgres, excluyendo los de sistema y 'public' si es necesario
            // Nota: Usamos raw SQL porque DbContext suele estar atado a un schema, pero aquí queremos ver "desde arriba"
            var schemas = new List<string>();
            
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema' AND nspname <> 'public'";
                _context.Database.OpenConnection();
                
                using (var result = await command.ExecuteReaderAsync())
                {
                    while (await result.ReadAsync())
                    {
                        schemas.Add(result.GetString(0));
                    }
                }
            }
            
            return Ok(schemas);
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
        // PUT: api/configuracion
        [HttpPut]
        [Authorize(Roles = "Root,Admin")] // Solo admins pueden cambiar diseño
        public async Task<ActionResult<ConfiguracionSistema>> UpdateConfiguracion(ConfiguracionSistema model)
        {
            var config = await _context.Configuraciones.FirstOrDefaultAsync();

            if (config == null)
            {
                // Create if not exists
                config = new ConfiguracionSistema();
                _context.Configuraciones.Add(config);
            }

            // Update fields manually to avoid overwriting ID or restricted fields if any
            config.NombreOptica = model.NombreOptica;
            config.Eslogan = model.Eslogan;
            config.LogoUrl = model.LogoUrl;
            config.ColorPrimario = model.ColorPrimario;
            config.ColorSecundario = model.ColorSecundario;
            config.ColorAcento = model.ColorAcento;
            config.ColorTextoBase = model.ColorTextoBase;
            config.Direccion = model.Direccion;
            config.Telefono = model.Telefono;
            config.EmailContacto = model.EmailContacto;
            config.UltimaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(config);
        }
    }
}