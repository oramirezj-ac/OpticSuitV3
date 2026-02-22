using System;

namespace OpticBackend.Dtos.Sales
{
    public class UpdatePaymentDto
    {
        public decimal? Monto { get; set; }
        public DateTime? FechaPago { get; set; }
        public string? MetodoPago { get; set; }
    }
}
