using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpticBackend.Migrations
{
    /// <inheritdoc />
    public partial class MapExistingPatients : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Only add columns that are missing in the existing database
            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "direccion",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ocupacion",
                table: "pacientes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "notas",
                table: "pacientes",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "configuracion_sistema");

            migrationBuilder.DropTable(
                name: "pacientes");

            migrationBuilder.DropColumn(
                name: "NombreEsquema",
                table: "AspNetUsers");
        }
    }
}
