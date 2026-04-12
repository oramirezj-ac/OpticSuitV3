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

        private async Task<string?> ResolveUniqueFolioAsync(string? baseFolio)
        {
            if (string.IsNullOrEmpty(baseFolio)) return null;

            // Busca el folio base o cualquier versión con sufijo -D
            var existingFolios = await _context.Ventas
                .Where(v => v.FolioFisico == baseFolio || v.FolioFisico.StartsWith(baseFolio + "-D"))
                .Select(v => v.FolioFisico)
                .ToListAsync();

            if (!existingFolios.Contains(baseFolio))
            {
                return baseFolio;
            }

            // Si ya existe el base, buscar el número más alto de sufijo -D
            int maxSuffix = 0;
            foreach (var f in existingFolios)
            {
                if (f.Contains("-D"))
                {
                    var parts = f.Split("-D");
                    if (parts.Length > 1 && int.TryParse(parts[parts.Length - 1], out int currentSuffix))
                    {
                        if (currentSuffix > maxSuffix) maxSuffix = currentSuffix;
                    }
                }
            }

            return $"{baseFolio}-D{maxSuffix + 1}";
        }

        public async Task<Sale> CreateSaleAsync(CreateSaleDto model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Resolve Unique Folio (Internal suffixing for duplicates)
                var uniqueFolio = await ResolveUniqueFolioAsync(model.FolioFisico);

                // 2. Create Head Sale
                var sale = new Sale
                {
                    FolioFisico = uniqueFolio,
                    Fecha = model.Fecha.HasValue 
                        ? (model.Fecha.Value.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(model.Fecha.Value, DateTimeKind.Utc) : model.Fecha.Value.ToUniversalTime())
                        : DateTime.UtcNow,
                    ConsultaId = model.ConsultaId,
                    TotalVenta = model.TotalVenta,
                    SaldoPendiente = model.SaldoPendiente,
                    ObservacionesGenerales = model.ObservacionesGenerales,
                    UsuarioId = !string.IsNullOrEmpty(model.UsuarioId) ? model.UsuarioId : null,
                    Estado = SaleConstants.StatusActive
                };

                _context.Ventas.Add(sale);
                await _context.SaveChangesAsync();

                // 3. Create Details
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

                // 4. Create Initial Payments (Abonos)
                if (model.AbonosIniciales != null)
                {
                    foreach (var pay in model.AbonosIniciales)
                    {
                        var payment = new Payment
                        {
                            VentaId = sale.Id,
                            Monto = pay.Monto,
                            MetodoPago = pay.MetodoPago,
                            FechaPago = pay.FechaPago.HasValue 
                                ? (pay.FechaPago.Value.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(pay.FechaPago.Value, DateTimeKind.Utc) : pay.FechaPago.Value.ToUniversalTime())
                                : DateTime.UtcNow,
                            UsuarioId = !string.IsNullOrEmpty(pay.UsuarioId) ? pay.UsuarioId : (!string.IsNullOrEmpty(model.UsuarioId) ? model.UsuarioId : null)
                        };

                        _context.Abonos.Add(payment);
                    }
                }

                // 5. Create Commissions with Split Logic
                if (model.VendedoresIds != null && model.VendedoresIds.Any() && model.MontoComisionTotal > 0)
                {
                    int count = model.VendedoresIds.Count;
                    decimal montoPorVendedor = model.MontoComisionTotal.Value / count;

                    foreach (var vendedorId in model.VendedoresIds)
                    {
                        var commission = new SalesCommission
                        {
                            VentaId = sale.Id,
                            UsuarioId = vendedorId,
                            MontoComision = montoPorVendedor,
                            PuntosVenta = 0, // Opcional según lógica futura
                            FechaRegistro = DateTime.UtcNow
                        };
                        _context.ComisionesVentas.Add(commission);
                    }
                }
                else if (model.Comisiones != null && model.Comisiones.Any())
                {
                    // Backward compatibility / Explicit commissions
                    foreach (var com in model.Comisiones)
                    {
                        var commission = new SalesCommission
                        {
                            VentaId = sale.Id,
                            UsuarioId = com.UsuarioId,
                            MontoComision = com.MontoComision,
                            PuntosVenta = com.PuntosVenta,
                            FechaRegistro = DateTime.UtcNow
                        };
                        _context.ComisionesVentas.Add(commission);
                    }
                }

                // 6. Update parent items modification dates
                if (sale.ConsultaId.HasValue)
                {
                    var consultaRef = await _context.Consultas.FindAsync(sale.ConsultaId.Value);
                    if (consultaRef != null) 
                    {
                        consultaRef.FechaActualizacion = DateTime.UtcNow;
                        var pacienteRef = await _context.Pacientes.FindAsync(consultaRef.PacienteId);
                        if (pacienteRef != null) {
                            pacienteRef.FechaActualizacion = DateTime.UtcNow;
                        }
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

        public async Task<bool> DeleteSaleAsync(Guid id)
        {
            var sale = await _context.Ventas.FindAsync(id);
            if (sale == null) return false;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var payments = await _context.Abonos.Where(a => a.VentaId == id).ToListAsync();
                _context.Abonos.RemoveRange(payments);

                var details = await _context.DetalleVentas.Where(d => d.VentaId == id).ToListAsync();
                _context.DetalleVentas.RemoveRange(details);

                var commissions = await _context.ComisionesVentas.Where(c => c.VentaId == id).ToListAsync();
                _context.ComisionesVentas.RemoveRange(commissions);

                _context.Ventas.Remove(sale);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error cascading delete for sale {Id}", id);
                throw;
            }
        }

        public async Task<IEnumerable<Sale>> GetRecentSalesAsync(int count = 20)
        {
            return await _context.Ventas
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .OrderByDescending(v => v.Fecha)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Sale>> SearchSalesByFolioAsync(string folio)
        {
            if (string.IsNullOrEmpty(folio)) return new List<Sale>();

            // Regla: mostrar todas las notas que coincidan (duplicados incluidos)
            return await _context.Ventas
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .Where(v => v.FolioFisico == folio || v.FolioFisico.StartsWith(folio + "-D"))
                .OrderByDescending(v => v.Fecha)
                .ToListAsync();
        }

        // --- ABONOS / PAGOS ---

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
                FechaPago = model.FechaPago.HasValue 
                    ? (model.FechaPago.Value.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(model.FechaPago.Value, DateTimeKind.Utc) : model.FechaPago.Value.ToUniversalTime())
                    : DateTime.UtcNow,
                MetodoPago = model.MetodoPago,
                UsuarioId = model.UsuarioId
            };

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
