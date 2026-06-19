import React, { createContext, useContext, useMemo, useState } from "react";

type VehicleFilterContextValue = {
  selectedVehicleId: string | null;
  setSelectedVehicleId: (vehicleId: string | null) => void;
};

const VehicleFilterContext = createContext<VehicleFilterContextValue | null>(
  null,
);

export function VehicleFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );

  const value = useMemo(
    () => ({
      selectedVehicleId,
      setSelectedVehicleId,
    }),
    [selectedVehicleId],
  );

  return (
    <VehicleFilterContext.Provider value={value}>
      {children}
    </VehicleFilterContext.Provider>
  );
}

export function useVehicleFilter() {
  const value = useContext(VehicleFilterContext);

  if (!value) {
    throw new Error(
      "useVehicleFilter debe usarse dentro de VehicleFilterProvider",
    );
  }

  return value;
}
