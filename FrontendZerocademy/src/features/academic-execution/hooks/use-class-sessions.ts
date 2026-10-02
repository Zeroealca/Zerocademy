"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createClassSession,
  fetchClassSession,
  fetchClassSessions,
  updateClassSession,
  fetchClassSessionAttendance,
  replaceClassSessionAttendance,
} from "@/features/academic-execution/api/class-sessions.api";
import { classSessionsKeys } from "@/features/academic-execution/api/class-sessions.keys";
import type {
  CreateClassSessionInput,
  UpdateClassSessionInput,
  ReplaceClassSessionAttendanceInput,
} from "@/features/academic-execution/types";

export function useClassSessions(teacherAssignmentId: string) {
  return useQuery({
    queryKey: classSessionsKeys.list(teacherAssignmentId),
    queryFn: () => fetchClassSessions(teacherAssignmentId),
    enabled: Boolean(teacherAssignmentId),
  });
}

export function useClassSessionAttendance(
  teacherAssignmentId: string,
  classSessionId: string,
) {
  return useQuery({
    queryKey: classSessionsKeys.attendance(teacherAssignmentId, classSessionId),
    queryFn: () =>
      fetchClassSessionAttendance(teacherAssignmentId, classSessionId),
    enabled: Boolean(teacherAssignmentId && classSessionId),
  });
}

export function useReplaceClassSessionAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      teacherAssignmentId,
      classSessionId,
      payload,
    }: {
      teacherAssignmentId: string;
      classSessionId: string;
      payload: ReplaceClassSessionAttendanceInput;
    }) =>
      replaceClassSessionAttendance(
        teacherAssignmentId,
        classSessionId,
        payload,
      ),
    onSuccess: (_, { teacherAssignmentId, classSessionId }) =>
      queryClient.invalidateQueries({
        queryKey: classSessionsKeys.attendance(
          teacherAssignmentId,
          classSessionId,
        ),
      }),
  });
}

export function useClassSession(
  teacherAssignmentId: string,
  classSessionId: string,
) {
  return useQuery({
    queryKey: classSessionsKeys.detail(teacherAssignmentId, classSessionId),
    queryFn: () => fetchClassSession(teacherAssignmentId, classSessionId),
    enabled: Boolean(teacherAssignmentId && classSessionId),
  });
}

function useInvalidateClassSessions() {
  const queryClient = useQueryClient();

  return (teacherAssignmentId: string) =>
    queryClient.invalidateQueries({
      queryKey: classSessionsKeys.list(teacherAssignmentId),
    });
}

export function useCreateClassSession() {
  const invalidateClassSessions = useInvalidateClassSessions();

  return useMutation({
    mutationFn: ({
      teacherAssignmentId,
      payload,
    }: {
      teacherAssignmentId: string;
      payload: CreateClassSessionInput;
    }) => createClassSession(teacherAssignmentId, payload),
    onSuccess: (_, { teacherAssignmentId }) =>
      invalidateClassSessions(teacherAssignmentId),
  });
}

export function useUpdateClassSession() {
  const queryClient = useQueryClient();
  const invalidateClassSessions = useInvalidateClassSessions();

  return useMutation({
    mutationFn: ({
      teacherAssignmentId,
      classSessionId,
      payload,
    }: {
      teacherAssignmentId: string;
      classSessionId: string;
      payload: UpdateClassSessionInput;
    }) => updateClassSession(teacherAssignmentId, classSessionId, payload),
    onSuccess: (_, { teacherAssignmentId, classSessionId }) => {
      void queryClient.invalidateQueries({
        queryKey: classSessionsKeys.detail(teacherAssignmentId, classSessionId),
      });
      return invalidateClassSessions(teacherAssignmentId);
    },
  });
}
