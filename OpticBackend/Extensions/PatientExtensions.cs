using OpticBackend.Models;
using OpticBackend.Dtos;

namespace OpticBackend.Extensions
{
    /// <summary>
    /// Extension methods para la entidad Patient
    /// </summary>
    public static class PatientExtensions
    {
        /// <summary>
        /// Calcula la edad a partir de la fecha de nacimiento
        /// </summary>
        /// <param name="dob">Fecha de nacimiento</param>
        /// <returns>Edad en años o null si no hay fecha</returns>
        public static int? CalculateAge(this DateOnly? dob)
        {
            if (!dob.HasValue) return null;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var age = today.Year - dob.Value.Year;
            
            // Ajustar si aún no ha cumplido años este año
            if (dob.Value > today.AddYears(-age))
            {
                age--;
            }

            return age;
        }

        /// <summary>
        /// Convierte una entidad Patient a PatientDto
        /// </summary>
        /// <param name="patient">Entidad Patient</param>
        /// <returns>PatientDto con todos los campos mapeados</returns>
        public static PatientDto ToDto(this Patient patient)
        {
            return new PatientDto
            {
                Id = patient.Id,
                Nombre = patient.Nombre,
                ApellidoPaterno = patient.ApellidoPaterno,
                ApellidoMaterno = patient.ApellidoMaterno,
                Telefono = patient.Telefono,
                Email = patient.Email,
                Direccion = patient.Direccion,
                FechaNacimiento = patient.FechaNacimiento,
                Edad = patient.FechaNacimiento.CalculateAge(),
                Ocupacion = patient.Ocupacion,
                Notas = patient.Notas,
                FechaRegistro = patient.FechaRegistro,
                EstaActivo = patient.EstaActivo
            };
        }
    }
}
