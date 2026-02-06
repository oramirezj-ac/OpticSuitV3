using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Dtos.Consultations;
using OpticBackend.Models;
using System.Text.Json;

namespace OpticBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ConsultationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ConsultationsController> _logger;

        public ConsultationsController(ApplicationDbContext context, ILogger<ConsultationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/consultations
        [HttpPost]
        public async Task<ActionResult<Consultation>> CreateConsultation(CreateConsultationDto model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var consulta = new Consultation
                {
                    PacienteId = model.PacienteId,
                    Fecha = model.Fecha ?? DateTime.Now,
                    MotivoConsulta = model.MotivoConsulta,
                    Observaciones = model.Observaciones,
                    CostoServicio = model.CostoServicio,
                    EstadoFinanciero = model.EstadoFinanciero,
                    UsuarioId = model.UsuarioId,
                    DetallesClinicos = model.DetallesClinicos != null ? JsonSerializer.Serialize(model.DetallesClinicos) : "{}"
                };

                if (consulta.Fecha.Kind == DateTimeKind.Unspecified)
                    consulta.Fecha = DateTime.SpecifyKind(consulta.Fecha, DateTimeKind.Utc);

                _context.Consultas.Add(consulta);
                await _context.SaveChangesAsync();

                if (model.Graduaciones != null && model.Graduaciones.Any())
                {
                    foreach (var gradDto in model.Graduaciones)
                    {
                        var graduation = new Graduation
                        {
                            ConsultaId = consulta.Id,
                            TipoGraduacion = gradDto.TipoGraduacion,
                            OdEsfera = gradDto.OdEsfera,
                            OdCilindro = gradDto.OdCilindro,
                            OdEje = gradDto.OdEje,
                            OdAdicion = gradDto.OdAdicion,
                            OiEsfera = gradDto.OiEsfera,
                            OiCilindro = gradDto.OiCilindro,
                            OiEje = gradDto.OiEje,
                            OiAdicion = gradDto.OiAdicion,
                            DetallesMontaje = gradDto.DetallesMontaje != null ? JsonSerializer.Serialize(gradDto.DetallesMontaje) : "{}"
                        };
                        _context.Graduaciones.Add(graduation);
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetConsultation), new { id = consulta.Id }, consulta);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating consultation");
                return StatusCode(500, new { message = "Error al guardar la consulta" });
            }
        }

        // POST: api/consultations/{id}/graduations
        [HttpPost("{id}/graduations")]
        public async Task<ActionResult<Graduation>> AddGraduation(Guid id, CreateGraduationDto model)
        {
            var consultation = await _context.Consultas.FindAsync(id);
            if (consultation == null) return NotFound("Consulta no encontrada");

            var graduation = new Graduation
            {
                ConsultaId = id,
                TipoGraduacion = model.TipoGraduacion,
                OdEsfera = model.OdEsfera,
                OdCilindro = model.OdCilindro,
                OdEje = model.OdEje,
                OdAdicion = model.OdAdicion,
                OiEsfera = model.OiEsfera,
                OiCilindro = model.OiCilindro,
                OiEje = model.OiEje,
                OiAdicion = model.OiAdicion,
                DetallesMontaje = model.DetallesMontaje != null ? JsonSerializer.Serialize(model.DetallesMontaje) : "{}"
            };

            _context.Graduaciones.Add(graduation);
            await _context.SaveChangesAsync();

            // Avoid returning the entity directly to prevent object cycle
            var result = new
            {
                graduation.Id,
                graduation.ConsultaId,
                graduation.TipoGraduacion,
                graduation.OdEsfera,
                graduation.OdCilindro,
                graduation.OdEje,
                graduation.OdAdicion,
                graduation.OiEsfera,
                graduation.OiCilindro,
                graduation.OiEje,
                graduation.OiAdicion,
                graduation.DetallesMontaje
            };

            return CreatedAtAction(nameof(GetGraduation), new { id = graduation.Id }, result);
        }

        // GET: api/consultations/graduations/{id}
        [HttpGet("graduations/{id}")]
        public async Task<ActionResult<Graduation>> GetGraduation(Guid id)
        {
            var graduation = await _context.Graduaciones.FindAsync(id);
            if (graduation == null) return NotFound();
            return Ok(graduation);
        }


        // GET: api/consultations/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Consultation>> GetConsultation(Guid id)
        {
            var consultation = await _context.Consultas
                .Include(c => c.Graduaciones)
                .Include(c => c.Paciente)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (consultation == null) return NotFound();

            return Ok(consultation);
        }

        // GET: api/consultations/patient/{patientId}
        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<Consultation>>> GetPatientConsultations(Guid patientId)
        {
            var consultations = await _context.Consultas
                .Where(c => c.PacienteId == patientId)
                .Include(c => c.Graduaciones)
                .OrderByDescending(c => c.Fecha)
                .ToListAsync();

            return Ok(consultations);
        }
        // DELETE: api/consultations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConsultation(Guid id)
        {
            var consultation = await _context.Consultas.FindAsync(id);
            if (consultation == null) return NotFound();

            // Optional: check if sale exists if FK isn't cascade, or handle exception
            try 
            {
                _context.Consultas.Remove(consultation);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Consulta eliminada" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting consultation");
                // Likely a foreign key constraint to Sales if not set to cascade
                return BadRequest("No se puede eliminar porque tiene registros relacionados (ej. ventas).");
            }
        }
    }
}
