using System.Collections.Generic;

namespace OpticBackend.Dtos.Reporting
{
    public class AdminSummaryDto
    {
        public decimal TotalGlobal { get; set; }
        public List<YearSummaryDto> VentasLentes { get; set; } = new();
        public List<YearSummaryDto> VentasMedicas { get; set; } = new();
    }

    public class YearSummaryDto
    {
        public int Anio { get; set; }
        public decimal TotalAnual { get; set; }
        public List<MonthSummaryDto> Meses { get; set; } = new();
    }

    public class MonthSummaryDto
    {
        public int Mes { get; set; }
        public string NombreMes { get; set; } = string.Empty;
        public decimal TotalMensual { get; set; }
    }

    public class SellerSummaryDto
    {
        public decimal VentasHoy { get; set; }
        public int ConteoConsultasHoy { get; set; }
        public int ArmazonesMarcaAnio { get; set; }
        public decimal ComisionesMesActual { get; set; }
    }

    public class TenantSummaryDto
    {
        public string Schema { get; set; } = string.Empty;
        public string NombreOptica { get; set; } = string.Empty;
        public decimal TotalGlobal { get; set; }
        public List<YearSummaryDto> VentasLentes { get; set; } = new();
        public List<YearSummaryDto> VentasMedicas { get; set; } = new();
    }
}
