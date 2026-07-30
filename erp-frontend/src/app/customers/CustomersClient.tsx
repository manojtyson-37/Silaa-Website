"use client";

import { Customer } from "@/lib/api";
import { Input, Card, Table, Th } from "@/components/ui";
import { useState, Fragment } from "react";
import { ShoppingCart, Search } from "lucide-react";
import AddCustomerForm from "./AddCustomerForm";
import BulkUploadCustomers from "./BulkUploadCustomers";

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
        <div className="flex items-center gap-2">
          <BulkUploadCustomers />
          <AddCustomerForm />
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Address</Th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <Fragment key={customer.id}>
                    <tr 
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
                    >
                      <td className="py-3 px-4 text-sm font-medium">{customer.name}</td>
                      <td className="py-3 px-4 text-sm">
                        {customer.email || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {customer.phone || "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground max-w-xs truncate">
                        {customer.address || "—"}
                      </td>
                    </tr>
                    {expandedId === customer.id && (
                      <tr className="bg-muted/10">
                        <td colSpan={4} className="p-4 border-b border-border">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1 font-medium">Customer Details</p>
                              <p><strong>Added On:</strong> {new Date(customer.created_at || "").toLocaleDateString()}</p>
                              <p><strong>Total Orders:</strong> 0 (WIP)</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1 font-medium">Full Address</p>
                              <p className="whitespace-pre-wrap">{customer.address || "No address on file"}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
