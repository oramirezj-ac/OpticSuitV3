using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OpticBackend.Models;
using OpticBackend.Dtos;
using OpticBackend.Services.Interfaces;
using System.Security.Claims;

namespace OpticBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // 🔒 Todos los endpoints requieren autenticación
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<UsersController> _logger;
        private readonly IUserAuthorizationService _authorizationService;

        public UsersController(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<UsersController> logger,
            IUserAuthorizationService authorizationService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
            _authorizationService = authorizationService;
        }

        // GET: api/users - Listar usuarios según reglas de negocio
        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var (canManage, isRoot, isAdmin, currentSchema) = await _authorizationService.GetUserPermissionsAsync(currentUserId);

            IQueryable<ApplicationUser> query = _userManager.Users;

            // Lógica de aislamiento: Root ve todos, Admin solo ve su esquema
            if (!isRoot)
            {
                query = query.Where(u => u.NombreEsquema == currentSchema);
            }

            var users = await query.ToListAsync();
            var userDtos = new List<UserDto>();

            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                userDtos.Add(new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    NombreCompleto = user.NombreCompleto ?? string.Empty,
                    NombreEsquema = user.NombreEsquema ?? string.Empty,
                    Rol = roles.FirstOrDefault() ?? "Sin Rol",
                    EstaActivo = user.EstaActivo
                });
            }

            return Ok(userDtos);
        }

        // POST: api/users - Crear usuario
        [HttpPost]
        public async Task<ActionResult> CreateUser(CreateUserDto model)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId == null) return Unauthorized();

            var (canManage, isRoot, isAdmin, currentSchema) = await _authorizationService.GetUserPermissionsAsync(currentUserId);

            if (!canManage)
            {
                return Forbid("No tienes permisos para crear usuarios.");
            }

            // Determinar el esquema objetivo usando el servicio
            var targetSchema = _authorizationService.DetermineTargetSchema(isRoot, model.NombreEsquema, currentSchema);

            var newUser = new ApplicationUser
            {
                UserName = model.Email,
                Email = model.Email,
                NombreCompleto = model.NombreCompleto,
                NombreEsquema = targetSchema,
                EstaActivo = true,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(newUser, model.Password);

            if (!result.Succeeded)
            {
                var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("❌ Error al crear usuario: {Errors}", errorMsg);
                return BadRequest(result.Errors);
            }

            // Asignar Rol
            // Si es Admin creando usuario, no puede crear Roots, solo Admins o Vendedores
            var targetRole = model.Rol;
            if (!isRoot && targetRole == "Root") 
            {
                targetRole = "Vendedor"; // Downgrade forzoso si intenta pasarse de listo
            }

            if (await _roleManager.RoleExistsAsync(targetRole))
            {
                await _userManager.AddToRoleAsync(newUser, targetRole);
            }

            return Ok(new { message = "Usuario creado exitosamente" });
        }

        // PUT: api/users/{id} - Actualizar usuario
        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateUser(string id, UpdateUserDto model)
        {
            var currentUser = await _userManager.GetUserAsync(User);
            if (currentUser == null) return Unauthorized();

            var currentRoles = await _userManager.GetRolesAsync(currentUser);
            var isRoot = currentRoles.Contains("Root");
            var isAdmin = currentRoles.Contains("Admin");

            if (!isRoot && !isAdmin) return Forbid();

            var userToUpdate = await _userManager.FindByIdAsync(id);
            if (userToUpdate == null) return NotFound("Usuario no encontrado");

            // ⚠️ SEGURIDAD: Validar permisos usando el servicio centralizado
            if (!await _authorizationService.CanModifyUserAsync(currentUser.Id, id))
            {
                return Forbid("No tienes permisos para modificar este usuario.");
            }

            // Actualizar campos
            userToUpdate.NombreCompleto = model.NombreCompleto;
            userToUpdate.EstaActivo = model.EstaActivo;

            // Solo Root puede cambiar el schema
            if (isRoot && !string.IsNullOrEmpty(model.NombreEsquema))
            {
                userToUpdate.NombreEsquema = model.NombreEsquema;
            }

            var result = await _userManager.UpdateAsync(userToUpdate);
            if (!result.Succeeded) 
            {
                var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("❌ Error al actualizar usuario {Id}: {Errors}", id, errorMsg);
                return BadRequest(result.Errors);
            }

            // Actualizar Rol si cambió
            var currentUserRoles = await _userManager.GetRolesAsync(userToUpdate);
            var currentRole = currentUserRoles.FirstOrDefault();

            if (currentRole != model.Rol)
            {
                // Validación de jerarquía: Admin no puede asignar rol Root
                if (!isRoot && model.Rol == "Root")
                {
                    return BadRequest("No tienes permisos para asignar el rol Root.");
                }

                if (!string.IsNullOrEmpty(currentRole))
                {
                    await _userManager.RemoveFromRoleAsync(userToUpdate, currentRole);
                }
                
                if (await _roleManager.RoleExistsAsync(model.Rol))
                {
                    await _userManager.AddToRoleAsync(userToUpdate, model.Rol);
                }
            }

            return Ok(new { message = "Usuario actualizado exitosamente" });
        }

        // DELETE: api/users/{id} - Eliminar usuario
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteUser(string id)
        {
            try 
            {
                var currentUser = await _userManager.GetUserAsync(User);
                if (currentUser == null) return Unauthorized();

                var currentRoles = await _userManager.GetRolesAsync(currentUser);
                var isRoot = currentRoles.Contains("Root");
                var isAdmin = currentRoles.Contains("Admin");

                if (!isRoot && !isAdmin) return Forbid();

                var userToDelete = await _userManager.FindByIdAsync(id);
                if (userToDelete == null) return NotFound("Usuario no encontrado");

                // No autodestruirse
                if (userToDelete.Id == currentUser.Id)
                {
                    return BadRequest("No puedes eliminar tu propia cuenta.");
                }

                // ⚠️ SEGURIDAD: Validar permisos usando el servicio centralizado
                if (!await _authorizationService.CanModifyUserAsync(currentUser.Id, id))
                {
                    return Forbid("No tienes permisos para eliminar este usuario.");
                }

                var result = await _userManager.DeleteAsync(userToDelete);
                if (!result.Succeeded) 
                {
                    var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                    _logger.LogError("❌ Error al eliminar usuario {Id}: {Errors}", id, errorMsg);
                    return BadRequest(result.Errors);
                }

                return Ok(new { message = "Usuario eliminado correctamente" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Excepción crítica al eliminar usuario {Id}", id);
                // Si falla por FK constraint (ej. tiene ventas asociadas)
                return StatusCode(500, new { message = "No se puede eliminar el usuario porque tiene registros asociados (ventas, consultas, etc.)." });
            }
        }
    }
}
