namespace OpticBackend.Services
{
    public class TenantService
    {
        // Aquí guardaremos el nombre del esquema (ej: "optica_galileo")
        public string? TenantId { get; set; } = "public"; // Por defecto "public"
    }
}