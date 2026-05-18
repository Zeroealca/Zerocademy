"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "@/features/users/api/users.api";
import { usersKeys } from "@/features/users/api/users.keys";
import type { CreateUserInput } from "@/features/users/schemas/create-user.schema";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}
