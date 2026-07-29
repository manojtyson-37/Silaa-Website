"use client";

import { Customer } from "@/lib/api";
import { Input, Card, Table, Th } from "@/components/ui";
import { useState } from "react";
import { ShoppingCart, Search } from "lucide-react";
import AddCustomerForm from "./AddCustomerForm";

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Search size={16} />
          </div>
          <Input 
            className="pl-9" 
            placeholder="Search customers..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <AddCustomerForm />
      </div>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Contact Details</Th>
                <Th>Address</Th>
                <Th>Abandoned Carts</Th>
                <Th>First Added</Th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">{customer.name}</td>
                  <td className="py-3 px-4 text-sm">
                    {customer.email && <div className="text-foreground">{customer.email}</div>}
                    {customer.phone && <div className="text-muted-foreground">{customer.phone}</div>}
                    {!customer.email && !customer.phone && "—"}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                    {customer.address || "—"}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {customer.abandoned_carts.length > 0 ? (
                      <button 
                        onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full text-xs font-medium"
                      >
                        <ShoppingCart size={14} />
                        {customer.abandoned_carts.length} Cart{customer.abandoned_carts.length !== 1 && "s"}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(customer.created_at || "").toLocaleDateString()}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Expanded view for carts */}
      {expandedId !== null && (
        <Card className="p-6 bg-slate-50 border-blue-100">
          <h3 className="font-semibold text-sm mb-4 text-blue-900">
            Abandoned Carts for {customers.find(c => c.id === expandedId)?.name}
          </h3>
          <div className="space-y-4">
            {customers.find(c => c.id === expandedId)?.abandoned_carts.map((cart) => (
              <div key={cart.id} className="bg-white p-4 rounded-lg border border-border shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Drop-off Time: {new Date(cart.drop_off_time).toLocaleString()}
                  </div>
                  <div className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                    {cart.status}
                  </div>
                </div>
                <div className="text-sm bg-slate-50 p-3 rounded text-slate-700 font-mono">
                  {typeof cart.items === 'string' ? cart.items : JSON.stringify(cart.items, null, 2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
