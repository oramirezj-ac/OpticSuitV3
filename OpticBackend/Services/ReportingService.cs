using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Dtos.Reporting;
using OpticBackend.Services.Interfaces;
using System.Globalization;

namespace OpticBackend.Services
{
    public class ReportingService : IReportingService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ReportingService> _logger;

        public ReportingService(ApplicationDbContext context, ILogger<ReportingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<AdminSummaryDto> GetAdminSummaryAsync()
        {
            // 1. Get all payments (Abonos) including sale info
            var allPayments = await _context.Abonos
                .Include(a => a.Venta)
                .ToListAsync();

            var totalGlobal = allPayments.Sum(a => a.Monto);

            // 2. Segment by Lentes vs Medical (MED-)
            var lentesPayments = allPayments.Where(a => a.Venta != null && !(a.Venta.FolioFisico?.StartsWith("MED-") ?? false)).ToList();
            var medicoPayments = allPayments.Where(a => a.Venta != null && (a.Venta.FolioFisico?.StartsWith("MED-") ?? false)).ToList();

            return new AdminSummaryDto
            {
                TotalGlobal = totalGlobal,
                VentasLentes = GroupPaymentsByYear(lentesPayments),
                VentasMedicas = GroupPaymentsByYear(medicoPayments)
            };
        }

        public async Task<SellerSummaryDto> GetSellerSummaryAsync(string userId)
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var startOfMonth = new DateTime(now.Year, now.Month, 1);
            var startOfYear = new DateTime(now.Year, 1, 1);

            // Today's sales (Abonos made today by this user)
            var abonosHoy = await _context.Abonos
                .Where(a => a.UsuarioId == userId && a.FechaPago >= today)
                .SumAsync(a => a.Monto);

            // Today's consultations (Consultations made today by this user)
            var consultationsHoy = await _context.Consultas
                .CountAsync(c => c.UsuarioId == userId && c.Fecha >= today);

            // Monthly commissions
            var commissionsMes = await _context.ComisionesVentas
                .Where(c => c.UsuarioId == userId && c.FechaRegistro >= startOfMonth)
                .SumAsync(c => c.MontoComision);

            // Branded armazones (Sales with commissions for this user in the current year)
            // Lógica: Conteo de ventas únicas que generaron comisión para este usuario en este año
            var armazonesAnio = await _context.ComisionesVentas
                .Where(c => c.UsuarioId == userId && c.FechaRegistro >= startOfYear)
                .Select(c => c.VentaId)
                .Distinct()
                .CountAsync();

            return new SellerSummaryDto
            {
                VentasHoy = abonosHoy,
                ConteoConsultasHoy = consultationsHoy,
                ArmazonesMarcaAnio = armazonesAnio,
                ComisionesMesActual = commissionsMes
            };
        }

        private List<YearSummaryDto> GroupPaymentsByYear(List<Models.Payment> payments)
        {
            if (payments == null || !payments.Any()) return new List<YearSummaryDto>();

            return payments
                .GroupBy(p => p.FechaPago?.Year ?? 0)
                .Where(g => g.Key > 0)
                .OrderByDescending(g => g.Key)
                .Select(yearGroup => new YearSummaryDto
                {
                    Anio = yearGroup.Key,
                    TotalAnual = yearGroup.Sum(p => p.Monto),
                    Meses = yearGroup
                        .GroupBy(p => p.FechaPago?.Month ?? 0)
                        .Where(mg => mg.Key > 0)
                        .OrderBy(mg => mg.Key)
                        .Select(monthGroup => new MonthSummaryDto
                        {
                            Mes = monthGroup.Key,
                            NombreMes = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(monthGroup.Key),
                            TotalMensual = monthGroup.Sum(p => p.Monto)
                        }).ToList()
                }).ToList();
        }

