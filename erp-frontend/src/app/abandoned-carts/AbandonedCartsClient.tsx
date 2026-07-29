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
              <Th>Amount</Th>
            </tr>
          </thead>
          <tbody>
            {carts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-muted-foreground">
                  No abandoned carts recorded.
                </td>
              </tr>
            ) : (
              carts.map((cart) => {
                const totalAmount = Array.isArray(cart.items) ? cart.items.reduce((sum: number, item: any) => sum + (item.price || 0) * (item.qty || 1), 0) : 0;
                return (
                  <tr key={cart.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">
                      {cart.customer.name}
                      <div className="text-xs text-muted-foreground font-normal">
                        {cart.customer.email && <div>{cart.customer.email}</div>}
                        {cart.customer.phone && <div>{cart.customer.phone}</div>}
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
                          <ul className="list-disc pl-4 space-y-1 text-xs">
                            {cart.items.map((item: any, i: number) => (
                              <li key={i}>
                                {item.qty}x {item.name || `Variant #${item.variantId}`} 
                                <span className="text-muted-foreground ml-1">
                                  {item.size ? `[${item.size}]` : ""} {item.color ? `(${item.color})` : ""} - ₹{item.price || 0}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          "No items recorded"
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold">
                      ₹{totalAmount.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}
