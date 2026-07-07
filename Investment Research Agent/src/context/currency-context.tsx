import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Currency = "USD" | "INR" | "EUR" | "GBP";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencySymbol: string;
  formatCurrency: (amount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

const STORAGE_KEY = "app_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load currency from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Currency | null;
    if (saved && Object.keys(CURRENCY_SYMBOLS).includes(saved)) {
      setCurrencyState(saved);
    }
    setIsLoaded(true);
  }, []);

  // Save currency to localStorage when it changes
  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem(STORAGE_KEY, newCurrency);
    // Dispatch custom event for other parts of app to react
    window.dispatchEvent(new CustomEvent("currencyChange", { detail: { currency: newCurrency } }));
  };

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  const formatCurrency = (amount: number): string => {
    return `${currencySymbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        currencySymbol,
        formatCurrency,
      }}
    >
      {isLoaded && children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
