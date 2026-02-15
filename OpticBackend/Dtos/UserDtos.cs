namespace OpticBackend.Dtos
{
    /// <summary>
    /// DTO para respuesta de usuario
    /// </summary>
    public class UserDto
    {
        public required string Id { get; set; }
        public required string Email { get; set; }
        public required string NombreCompleto { get; set; }
        public required string NombreEsquema { get; set; }
        public required string Rol { get; set; }
        public required bool EstaActivo { get; set; }
    }

    /// <summary>
    /// DTO para creación de usuario
    /// </summary>
    public class CreateUserDto
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
        public required string NombreCompleto { get; set; }
        public string? NombreEsquema { get; set; }
        public required string Rol { get; set; }
    }

    /// <summary>
    /// DTO para actualización de usuario
    /// </summary>
    public class UpdateUserDto
    {
        public required string Email { get; set; }
        public required string NombreCompleto { get; set; }
        public required bool EstaActivo { get; set; }
        public string? Rol { get; set; }
        public string? NombreEsquema { get; set; }
    }
}
