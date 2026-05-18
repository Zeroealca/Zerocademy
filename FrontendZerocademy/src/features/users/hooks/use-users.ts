"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "@/features/users/api/users.api";
import { usersKeys } from "@/features/users/api/users.keys";
import type { UsersFilters } from "@/features/users/types";

export function useUsers(filters: UsersFilters) {
  return useQuery({
    queryKey: usersKeys.list(filters),
    queryFn: () => fetchUsers(filters),
  });
}
