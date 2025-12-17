export const getMaxViewsHelper = (viewSetting: string): number => {
  switch (viewSetting) {
    case "1 (Burn)":
      return 1;
    case "5 Views":
      return 5;
    case "10 Views":
      return 10;
    case "Unlimited":
      return -1; // -1 indicates unlimited
    default:
      return 1;
  }
};

export const getExpirationTime = (expirationSetting: string): Date | null => {
  const now = new Date();
  switch (expirationSetting) {
    case "1 Hour":
      return new Date(now.getTime() + 60 * 60 * 1000);
    case "24 Hours":
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case "7 Days":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "Never":
      return null;
    default:
      return new Date(now.getTime() + 60 * 60 * 1000); // Default to 1 hour
  }
};
