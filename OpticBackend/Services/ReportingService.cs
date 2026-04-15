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
    }
}
