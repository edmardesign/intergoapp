import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useServerFn } from "@tanstack/react-query" with { "resolution-mode": "import" };

export const Route = createFileRoute("/painel/")({
  component: () => null,
});
