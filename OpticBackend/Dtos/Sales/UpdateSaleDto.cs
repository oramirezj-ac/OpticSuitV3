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

        [System.Text.Json.Serialization.JsonPropertyName("montoComisionTotal")]
        public decimal? MontoComisionTotal { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("vendedoresIds")]
        public System.Collections.Generic.List<string>? VendedoresIds { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("graduacionId")]
        public Guid? GraduacionId { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("updateGraduacion")]
        public bool UpdateGraduacion { get; set; }
    }
}
