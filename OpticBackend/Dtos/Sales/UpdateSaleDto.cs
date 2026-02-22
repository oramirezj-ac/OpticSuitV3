using System;

namespace OpticBackend.Dtos.Sales
{
    public class UpdateSaleDto
    {
        public string? FolioFisico { get; set; }
        public decimal? TotalVenta { get; set; }
        public decimal? SaldoPendiente { get; set; }
        public string? ObservacionesGenerales { get; set; }
    }
}
