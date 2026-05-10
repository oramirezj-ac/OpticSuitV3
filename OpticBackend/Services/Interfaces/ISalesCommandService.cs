using OpticBackend.Dtos.Sales;
using OpticBackend.Models;

namespace OpticBackend.Services.Interfaces
{
    public interface ISalesCommandService
    {
        Task<Sale> CreateSaleAsync(CreateSaleDto model);
        Task<Sale?> UpdateSaleAsync(Guid id, UpdateSaleDto model);
        Task<bool> DeleteSaleAsync(Guid id);
        Task<Sale?> CreateCounterSaleAsync(string concept, decimal amount, DateTime date, string userId);
        Task<Sale?> RegisterCancelledFolioAsync(string folio, DateTime date, string userId);
    }
}
