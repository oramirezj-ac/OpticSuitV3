using System;
using System.Collections.Generic;

namespace OpticBackend.Dtos.Consultations
{
    public class CreateGraduationDto
    {
        public string? TipoGraduacion { get; set; } // 'Final', 'AutoRef', etc.
        public decimal? OdEsfera { get; set; }
        public decimal? OdCilindro { get; set; }
        public int? OdEje { get; set; }
        public decimal? OdAdicion { get; set; }
        public decimal? OiEsfera { get; set; }
        public decimal? OiCilindro { get; set; }
        public int? OiEje { get; set; }
        public decimal? OiAdicion { get; set; }
        public Dictionary<string, object>? DetallesMontaje { get; set; }
    }
}
