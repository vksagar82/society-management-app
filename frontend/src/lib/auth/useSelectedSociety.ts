import { useAuth } from "./context";

export function useSelectedSociety() {
  const { selectedSocietyId, user } = useAuth();

  // For developers, use selected society
  // For others, use their assigned society
  const societyId =
    user?.global_role === "developer" ? selectedSocietyId : user?.society_id;

  return societyId;
}
