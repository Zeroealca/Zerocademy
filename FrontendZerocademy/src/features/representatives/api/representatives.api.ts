import { apiClient } from "@/lib/api-client";
import type {
  CreateRepresentativeStudentInput,
  RepresentativeStudent,
  UpdateRepresentativeStudentInput,
} from "@/features/representatives/types";

export function fetchMyRepresentativeStudents(): Promise<
  RepresentativeStudent[]
> {
  return apiClient<RepresentativeStudent[]>("/v1/representatives/me/students");
}

export function fetchStudentRepresentatives(
  studentId: string,
): Promise<RepresentativeStudent[]> {
  return apiClient<RepresentativeStudent[]>(
    `/v1/representatives/students/${studentId}`,
  );
}

export function createStudentRepresentative(
  studentId: string,
  payload: CreateRepresentativeStudentInput,
): Promise<RepresentativeStudent> {
  return apiClient<RepresentativeStudent>(
    `/v1/representatives/students/${studentId}`,
    { method: "POST", body: payload },
  );
}

export function updateStudentRepresentative(
  relationshipId: string,
  payload: UpdateRepresentativeStudentInput,
): Promise<RepresentativeStudent> {
  return apiClient<RepresentativeStudent>(
    `/v1/representatives/${relationshipId}`,
    { method: "PATCH", body: payload },
  );
}

export function deactivateStudentRepresentative(
  relationshipId: string,
): Promise<void> {
  return apiClient<void>(`/v1/representatives/${relationshipId}`, {
    method: "DELETE",
  });
}
