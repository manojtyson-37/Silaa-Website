"use client";
import dynamic from "next/dynamic";

const ExpenseClient = dynamic(() => import("./ExpenseClient"), { ssr: false });

export default function ExpenseClientWrapper({ token }: { token: string }) {
  return <ExpenseClient token={token} />;
}
