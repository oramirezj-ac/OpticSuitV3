using System;
using System.Collections.Generic;

namespace OpticBackend.Dtos.Sales
{
    public class CreateSaleDto
    {
        public string? FolioFisico { get; set; }
        public DateTime? Fecha { get; set; }
        public Guid? ConsultaId { get; set; } // Opcional, pero recomendado
        public decimal? TotalVenta { get; set; }
        public decimal? SaldoPendiente { get; set; } // Puede calcularse, pero permitir captura manual histórica
        public string? ObservacionesGenerales { get; set; }
        public string? UsuarioId { get; set; }

        public List<CreateSaleDetailDto> Detalles { get; set; } = new List<CreateSaleDetailDto>();
        public List<CreatePaymentDto> AbonosIniciales { get; set; } = new List<CreatePaymentDto>(); // Para registrar el pago/anticipo inicial
        // public List<CreateCommissionDto>? Comisiones { get; set; } 
    }

    public class CreateSaleDetailDto
    {
        public Guid? PacienteId { get; set; }
        public Guid? GraduacionId { get; set; } // La graduacion especifica que se usó
        public decimal? DpOd { get; set; }
        public decimal? DpOi { get; set; }
        public decimal? AlturaOblea { get; set; }
        public string? DescripcionManual { get; set; }
        public decimal? PrecioAplicado { get; set; }
        public Guid? CatalogoId { get; set; }
    }

    public class CreatePaymentDto
    {
        public decimal Monto { get; set; }
        public DateTime? FechaPago { get; set; }
        public string? MetodoPago { get; set; }
        public string? UsuarioId { get; set; }
    }
}
