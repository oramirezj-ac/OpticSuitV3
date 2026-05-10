using OpticBackend.Models;

namespace OpticBackend.Services.Interfaces
{
    public interface ISalesQueryService
    {
        Task<IEnumerable<Sale>> GetSalesByPatientAsync(Guid patientId);
        Task<Sale?> GetSaleByIdAsync(Guid id);
        Task<IEnumerable<Sale>> GetRecentSalesAsync(int count = 20);
        Task<IEnumerable<Sale>> SearchSalesByFolioAsync(string folio);
        Task<IEnumerable<int>> GetSalesYearsAsync();
        Task<IEnumerable<Sale>> GetSalesByYearAsync(int year);
        Task<IEnumerable<Sale>> GetDescendingSalesAsync();
        Task<IEnumerable<Sale>> GetSalesByRangeAsync(string startFolio, string endFolio);
        Task<IEnumerable<Sale>> GetCounterSalesAsync();
        Task<IEnumerable<Sale>> GetConsultationSalesAsync();
    }
}
