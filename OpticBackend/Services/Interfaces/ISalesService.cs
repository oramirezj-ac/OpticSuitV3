using OpticBackend.Dtos.Sales;
using OpticBackend.Models;

namespace OpticBackend.Services.Interfaces
{
    public interface ISalesService
    {
        Task<Sale> CreateSaleAsync(CreateSaleDto model);
        Task<IEnumerable<Sale>> GetSalesByPatientAsync(Guid patientId);
        Task<Sale?> GetSaleByIdAsync(Guid id);
        Task<Sale?> UpdateSaleAsync(Guid id, UpdateSaleDto model);
        Task<bool> DeleteSaleAsync(Guid id);
        Task<IEnumerable<Sale>> GetRecentSalesAsync(int count = 20);
        Task<IEnumerable<Sale>> SearchSalesByFolioAsync(string folio);
        Task<IEnumerable<int>> GetSalesYearsAsync();
        Task<IEnumerable<Sale>> GetSalesByYearAsync(int year);
        Task<IEnumerable<Sale>> GetDescendingSalesAsync();
        Task<IEnumerable<Sale>> GetSalesByRangeAsync(string startFolio, string endFolio);
        Task<IEnumerable<Sale>> GetCounterSalesAsync();
        Task<IEnumerable<Sale>> GetConsultationSalesAsync();
        Task<Sale?> CreateCounterSaleAsync(string concept, decimal amount, DateTime date, string userId);
        Task<Sale?> RegisterCancelledFolioAsync(string folio, DateTime date, string userId);

        // Pagos / Abonos
        Task<Sale?> AddPaymentAsync(Guid saleId, CreatePaymentDto model);
        Task<Sale?> UpdatePaymentAsync(Guid saleId, Guid paymentId, UpdatePaymentDto model);
        Task<Sale?> DeletePaymentAsync(Guid saleId, Guid paymentId);
    }
}
