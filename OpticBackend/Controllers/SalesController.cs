using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Dtos.Sales;
using OpticBackend.Models;
using System.Text.Json;
using OpticBackend.Constants;

namespace OpticBackend.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SalesController> _logger;

        public SalesController(ApplicationDbContext context, ILogger<SalesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // POST: api/sales
        [HttpPost]
        public async Task<ActionResult<Sale>> CreateSale(CreateSaleDto model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Create Head Sale
                var sale = new Sale
                {
                    FolioFisico = model.FolioFisico,
                    Fecha = model.Fecha ?? DateTime.Now,
                    ConsultaId = model.ConsultaId,
                    TotalVenta = model.TotalVenta,
                    SaldoPendiente = model.SaldoPendiente, // Or calculate: Total - Sum(Payments)
                    ObservacionesGenerales = model.ObservacionesGenerales,
                    UsuarioId = !string.IsNullOrEmpty(model.UsuarioId) ? model.UsuarioId : null,
                    Estado = SaleConstants.StatusActive
                };

                if (sale.Fecha.HasValue && sale.Fecha.Value.Kind == DateTimeKind.Unspecified)
                    sale.Fecha = DateTime.SpecifyKind(sale.Fecha.Value, DateTimeKind.Utc);

                _context.Ventas.Add(sale);
                await _context.SaveChangesAsync();

                // 2. Create Details
                if (model.Detalles != null)
                {
                    foreach (var det in model.Detalles)
                    {
                        var detail = new SaleDetail
                        {
                            VentaId = sale.Id,
                            PacienteId = det.PacienteId,
                            GraduacionId = det.GraduacionId,
                            DpOd = det.DpOd,
                            DpOi = det.DpOi,
                            AlturaOblea = det.AlturaOblea,
                            DescripcionManual = det.DescripcionManual,
                            PrecioAplicado = det.PrecioAplicado,
                            CatalogoId = det.CatalogoId
                        };
                        _context.DetalleVentas.Add(detail);
                    }
                }

                // 3. Create Initial Payments (Abonos)
                decimal totalPagado = 0;
                if (model.AbonosIniciales != null)
                {
                    foreach (var pay in model.AbonosIniciales)
                    {
                        var payment = new Payment
                        {
                            VentaId = sale.Id,
                            Monto = pay.Monto,
                            MetodoPago = pay.MetodoPago,
                            FechaPago = pay.FechaPago ?? DateTime.Now,
                            UsuarioId = !string.IsNullOrEmpty(pay.UsuarioId) ? pay.UsuarioId : (!string.IsNullOrEmpty(model.UsuarioId) ? model.UsuarioId : null)
                        };
                        
                        if (payment.FechaPago.Value.Kind == DateTimeKind.Unspecified)
                             payment.FechaPago = DateTime.SpecifyKind(payment.FechaPago.Value, DateTimeKind.Utc);

                        _context.Abonos.Add(payment);
                        totalPagado += pay.Monto;
                    }
                }
                
                // Optional: Recalculate SaldoPendiente if not manually provided or to ensure integrity
                // sales.SaldoPendiente = (model.TotalVenta ?? 0) - totalPagado; 
                // However, historical data might have discrepancies, so we might respect the input.

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetSale), new { id = sale.Id }, sale);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating sale");
                return StatusCode(500, new { message = $"Error al crear la venta: {ex.Message} {ex.InnerException?.Message}" });
            }
        }

        // GET: api/sales/patient/{patientId}
        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<IEnumerable<Sale>>> GetSalesByPatient(Guid patientId)
        {
            var sales = await _context.Ventas
                .Where(v => v.Detalles.Any(d => d.PacienteId == patientId) || v.Consulta.PacienteId == patientId)
                // Note: Linking by Detail's patient or Consultation's patient covers both cases (direct sale or consultation sale)
                // However, standard capture links via Consultation. Let's start simpler:
                // Actually, Sale doesn't have PacienteId column directly, it links via Consultation OR via SaleDetail items.
                // Best logic: Where associated Consultation has patientId OR any Detail has patientId.
                // Wait, Sale model has ConsultationId. Consultation has PacienteId.
                // SaleDetail also has PacienteId.
                // Let's allow fetching by either.
                .Include(s => s.Detalles)
                .Include(s => s.Abonos)
                .Include(s => s.Consulta)
                .ThenInclude(c => c.Paciente)
                .Where(s => s.Consulta.PacienteId == patientId || s.Detalles.Any(d => d.PacienteId == patientId))
                .OrderByDescending(s => s.Fecha)
                .ToListAsync();

            return Ok(sales);
        }

        // GET: api/sales/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Sale>> GetSale(Guid id)
        {
            var sale = await _context.Ventas
                .Include(v => v.Detalles)
                .Include(v => v.Abonos)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (sale == null) return NotFound();

            return Ok(sale);
        }
    }
}
