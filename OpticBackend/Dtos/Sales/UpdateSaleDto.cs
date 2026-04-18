using System;

namespace OpticBackend.Dtos.Sales
{
    public class UpdateSaleDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("folioFisico")]
        public string? FolioFisico { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("fecha")]
        public DateTime? Fecha { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("totalVenta")]
        public decimal? TotalVenta { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("saldoPendiente")]
        public decimal? SaldoPendiente { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("observacionesGenerales")]
        public string? ObservacionesGenerales { get; set; }
    }
}
