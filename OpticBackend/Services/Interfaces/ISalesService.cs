using OpticBackend.Dtos.Sales;
using OpticBackend.Models;

namespace OpticBackend.Services.Interfaces
{
    public interface ISalesService
    {
        Task<Sale> CreateSaleAsync(CreateSaleDto model);
        Task<IEnumerable<Sale>> GetSalesByPatientAsync(Guid patientId);
        Task<Sale?> GetSaleByIdAsync(Guid id);
    }
}
