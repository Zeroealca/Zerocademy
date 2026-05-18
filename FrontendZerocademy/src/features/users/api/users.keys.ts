import type { UsersFilters } from "@/features/users/types";

export const usersKeys = {
  all: ["users"] as const,
  lists: () => [...usersKeys.all, "list"] as const,
  list: (filters: UsersFilters) => [...usersKeys.lists(), filters] as const,
};
