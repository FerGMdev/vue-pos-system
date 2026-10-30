import { useConfigStore } from "@/stores/config";
import { formatCurrency } from "@/utils/format";

export function useCurrency() {
  const configStore = useConfigStore();
  return (value) =>
    formatCurrency(value, {
      currency: configStore.currency,
      locale: configStore.locale,
    });
}
