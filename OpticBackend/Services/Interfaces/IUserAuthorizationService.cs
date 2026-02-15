namespace OpticBackend.Services.Interfaces
{
    /// <summary>
    /// Servicio para validación de permisos y reglas de autorización de usuarios
    /// </summary>
    public interface IUserAuthorizationService
    {
        /// <summary>
        /// Verifica si el usuario actual puede gestionar usuarios
        /// </summary>
        /// <param name="userId">ID del usuario actual</param>
        /// <returns>Tupla con (CanManage, IsRoot, IsAdmin, UserSchema)</returns>
        Task<(bool CanManage, bool IsRoot, bool IsAdmin, string Schema)> GetUserPermissionsAsync(string userId);

        /// <summary>
        /// Determina el esquema objetivo para un nuevo usuario basado en permisos
        /// </summary>
        /// <param name="isRoot">¿El creador es Root?</param>
        /// <param name="requestedSchema">Esquema solicitado (puede ser null)</param>
        /// <param name="creatorSchema">Esquema del creador</param>
        /// <returns>Esquema que se debe asignar al nuevo usuario</returns>
        string DetermineTargetSchema(bool isRoot, string? requestedSchema, string creatorSchema);

        /// <summary>
        /// Valida si el usuario actual puede modificar al usuario objetivo
        /// </summary>
        /// <param name="currentUserId">ID del usuario actual</param>
        /// <param name="targetUserId">ID del usuario a modificar</param>
        /// <returns>True si puede modificar, False si no</returns>
        Task<bool> CanModifyUserAsync(string currentUserId, string targetUserId);
    }
}