        public async Task<List<TenantSummaryDto>> GetRootCrossTenantSummaryAsync()
        {
            var results = new List<TenantSummaryDto>();
            var connection = _context.Database.GetDbConnection();

            // Track if WE opened the connection (vs EF already having it open)
            var weOpenedConnection = false;

            try
            {
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    await connection.OpenAsync();
                    weOpenedConnection = true;
                }

                // 1. Get all tenant schemas
                var schemas = new List<string>();
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = "SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema' AND nspname <> 'public'";
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        schemas.Add(reader.GetString(0));
                    }
                }

                // 2. For each schema, query its data using schema-qualified table names
                foreach (var schema in schemas)
                {
                    var tenant = new TenantSummaryDto { Schema = schema, NombreOptica = schema.ToUpper() };

                    try
                    {
                        // Check if abonos table exists in this schema
                        bool hasAbonos = false;
                        using (var cmd = connection.CreateCommand())
                        {
                            cmd.CommandText = $"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = '{schema}' AND table_name = 'abonos')";
                            hasAbonos = (bool)(await cmd.ExecuteScalarAsync() ?? false);
                        }

                        if (!hasAbonos)
                        {
                            results.Add(tenant);
                            continue;
                        }

                        // Get óptica name from configuracion_sistema
                        using (var cmd = connection.CreateCommand())
                        {
                            cmd.CommandText = $"SELECT nombre_optica FROM {schema}.configuracion_sistema LIMIT 1";
                            var name = await cmd.ExecuteScalarAsync();
                            if (name != null && name != DBNull.Value)
                                tenant.NombreOptica = name.ToString()!;
                        }

                        // Get all payments with sale folio info for Lentes/Médico split
                        var paymentRows = new List<(decimal monto, DateTime? fecha, string? folio)>();
                        using (var cmd = connection.CreateCommand())
                        {
                            cmd.CommandText = $@"
                                SELECT a.monto, a.fecha_pago, v.folio_fisico 
                                FROM {schema}.abonos a 
                                LEFT JOIN {schema}.ventas v ON a.venta_id = v.id
                                WHERE a.fecha_pago IS NOT NULL";
                            using var reader = await cmd.ExecuteReaderAsync();
                            while (await reader.ReadAsync())
                            {
                                var monto = reader.GetDecimal(0);
                                var fecha = reader.IsDBNull(1) ? (DateTime?)null : reader.GetDateTime(1);
                                var folio = reader.IsDBNull(2) ? null : reader.GetString(2);
                                paymentRows.Add((monto, fecha, folio));
                            }
                        }

                        tenant.TotalGlobal = paymentRows.Sum(p => p.monto);

                        // Split into Lentes vs Médico
                        var lentesRows = paymentRows.Where(p => !(p.folio?.StartsWith("MED-") ?? false)).ToList();
                        var medicoRows = paymentRows.Where(p => p.folio?.StartsWith("MED-") ?? false).ToList();

                        tenant.VentasLentes = GroupRawPaymentsByYear(lentesRows);
                        tenant.VentasMedicas = GroupRawPaymentsByYear(medicoRows);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error querying schema {Schema}, skipping", schema);
                    }

                    results.Add(tenant);
                }
            }
            finally
            {
                // Only close if WE opened it, otherwise EF manages it
                if (weOpenedConnection)
                {
                    await connection.CloseAsync();
                }
            }

            return results.OrderByDescending(t => t.TotalGlobal).ToList();
        }

        private List<YearSummaryDto> GroupRawPaymentsByYear(List<(decimal monto, DateTime? fecha, string? folio)> payments)
        {
            if (!payments.Any()) return new List<YearSummaryDto>();

            return payments
                .Where(p => p.fecha.HasValue)
                .GroupBy(p => p.fecha!.Value.Year)
                .OrderByDescending(g => g.Key)
                .Select(yearGroup => new YearSummaryDto
                {
                    Anio = yearGroup.Key,
                    TotalAnual = yearGroup.Sum(p => p.monto),
                    Meses = yearGroup
                        .GroupBy(p => p.fecha!.Value.Month)
                        .OrderBy(mg => mg.Key)
                        .Select(monthGroup => new MonthSummaryDto
                        {
                            Mes = monthGroup.Key,
                            NombreMes = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(monthGroup.Key),
                            TotalMensual = monthGroup.Sum(p => p.monto)
                        }).ToList()
                }).ToList();
        }
    }
}
