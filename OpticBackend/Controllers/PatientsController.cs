/* PatientsController.cs */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Dtos;
using OpticBackend.Models;
using OpticBackend.Extensions;
using OpticBackend.Services.Interfaces;
using System.Text.RegularExpressions;

namespace OpticBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PatientsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<PatientsController> _logger;
        private readonly IPatientDuplicationService _duplicationService;

        public PatientsController(
            ApplicationDbContext context, 
            ILogger<PatientsController> logger,
            IPatientDuplicationService duplicationService)
        {
            _context = context;
            _logger = logger;
            _duplicationService = duplicationService;
        }

        // GET: api/patients/audit/years
        [HttpGet("audit/years")]
        public async Task<ActionResult<IEnumerable<int>>> GetAuditYears()
        {
            try
            {
                var years = await _context.Ventas
                    .Where(v => v.Fecha.HasValue && 
                               v.FolioFisico != null && 
                               !v.FolioFisico.StartsWith("MED-") && 
                               !v.FolioFisico.StartsWith("CL-") && 
                               !v.FolioFisico.StartsWith("VM-"))
                    .Select(v => v.Fecha.Value.Year)
                    .Distinct()
                    .OrderByDescending(y => y)
                    .ToListAsync();
                return Ok(years);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit years");
                return StatusCode(500, new { message = "Error al obtener años disponibles" });
            }
        }

        // GET: api/patients/audit
        [HttpGet("audit")]
        public async Task<ActionResult<IEnumerable<PatientAuditDto>>> GetAuditPatients([FromQuery] int year, [FromQuery] string letter)
        {
            try
            {
                if (string.IsNullOrEmpty(letter))
                {
                    return BadRequest(new { message = "La letra inicial es requerida" });
                }

                var letterUpper = letter.ToUpper().Substring(0, 1);
                
                // For accent handling in initial letter (common in Spanish)
                string letterSearch = letterUpper;
                if (letterUpper == "A") letterSearch = "[AÁ]";
                else if (letterUpper == "E") letterSearch = "[EÉ]";
                else if (letterUpper == "I") letterSearch = "[IÍ]";
                else if (letterUpper == "O") letterSearch = "[OÓ]";
                else if (letterUpper == "U") letterSearch = "[UÚÜ]";
                else letterSearch = letterUpper;

                // Build a regex pattern for StartsWith
                string pattern = "^" + (letterSearch.StartsWith("[") ? letterSearch : Regex.Escape(letterSearch));

                _logger.LogInformation("Auditing year {Year}, letter {Letter} (pattern: {Pattern})", year, letter, pattern);

                // Use Include to ensure we have the patient data if joined
                var query = from v in _context.Ventas
                            join p in _context.Pacientes on v.PacienteId equals p.Id
                            where v.Fecha.HasValue && v.Fecha.Value.Year == year &&
                                  v.FolioFisico != null
                            select new { v, p };

                var data = await query.ToListAsync();
                
                var filtered = data
                    .Where(x => {
                        var f = x.v.FolioFisico?.ToUpper().Trim() ?? "";
                        // Exclude service prefixes
                        bool isService = f.StartsWith("MED-") || f.StartsWith("CL-") || f.StartsWith("VM-");
                        if (isService) return false;

                        // Check initial letter with accent consideration
                        var ap = x.p.ApellidoPaterno?.Trim() ?? "";
                        if (string.IsNullOrEmpty(ap)) return false;
                        
                        return Regex.IsMatch(ap, pattern, RegexOptions.IgnoreCase);
                    })
                    .OrderBy(x => x.p.ApellidoPaterno)
                    .ThenBy(x => x.p.ApellidoMaterno)
                    .ThenBy(x => x.p.Nombre)
                    .ThenBy(x => x.v.Fecha)
                    .Select(x => new PatientAuditDto
                    {
                        PatientId = x.p.Id,
                        NombreCompleto = $"{x.p.Nombre} {x.p.ApellidoPaterno} {x.p.ApellidoMaterno}".Trim(),
                        FolioFisico = x.v.FolioFisico,
                        FechaVenta = x.v.Fecha,
                        ApellidoPaterno = x.p.ApellidoPaterno,
                        ApellidoMaterno = x.p.ApellidoMaterno,
                        Nombre = x.p.Nombre
                    })
                    .ToList();

                _logger.LogInformation("Found {Count} audit records", filtered.Count);
                return Ok(filtered);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit patients with letter {Letter}", letter);
                return StatusCode(500, new { message = "Error al realizar la auditoría" });
            }
        }

        // GET: api/patients
        [HttpGet]
        public async Task<ActionResult<object>> GetPatients(
            [FromQuery] string? search, 
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var query = _context.Pacientes.AsQueryable();

                if (!string.IsNullOrEmpty(search))
                {
                    search = search.Trim();
                    // Determine if the search is likely a phone number or email to avoid complex regex on them
                    bool isEmailOrPhone = search.Contains("@") || search.Any(char.IsDigit);

                    if (isEmailOrPhone)
                    {
                        search = search.ToLower();
                        query = query.Where(p => 
                            (p.Telefono != null && p.Telefono.Contains(search)) ||
                            (p.Email != null && p.Email.ToLower().Contains(search))
                        );
                    }
                    else
                    {
                        // Build accent-insensitive regex pattern
                        string pattern = BuildAccentInsensitiveRegex(search);
                        
                        // EF Core will translate Regex.IsMatch to PostgreSQL ~* (regex match ignoring case)
                        query = query.Where(p => 
                            Regex.IsMatch(p.Nombre, pattern, RegexOptions.IgnoreCase) || 
                            (p.ApellidoPaterno != null && Regex.IsMatch(p.ApellidoPaterno, pattern, RegexOptions.IgnoreCase)) ||
                            (p.ApellidoMaterno != null && Regex.IsMatch(p.ApellidoMaterno, pattern, RegexOptions.IgnoreCase))
                        );
                    }
                }

                var totalItems = await query.CountAsync();

                // Ordenar por fecha de actualización descendente (más recientes primero)
                var patients = await query
                    .OrderByDescending(p => p.FechaActualizacion)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var dtos = patients.Select(p => new PatientDto
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    ApellidoPaterno = p.ApellidoPaterno,
                    ApellidoMaterno = p.ApellidoMaterno,
                    Telefono = p.Telefono,
                    Email = p.Email,
                    Direccion = p.Direccion,
                    Edad = p.FechaNacimiento.CalculateAge(), 
                    Ocupacion = p.Ocupacion,
                    Notas = p.Notas,
                    FechaRegistro = p.FechaRegistro,
                    EstaActivo = p.EstaActivo
                }).ToList();

                return Ok(new 
                { 
                    Items = dtos, 
                    TotalItems = totalItems, 
                    Page = page, 
                    PageSize = pageSize,
                    TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener pacientes");
                return StatusCode(500, new { message = "Error interno al procesar la solicitud" });
            }
        }

        // GET: api/patients/search (Check if search is used)
        
        // GET: api/patients/{id:guid}
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<PatientDto>> GetPatient(Guid id) // Added :guid constraint
        {
            var patient = await _context.Pacientes.FindAsync(id);

            if (patient == null)
            {
                return NotFound();
            }

            return new PatientDto
            {
                Id = patient.Id,
                Nombre = patient.Nombre,
                ApellidoPaterno = patient.ApellidoPaterno,
                ApellidoMaterno = patient.ApellidoMaterno,
                Telefono = patient.Telefono,
                Email = patient.Email,
                Direccion = patient.Direccion,
                Edad = patient.FechaNacimiento.CalculateAge(),
                Ocupacion = patient.Ocupacion,
                Notas = patient.Notas,
                FechaRegistro = patient.FechaRegistro,
                EstaActivo = patient.EstaActivo
            };
        }



        // POST: api/patients/check-duplicates
        [HttpPost("check-duplicates")]
        public async Task<ActionResult<IEnumerable<PatientDto>>> CheckDuplicates(CreatePatientDto model)
        {
            try
            {
                var duplicates = await _duplicationService.FindDuplicatesAsync(
                    model.Nombre,
                    model.ApellidoPaterno,
                    model.ApellidoMaterno,
                    model.Telefono
                );

                var dtos = duplicates.Select(p => p.ToDto()).ToList();
                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking duplicates");
                return StatusCode(500, new { message = "Error verificando duplicados" });
            }
        }

        // POST: api/patients
        [HttpPost]
        public async Task<ActionResult<PatientDto>> CreatePatient(CreatePatientDto model)
        {
            try 
            {
                // Ensure correct DateTime Kind for Postgres timestamptz
                DateTime finalFechaRegistro = model.FechaRegistro ?? DateTime.UtcNow;
                if (finalFechaRegistro.Kind == DateTimeKind.Unspecified)
                {
                    finalFechaRegistro = DateTime.SpecifyKind(finalFechaRegistro, DateTimeKind.Utc);
                }

                var patient = new Patient
                {
                    Nombre = model.Nombre,
                    ApellidoPaterno = model.ApellidoPaterno,
                    ApellidoMaterno = model.ApellidoMaterno,
                    Telefono = model.Telefono,
                    Email = model.Email,
                    Direccion = model.Direccion,
                    FechaNacimiento = model.FechaNacimiento,
                    Ocupacion = model.Ocupacion,
                    Notas = model.Notas,
                    FechaRegistro = finalFechaRegistro,
                    EstaActivo = true
                };

                _context.Pacientes.Add(patient);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPatient), new { id = patient.Id }, new PatientDto { Id = patient.Id, Nombre = patient.Nombre });
            }
            catch (Exception ex)
            {
                var innerMessage = ex.InnerException != null ? ex.InnerException.Message : ex.Message;
                _logger.LogError(ex, "Error al crear paciente {Nombre}: {InnerMessage}", model.Nombre, innerMessage);
                return StatusCode(500, new { message = "Error al guardar: " + innerMessage });
            }
        }

        // PUT: api/patients/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(Guid id, UpdatePatientDto model)
        {
            var patient = await _context.Pacientes.FindAsync(id);

            if (patient == null)
            {
                return NotFound();
            }

            patient.Nombre = model.Nombre;
            patient.ApellidoPaterno = model.ApellidoPaterno;
            patient.ApellidoMaterno = model.ApellidoMaterno;
            patient.Telefono = model.Telefono;
            patient.Email = model.Email;
            patient.Direccion = model.Direccion;
            patient.FechaNacimiento = model.FechaNacimiento;
            patient.Ocupacion = model.Ocupacion;
            patient.Notas = model.Notas;
            if (model.FechaRegistro.HasValue) 
            {
                var dt = model.FechaRegistro.Value;
                if (dt.Kind == DateTimeKind.Unspecified) dt = DateTime.SpecifyKind(dt, DateTimeKind.Utc);
                patient.FechaRegistro = dt;
            }
            patient.EstaActivo = model.EstaActivo;
            patient.FechaActualizacion = DateTime.UtcNow;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PatientExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/patients/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(Guid id)
        {
            try 
            {
                var patient = await _context.Pacientes.FindAsync(id);
                if (patient == null)
                {
                    return NotFound();
                }

                var consultasCount = await _context.Consultas.CountAsync(c => c.PacienteId == id);
                var detalleVentasCount = await _context.DetalleVentas.CountAsync(d => d.PacienteId == id);
                var ventasCount = await _context.Ventas.CountAsync(v => v.PacienteId == id);

                if (consultasCount > 0 || detalleVentasCount > 0 || ventasCount > 0)
                {
                    return Conflict(new { 
                        message = "No se puede eliminar porque existen registros en su expediente.",
                        counts = new { consultas = consultasCount, detalleVentas = detalleVentasCount, ventas = ventasCount }
                    });
                }

                _context.Pacientes.Remove(patient);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar paciente {Id}", id);
                return StatusCode(500, new { message = "Ocurrió un error al intentar eliminar el paciente." });
            }
        }

        private bool PatientExists(Guid id)
        {
            return _context.Pacientes.Any(e => e.Id == id);
        }

        private string BuildAccentInsensitiveRegex(string input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            // Escape special regex characters in the input
            string escapedInput = Regex.Escape(input);

            // Replace vowels with regex groups that include accented variants
            escapedInput = Regex.Replace(escapedInput, "a", "[aáäAÁÄ]", RegexOptions.IgnoreCase);
            escapedInput = Regex.Replace(escapedInput, "e", "[eéëEÉË]", RegexOptions.IgnoreCase);
            escapedInput = Regex.Replace(escapedInput, "i", "[iíïIÍÏ]", RegexOptions.IgnoreCase);
            escapedInput = Regex.Replace(escapedInput, "o", "[oóöOÓÖ]", RegexOptions.IgnoreCase);
            escapedInput = Regex.Replace(escapedInput, "u", "[uúüUÚÜ]", RegexOptions.IgnoreCase);

            return escapedInput;
        }
    }
}
