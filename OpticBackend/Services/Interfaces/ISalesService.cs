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

        // Pagos / Abonos
        Task<Sale?> AddPaymentAsync(Guid saleId, CreatePaymentDto model);
        Task<Sale?> UpdatePaymentAsync(Guid saleId, Guid paymentId, UpdatePaymentDto model);
        Task<Sale?> DeletePaymentAsync(Guid saleId, Guid paymentId);
    }
}
