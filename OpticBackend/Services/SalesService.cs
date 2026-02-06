using Microsoft.EntityFrameworkCore;
using OpticBackend.Constants;
using OpticBackend.Data;
using OpticBackend.Dtos.Sales;
using OpticBackend.Models;
using OpticBackend.Services.Interfaces;

namespace OpticBackend.Services
{
    public class SalesService : ISalesService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SalesService> _logger;

        public SalesService(ApplicationDbContext context, ILogger<SalesService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Sale> CreateSaleAsync(CreateSaleDto model)
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
                    SaldoPendiente = model.SaldoPendiente,
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
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return sale;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating sale in service");
                throw; // Re-throw to be handled by controller
            }
        }

        public async Task<Sale?> GetSaleByIdAsync(Guid id)
        {
            return await _context.Ventas
                .Include(v => v.Detalles)
                .Include(v => v.Abonos)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<IEnumerable<Sale>> GetSalesByPatientAsync(Guid patientId)
        {
            return await _context.Ventas
                .Include(s => s.Detalles)
                .Include(s => s.Abonos)
                .Include(s => s.Consulta)
                .ThenInclude(c => c.Paciente)
                .Where(s => s.Consulta.PacienteId == patientId || s.Detalles.Any(d => d.PacienteId == patientId))
                .OrderByDescending(s => s.Fecha)
                .ToListAsync();
        }
    }
}
