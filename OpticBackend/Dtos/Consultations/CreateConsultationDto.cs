using System;
using System.Collections.Generic;

namespace OpticBackend.Dtos.Consultations
{
    public class CreateConsultationDto
    {
        public Guid PacienteId { get; set; }
        public DateTime? Fecha { get; set; }
        public string? MotivoConsulta { get; set; }
        public string? Observaciones { get; set; }
        public decimal? CostoServicio { get; set; }
        public string? EstadoFinanciero { get; set; }
        public Dictionary<string, object>? DetallesClinicos { get; set; }
        public string? UsuarioId { get; set; }
        public List<CreateGraduationDto>? Graduaciones { get; set; }
    }
}
