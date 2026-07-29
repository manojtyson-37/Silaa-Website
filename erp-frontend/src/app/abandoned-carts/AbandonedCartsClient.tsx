"use client";

import { Card, Table, Th } from "@/components/ui";

export default function AbandonedCartsClient({ carts }: { carts: any[] }) {
  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Drop-off Time</Th>
              <Th>Status</Th>
              <Th>Items Left Behind</Th>
            </tr>
          </thead>
          <tbody>
            {carts.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                  No abandoned carts recorded.
                </td>
              </tr>
            ) : (
              carts.map((cart) => (
                <tr key={cart.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">
                    {cart.customer.name}
                    <div className="text-xs text-muted-foreground font-normal">
                      {cart.customer.email || cart.customer.phone || ""}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(cart.drop_off_time).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full capitalize">
                      {cart.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <div className="bg-slate-50 p-2 rounded text-slate-700 max-h-24 overflow-y-auto">
                      {Array.isArray(cart.items) && cart.items.length > 0 ? (
                        <ul className="list-disc pl-4 space-y-1">
                          {cart.items.map((item: any, i: number) => (
                            <li key={i}>
                              {item.qty}x {item.name || `Variant #${item.variantId}`} {item.color ? `(${item.color})` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        "No items recorded"
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
