import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in | Duolingo Clone",
  description: "Log in to continue learning",
};

export default function LoginPage() {
  return <LoginForm />;
}
