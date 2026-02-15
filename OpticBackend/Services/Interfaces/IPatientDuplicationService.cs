namespace OpticBackend.Services.Interfaces
{
    /// <summary>
    /// Servicio para detectar duplicados de pacientes
    /// </summary>
    public interface IPatientDuplicationService
    {
        /// <summary>
        /// Busca pacientes duplicados basándose en nombre, apellidos y/o teléfono
        /// </summary>
        /// <param name="nombre">Nombre del paciente</param>
        /// <param name="apellidoPaterno">Apellido paterno</param>
        /// <param name="apellidoMaterno">Apellido materno (opcional)</param>
        /// <param name="telefono">Teléfono (opcional)</param>
        /// <param name="excludeId">ID a excluir de la búsqueda (para ediciones)</param>
        /// <returns>Lista de pacientes que podrían ser duplicados</returns>
        Task<List<Models.Patient>> FindDuplicatesAsync(
            string nombre,
            string? apellidoPaterno,
            string? apellidoMaterno,
            string? telefono,
            Guid? excludeId = null
        );
    }
}
