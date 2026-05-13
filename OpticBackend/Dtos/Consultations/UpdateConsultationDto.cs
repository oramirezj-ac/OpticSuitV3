using System;
using System.Collections.Generic;

namespace OpticBackend.Dtos.Consultations
{
    public class UpdateConsultationDto
    {
        public string? MotivoConsulta { get; set; }
        public string? TipoConsulta { get; set; }
        public string? Observaciones { get; set; }
        public decimal? CostoServicio { get; set; }
        public string? EstadoFinanciero { get; set; }
        public DateTime? Fecha { get; set; }
        public Dictionary<string, object>? DetallesClinicos { get; set; }
    }
}
