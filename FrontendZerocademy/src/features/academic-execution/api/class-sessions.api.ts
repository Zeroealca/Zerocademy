import { apiClient } from "@/lib/api-client";
import type {
  ClassSession,
  CreateClassSessionInput,
  UpdateClassSessionInput,
} from "@/features/academic-execution/types";

const classSessionsPath = (teacherAssignmentId: string) =>
  `/v1/teacher-assignments/${teacherAssignmentId}/class-sessions`;

export const fetchClassSessions = (teacherAssignmentId: string) =>
  apiClient<ClassSession[]>(classSessionsPath(teacherAssignmentId));

export const fetchClassSession = (
  teacherAssignmentId: string,
  classSessionId: string,
) =>
  apiClient<ClassSession>(
    `${classSessionsPath(teacherAssignmentId)}/${classSessionId}`,
  );

export const createClassSession = (
  teacherAssignmentId: string,
  payload: CreateClassSessionInput,
) =>
  apiClient<ClassSession>(classSessionsPath(teacherAssignmentId), {
    method: "POST",
    body: payload,
  });

export const updateClassSession = (
  teacherAssignmentId: string,
  classSessionId: string,
  payload: UpdateClassSessionInput,
) =>
  apiClient<ClassSession>(
    `${classSessionsPath(teacherAssignmentId)}/${classSessionId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
