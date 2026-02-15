using Microsoft.AspNetCore.Identity;
using OpticBackend.Models;
using OpticBackend.Services.Interfaces;

namespace OpticBackend.Services
{
    /// <summary>
    /// Servicio que encapsula la lógica de autorización para usuarios
    /// </summary>
    public class UserAuthorizationService : IUserAuthorizationService
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UserAuthorizationService(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<(bool CanManage, bool IsRoot, bool IsAdmin, string Schema)> GetUserPermissionsAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return (false, false, false, string.Empty);
            }

            var roles = await _userManager.GetRolesAsync(user);
            bool isRoot = roles.Contains("Root");
            bool isAdmin = roles.Contains("Admin");
            bool canManage = isRoot || isAdmin;

            return (canManage, isRoot, isAdmin, user.NombreEsquema ?? string.Empty);
        }

        public string DetermineTargetSchema(bool isRoot, string? requestedSchema, string creatorSchema)
        {
            // Root puede asignar cualquier schema solicitado
            if (isRoot)
            {
                return requestedSchema ?? "public";
            }

            // Admin solo puede crear usuarios en su propio schema
            return creatorSchema;
        }

        public async Task<bool> CanModifyUserAsync(string currentUserId, string targetUserId)
        {
            var currentUser = await _userManager.FindByIdAsync(currentUserId);
            var targetUser = await _userManager.FindByIdAsync(targetUserId);

            if (currentUser == null || targetUser == null)
            {
                return false;
            }

            var currentRoles = await _userManager.GetRolesAsync(currentUser);
            var targetRoles = await _userManager.GetRolesAsync(targetUser);

            bool isRoot = currentRoles.Contains("Root");
            bool isAdmin = currentRoles.Contains("Admin");

            // Root puede modificar a cualquiera
            if (isRoot) return true;

            // Admin solo puede modificar usuarios en su mismo esquema
            if (isAdmin)
            {
                // No puede modificar a otro Root
                if (targetRoles.Contains("Root")) return false;

                // Debe ser del mismo esquema
                return currentUser.NombreEsquema == targetUser.NombreEsquema;
            }

            // Otros roles no pueden modificar usuarios
            return false;
        }
    }
}
