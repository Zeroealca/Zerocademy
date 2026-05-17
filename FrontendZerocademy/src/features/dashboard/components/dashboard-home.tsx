"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/stores/use-auth-store";

export function DashboardHome() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Academic management foundation — modules will appear here as they are
          built.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Signed in as</CardTitle>
            <CardDescription>Current session</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{user?.email}</p>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {user?.role.toLowerCase().replace("_", " ")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform status</CardTitle>
            <CardDescription>Foundation release</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Authentication, users, and role-based access are active. Academic
              domains (students, grades, attendance) are not yet implemented.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
