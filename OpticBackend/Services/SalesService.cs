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

                // 4. Update parent items modification dates so they appear in Recent views
                var consultaRef = await _context.Consultas.FindAsync(sale.ConsultaId);
                if (consultaRef != null) 
                {
                    consultaRef.FechaActualizacion = DateTime.UtcNow;
                    var pacienteRef = await _context.Pacientes.FindAsync(consultaRef.PacienteId);
                    if (pacienteRef != null) {
                        pacienteRef.FechaActualizacion = DateTime.UtcNow;
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

        public async Task<Sale?> UpdateSaleAsync(Guid id, UpdateSaleDto model)
        {
            var sale = await _context.Ventas.FindAsync(id);
            if (sale == null) return null;

            if (model.FolioFisico != null) sale.FolioFisico = model.FolioFisico;
            if (model.TotalVenta.HasValue) sale.TotalVenta = model.TotalVenta.Value;
            if (model.SaldoPendiente.HasValue) sale.SaldoPendiente = model.SaldoPendiente.Value;
            if (model.ObservacionesGenerales != null) sale.ObservacionesGenerales = model.ObservacionesGenerales;

            await _context.SaveChangesAsync();

            return await GetSaleByIdAsync(id);
        }

        // --- MANEJO DE ABONOS ---

        private async Task RecalculateSaleBalanceAsync(Guid saleId)
        {
            var sale = await _context.Ventas
                .Include(s => s.Abonos)
                .FirstOrDefaultAsync(s => s.Id == saleId);

            if (sale != null && sale.TotalVenta.HasValue)
            {
                decimal totalPagado = sale.Abonos?.Sum(a => a.Monto) ?? 0;
                sale.SaldoPendiente = sale.TotalVenta.Value - totalPagado;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Sale?> AddPaymentAsync(Guid saleId, CreatePaymentDto model)
        {
            var sale = await _context.Ventas.FindAsync(saleId);
            if (sale == null) return null;

            var payment = new Payment
            {
                VentaId = saleId,
                Monto = model.Monto,
                FechaPago = model.FechaPago ?? DateTime.UtcNow,
                MetodoPago = model.MetodoPago,
                UsuarioId = model.UsuarioId
            };

            if (payment.FechaPago.Value.Kind == DateTimeKind.Unspecified)
                payment.FechaPago = DateTime.SpecifyKind(payment.FechaPago.Value, DateTimeKind.Utc);

            _context.Abonos.Add(payment);
            await _context.SaveChangesAsync();

            await RecalculateSaleBalanceAsync(saleId);
            
            return await GetSaleByIdAsync(saleId);
        }

        public async Task<Sale?> UpdatePaymentAsync(Guid saleId, Guid paymentId, UpdatePaymentDto model)
        {
            var payment = await _context.Abonos.FirstOrDefaultAsync(p => p.Id == paymentId && p.VentaId == saleId);
            if (payment == null) return null;

            if (model.Monto.HasValue) payment.Monto = model.Monto.Value;
            if (model.FechaPago.HasValue) 
            {
                payment.FechaPago = model.FechaPago.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(model.FechaPago.Value, DateTimeKind.Utc) 
                    : model.FechaPago.Value;
            }
            if (model.MetodoPago != null) payment.MetodoPago = model.MetodoPago;

            await _context.SaveChangesAsync();

            await RecalculateSaleBalanceAsync(saleId);

            return await GetSaleByIdAsync(saleId);
        }

        public async Task<Sale?> DeletePaymentAsync(Guid saleId, Guid paymentId)
        {
            var payment = await _context.Abonos.FirstOrDefaultAsync(p => p.Id == paymentId && p.VentaId == saleId);
            if (payment == null) return null;

            _context.Abonos.Remove(payment);
            await _context.SaveChangesAsync();

            await RecalculateSaleBalanceAsync(saleId);

            return await GetSaleByIdAsync(saleId);
        }
    }
}
