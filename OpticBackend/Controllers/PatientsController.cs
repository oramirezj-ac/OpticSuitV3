/* PatientsController.cs */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Dtos;
using OpticBackend.Models;
using OpticBackend.Extensions;
using OpticBackend.Services.Interfaces;

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
                var years = await _context.Pacientes
                    .Select(p => p.FechaRegistro.Year)
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
        public async Task<ActionResult<IEnumerable<PatientDto>>> GetAuditPatients([FromQuery] int year, [FromQuery] string letter)
        {
            try
            {
                if (string.IsNullOrEmpty(letter))
                {
                    return BadRequest(new { message = "La letra inicial es requerida" });
                }

                var letterLower = letter.ToLower().Substring(0, 1);

                // Filter logic:
                // Year matches
                // ApellidoPaterno starts with letter
                
                var query = _context.Pacientes
                    .Where(p => p.FechaRegistro.Year == year && 
                                p.ApellidoPaterno != null && 
                                p.ApellidoPaterno.ToLower().StartsWith(letterLower));

                // Sort: Apellido Paterno ASC, Apellido Materno ASC, Nombre ASC
                var patients = await query
                    .OrderBy(p => p.ApellidoPaterno)
                    .ThenBy(p => p.ApellidoMaterno)
                    .ThenBy(p => p.Nombre)
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

                return Ok(dtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit patients");
                return StatusCode(500, new { message = "Error al realizar la auditoría" });
            }
        }

        // GET: api/patients
        [HttpGet]
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
                    search = search.ToLower();
                    query = query.Where(p => 
                        p.Nombre.ToLower().Contains(search) || 
                        (p.ApellidoPaterno != null && p.ApellidoPaterno.ToLower().Contains(search)) ||
                        (p.Telefono != null && p.Telefono.Contains(search)) ||
                        (p.Email != null && p.Email.ToLower().Contains(search))
                    );
                }

                var totalItems = await query.CountAsync();

                // Ordenar por fecha de registro descendente
                var patients = await query
                    .OrderByDescending(p => p.FechaRegistro)
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

        // GET: api/patients/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PatientDto>> GetPatient(Guid id) // Changed to Guid
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
        public async Task<IActionResult> DeletePatient(Guid id) // Changed to Guid
        {
            try 
            {
                var patient = await _context.Pacientes.FindAsync(id);
                if (patient == null)
                {
                    return NotFound();
                }

                _context.Pacientes.Remove(patient);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al eliminar paciente {Id}", id);
                return StatusCode(500, new { message = "No se puede eliminar el paciente, es posible que tenga consultas o ventas asociadas." });
            }
        }

        private bool PatientExists(Guid id)
        {
            return _context.Pacientes.Any(e => e.Id == id);
        }
    }
}
