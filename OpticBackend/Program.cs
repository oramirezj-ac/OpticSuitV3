using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Models;

var builder = WebApplication.CreateBuilder(args);

// --- 1. CONFIGURACIÓN DE SERVICIOS ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

// CORS: Configuración más robusta
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://optica-v3.local" 
            )   
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// --- 2. SEEDING ---
using (var scope = app.Services.CreateScope())
{
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var adminEmail = "admin@galileo.com";
    if (userManager.FindByEmailAsync(adminEmail).GetAwaiter().GetResult() == null)
    {
        var admin = new ApplicationUser { UserName = adminEmail, Email = adminEmail, NombreCompleto = "Admin", EmailConfirmed = true };
        userManager.CreateAsync(admin, "Password123!").GetAwaiter().GetResult();
    }
}

// --- 3. MIDDLEWARES (EL ORDEN ES CRÍTICO) ---
app.UseCors("AllowFrontend"); // Primero el CORS

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();

// IMPORTANTE: .RequireCors("AllowFrontend") asegura que Identity responda al Preflight
app.MapGroup("/auth")
   .MapIdentityApi<ApplicationUser>()
   .RequireCors("AllowFrontend"); 

app.MapControllers();

app.Run();