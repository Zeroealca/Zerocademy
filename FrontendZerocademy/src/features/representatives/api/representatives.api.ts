import { apiClient } from "@/lib/api-client";
import type { RepresentativeStudent } from "@/features/representatives/types";

export function fetchMyRepresentativeStudents(): Promise<RepresentativeStudent[]> {
  return apiClient<RepresentativeStudent[]>("/v1/representatives/me/students");
}
