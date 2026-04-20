using System;

namespace OpticBackend.Dtos.Sales
{
    public class CreateCounterSaleDto
    {
        public string Concept { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string? UserId { get; set; }
    }

    public class RegisterCancelledFolioDto
    {
        public string Folio { get; set; } = string.Empty;
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public string? UserId { get; set; }
    }
}
