using System.ComponentModel.DataAnnotations;

namespace OpticBackend.Dtos
{
    public class PatientDto
    {
        public Guid Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? ApellidoPaterno { get; set; }
        public string? ApellidoMaterno { get; set; }
        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Direccion { get; set; }
        public int? Edad { get; set; } // Computed from DOB or stored
        public string? Ocupacion { get; set; }
        public string? Notas { get; set; }
        public DateTime FechaRegistro { get; set; }
        public bool EstaActivo { get; set; }
    }

    public class CreatePatientDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio")]
        public string Nombre { get; set; } = string.Empty;

        public string? ApellidoPaterno { get; set; }

        public string? ApellidoMaterno { get; set; }

        public DateOnly? FechaNacimiento { get; set; }

        public string? Telefono { get; set; }
        public string? Email { get; set; }
        public string? Direccion { get; set; }
        public string? Ocupacion { get; set; }
        public string? Notas { get; set; }
        public DateTime? FechaRegistro { get; set; } // Allow manual override
    }

    public class UpdatePatientDto : CreatePatientDto
    {
        public bool EstaActivo { get; set; } = true;
    }
}
