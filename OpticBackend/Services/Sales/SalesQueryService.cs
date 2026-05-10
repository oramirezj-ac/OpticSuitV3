using Microsoft.EntityFrameworkCore;
using OpticBackend.Data;
using OpticBackend.Models;
using OpticBackend.Services.Interfaces;

namespace OpticBackend.Services.Sales
{
    public class SalesQueryService : ISalesQueryService
    {
        private readonly ApplicationDbContext _context;

        public SalesQueryService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Sale?> GetSaleByIdAsync(Guid id)
        {
            return await _context.Ventas
                .Include(v => v.Paciente)
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .Include(v => v.Detalles)
                .Include(v => v.Abonos)
                .Include(v => v.Comisiones)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<IEnumerable<Sale>> GetSalesByPatientAsync(Guid patientId)
        {
            return await _context.Ventas
                .Include(s => s.Detalles)
                .Include(s => s.Abonos)
                .Include(s => s.Comisiones)
                .Include(s => s.Paciente)
                .Include(s => s.Consulta)
                .ThenInclude(c => c.Paciente)
                .Where(s => s.PacienteId == patientId || s.Consulta.PacienteId == patientId || s.Detalles.Any(d => d.PacienteId == patientId))
                .OrderByDescending(s => s.Fecha)
                .ToListAsync();
        }

        public async Task<IEnumerable<Sale>> GetRecentSalesAsync(int count = 20)
        {
            return await _context.Ventas
                .Include(v => v.Paciente)
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .Include(v => v.Comisiones)
                .OrderByDescending(v => v.Fecha)
                .Take(count)
                .ToListAsync();
        }

        public async Task<IEnumerable<Sale>> SearchSalesByFolioAsync(string folio)
        {
            if (string.IsNullOrEmpty(folio)) return new List<Sale>();

            // Regla: mostrar todas las notas que coincidan (duplicados incluidos)
            return await _context.Ventas
                .Include(v => v.Paciente)
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .Where(v => v.FolioFisico == folio || v.FolioFisico.StartsWith(folio + "-D"))
                .OrderByDescending(v => v.Fecha)
                .ToListAsync();
        }

        public async Task<IEnumerable<int>> GetSalesYearsAsync()
        {
            return await _context.Ventas
                .Where(v => v.Fecha.HasValue && !(v.FolioFisico != null && v.FolioFisico.StartsWith("VM-")))
                .Select(v => v.Fecha.Value.Year)
                .Distinct()
                .OrderByDescending(y => y)
                .ToListAsync();
        }

        public async Task<IEnumerable<Sale>> GetSalesByYearAsync(int year)
        {
            var sales = await _context.Ventas
                .Include(v => v.Paciente)
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .Where(v => v.Fecha.HasValue && v.Fecha.Value.Year == year)
                .ToListAsync();

            var filteredSales = sales.Where(v => {
                if (string.IsNullOrEmpty(v.FolioFisico)) return true;
                string folio = v.FolioFisico.ToUpper().Trim();
                return !(folio.StartsWith("VM-") || folio.StartsWith("MED-") || folio.StartsWith("CL-"));
            }).ToList();

            return filteredSales.OrderByDescending(v => {
                if (string.IsNullOrEmpty(v.FolioFisico)) return "";
                var baseFolio = v.FolioFisico.Split("-D")[0];
                return baseFolio.PadLeft(4, '0') + (v.FolioFisico.Contains("-D") ? v.FolioFisico : "");
            });
        }

        public async Task<IEnumerable<Sale>> GetDescendingSalesAsync()
        {
            var sales = await _context.Ventas
                .Include(v => v.Paciente)
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .ToListAsync();

            var filteredSales = sales.Where(v => {
                if (string.IsNullOrEmpty(v.FolioFisico)) return false;
                string folio = v.FolioFisico.ToUpper().Trim();
                return !(folio.StartsWith("VM-") || folio.StartsWith("MED-") || folio.StartsWith("CL-"));
            }).ToList();

            return filteredSales.OrderByDescending(v => {
                var baseFolio = v.FolioFisico.Split("-D")[0];
                return baseFolio.PadLeft(4, '0') + (v.FolioFisico.Contains("-D") ? v.FolioFisico : "");
            });
        }

        public async Task<IEnumerable<Sale>> GetSalesByRangeAsync(string startFolio, string endFolio)
        {
            var sales = await _context.Ventas
                .Include(v => v.Paciente)
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .ToListAsync();

            string startPadded = (startFolio ?? "").PadLeft(4, '0');
            string endPadded = (endFolio ?? "").PadLeft(4, '0');

            var filteredSales = sales.Where(v => {
                if (string.IsNullOrEmpty(v.FolioFisico)) return false;
                string folio = v.FolioFisico.ToUpper().Trim();
                if (folio.StartsWith("VM-") || folio.StartsWith("MED-") || folio.StartsWith("CL-")) return false;

                var baseFolio = folio.Split("-D")[0].PadLeft(4, '0');
                
                return string.Compare(baseFolio, startPadded) >= 0 && string.Compare(baseFolio, endPadded) <= 0;
            }).ToList();

            return filteredSales.OrderByDescending(v => {
                var baseFolio = v.FolioFisico.Split("-D")[0];
                return baseFolio.PadLeft(4, '0') + (v.FolioFisico.Contains("-D") ? v.FolioFisico : "");
            });
        }

        public async Task<IEnumerable<Sale>> GetCounterSalesAsync()
        {
            return await _context.Ventas
                .Include(v => v.Paciente)
                .Where(v => v.FolioFisico != null && v.FolioFisico.StartsWith("VM-"))
                .ToListAsync();
        }
        
        public async Task<IEnumerable<Sale>> GetConsultationSalesAsync()
        {
            var sales = await _context.Ventas
                .Include(v => v.Paciente)
                .Include(v => v.Consulta)
                .ThenInclude(c => c.Paciente)
                .ToListAsync();

            return sales.Where(v => {
                if (string.IsNullOrEmpty(v.FolioFisico)) return false;
                string folio = v.FolioFisico.ToUpper().Trim();
                return folio.StartsWith("MED-") || folio.StartsWith("CL-");
            }).OrderByDescending(v => v.Fecha);
        }
    }
}
