using Microsoft.EntityFrameworkCore;
using OpticBackend.Constants;
using OpticBackend.Data;
using OpticBackend.Dtos.Sales;
using OpticBackend.Models;
using OpticBackend.Services.Interfaces;

namespace OpticBackend.Services.Sales
{
    public class SalesCommandService : ISalesCommandService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SalesCommandService> _logger;

        public SalesCommandService(ApplicationDbContext context, ILogger<SalesCommandService> logger)
        {
            _context = context;
            _logger = logger;
        }

        private async Task<string?> ResolveUniqueFolioAsync(string? baseFolio)
        {
            if (string.IsNullOrEmpty(baseFolio)) return null;

            var existingFolios = await _context.Ventas
                .Where(v => v.FolioFisico == baseFolio || v.FolioFisico.StartsWith(baseFolio + "-D"))
                .Select(v => v.FolioFisico)
                .ToListAsync();

            if (!existingFolios.Contains(baseFolio))
            {
                return baseFolio;
            }

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
                var uniqueFolio = await ResolveUniqueFolioAsync(model.FolioFisico);

                var sale = new Sale
                {
                    FolioFisico = uniqueFolio,
                    Fecha = model.Fecha.HasValue 
                        ? (model.Fecha.Value.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(model.Fecha.Value, DateTimeKind.Utc) : model.Fecha.Value.ToUniversalTime())
                        : DateTime.UtcNow,
                    ConsultaId = model.ConsultaId,
                    PacienteId = model.PacienteId,
                    TotalVenta = model.TotalVenta,
                    SaldoPendiente = model.SaldoPendiente,
                    ObservacionesGenerales = model.ObservacionesGenerales,
                    UsuarioId = !string.IsNullOrEmpty(model.UsuarioId) ? model.UsuarioId : null,
                    Estado = SaleConstants.StatusActive
                };

                _context.Ventas.Add(sale);
                await _context.SaveChangesAsync();

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
                            PuntosVenta = 0,
                            FechaRegistro = DateTime.UtcNow
                        };
                        _context.ComisionesVentas.Add(commission);
                    }
                }
                else if (model.Comisiones != null && model.Comisiones.Any())
                {
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

                Guid? resolvedPacienteId = sale.PacienteId;

                if (sale.ConsultaId.HasValue)
                {
                    var consultaRef = await _context.Consultas.FindAsync(sale.ConsultaId.Value);
                    if (consultaRef != null) 
                    {
                        consultaRef.FechaActualizacion = DateTime.UtcNow;
                        resolvedPacienteId ??= consultaRef.PacienteId;
                    }
                }

                if (resolvedPacienteId.HasValue)
                {
                    var pacienteRef = await _context.Pacientes.FindAsync(resolvedPacienteId.Value);
                    if (pacienteRef != null)
                    {
                        pacienteRef.FechaActualizacion = DateTime.UtcNow;

                        if (sale.Fecha.HasValue && sale.Fecha.Value < pacienteRef.FechaRegistro)
                        {
                            _logger.LogInformation(
                                "📅 [SalesCommandService] Updating FechaRegistro for patient {Id}: {Old} → {New}",
                                pacienteRef.Id, pacienteRef.FechaRegistro, sale.Fecha.Value);
                            pacienteRef.FechaRegistro = sale.Fecha.Value;
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
                throw;
            }
        }

        public async Task<Sale?> UpdateSaleAsync(Guid id, UpdateSaleDto model)
        {
            var sale = await _context.Ventas
                .Include(v => v.Comisiones)
                .Include(v => v.Detalles)
                .FirstOrDefaultAsync(v => v.Id == id);
            
            if (sale == null) return null;

            if (model.FolioFisico != null) sale.FolioFisico = model.FolioFisico;

            if (model.UpdateGraduacion)
            {
                var mainDetail = sale.Detalles?.FirstOrDefault();
                if (mainDetail != null)
                {
                    mainDetail.GraduacionId = model.GraduacionId;
                }
                else
                {
                    _context.DetalleVentas.Add(new SaleDetail
                    {
                        VentaId = sale.Id,
                        GraduacionId = model.GraduacionId,
                        PacienteId = sale.PacienteId,
                        DescripcionManual = sale.ObservacionesGenerales ?? "Detalle auto-generado"
                    });
                }
            }
            if (model.Fecha != null) 
            {
                sale.Fecha = model.Fecha.Value.Kind == DateTimeKind.Unspecified 
                    ? DateTime.SpecifyKind(model.Fecha.Value, DateTimeKind.Utc) 
                    : model.Fecha.Value.ToUniversalTime();
            }
            if (model.TotalVenta != null) sale.TotalVenta = model.TotalVenta;
            if (model.SaldoPendiente != null) sale.SaldoPendiente = model.SaldoPendiente;
            if (model.ObservacionesGenerales != null) sale.ObservacionesGenerales = model.ObservacionesGenerales;

            if (model.VendedoresIds != null)
            {
                if (sale.Comisiones != null && sale.Comisiones.Any())
                {
                    _context.ComisionesVentas.RemoveRange(sale.Comisiones);
                }

                if (model.VendedoresIds.Any() && model.MontoComisionTotal.HasValue && model.MontoComisionTotal.Value > 0)
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
                            PuntosVenta = 0,
                            FechaRegistro = DateTime.UtcNow
                        };
                        _context.ComisionesVentas.Add(commission);
                    }
                }
            }

            _context.Entry(sale).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return await _context.Ventas
                .Include(v => v.Paciente)
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .Include(v => v.Detalles)
                .Include(v => v.Abonos)
                .Include(v => v.Comisiones)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<bool> DeleteSaleAsync(Guid id)
        {
            _logger.LogInformation("🗑️ [SalesCommandService] Iniciando proceso de eliminación para venta {Id}", id);
            
            var sale = await _context.Ventas
                .Include(v => v.Detalles)
                .Include(v => v.Abonos)
                .Include(v => v.Comisiones)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (sale == null) 
            {
                _logger.LogWarning("⚠️ [SalesCommandService] Intento de eliminar venta inexistente {Id}", id);
                return false;
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (sale.Abonos != null && sale.Abonos.Any())
                {
                    _context.Abonos.RemoveRange(sale.Abonos);
                }

                if (sale.Detalles != null && sale.Detalles.Any())
                {
                    _context.DetalleVentas.RemoveRange(sale.Detalles);
                }

                if (sale.Comisiones != null && sale.Comisiones.Any())
                {
                    _context.ComisionesVentas.RemoveRange(sale.Comisiones);
                }

                _context.Ventas.Remove(sale);
                await _context.SaveChangesAsync();
                
                await transaction.CommitAsync();
                _logger.LogInformation("✅ [SalesCommandService] Venta {Id} eliminada exitosamente", id);
                
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "❌ [SalesCommandService] Error al eliminar venta {Id}", id);
                throw;
            }
        }

        public async Task<Sale?> CreateCounterSaleAsync(string concept, decimal amount, DateTime date, string userId)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var lastVm = await _context.Ventas
                    .Where(v => v.FolioFisico != null && v.FolioFisico.StartsWith("VM-"))
                    .OrderByDescending(v => v.FolioFisico)
                    .Select(v => v.FolioFisico)
                    .FirstOrDefaultAsync();
                
                int nextId = 1;
                if (lastVm != null)
                {
                    if (int.TryParse(lastVm.Replace("VM-", ""), out int lastId)) nextId = lastId + 1;
                }
                string newFolio = $"VM-{nextId:D4}";

                var genPatient = await _context.Pacientes.FirstOrDefaultAsync(p => p.Nombre == "Público General" && p.ApellidoPaterno == "Mostrador");
                if (genPatient == null)
                {
                    genPatient = new Patient { Nombre = "Público General", ApellidoPaterno = "Mostrador", Telefono = "0000000000" };
                    _context.Pacientes.Add(genPatient);
                    await _context.SaveChangesAsync();
                }

                var sale = new Sale
                {
                    FolioFisico = newFolio,
                    Fecha = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                    PacienteId = genPatient.Id,
                    TotalVenta = amount,
                    SaldoPendiente = 0,
                    ObservacionesGenerales = concept,
                    UsuarioId = userId,
                    Estado = "Activa"
                };

                _context.Ventas.Add(sale);
                await _context.SaveChangesAsync();

                var payment = new Payment
                {
                    VentaId = sale.Id,
                    Monto = amount,
                    FechaPago = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                    MetodoPago = "Efectivo",
                    UsuarioId = userId
                };
                _context.Abonos.Add(payment);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return sale;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating counter sale");
                return null;
            }
        }

        public async Task<Sale?> RegisterCancelledFolioAsync(string folio, DateTime date, string userId)
        {
            var sale = new Sale
            {
                FolioFisico = folio,
                Fecha = DateTime.SpecifyKind(date, DateTimeKind.Utc),
                Estado = "Cancelada",
                ObservacionesGenerales = "Folio anulado manual",
                TotalVenta = 0,
                SaldoPendiente = 0,
                UsuarioId = userId
            };

            _context.Ventas.Add(sale);
            await _context.SaveChangesAsync();
            return sale;
        }
    }
}
