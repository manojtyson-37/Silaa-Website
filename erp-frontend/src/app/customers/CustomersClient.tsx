"use client";

import { Customer } from "@/lib/api";
import { useERP } from "@/lib/useERP";
import { PageHeader, Input, Card, Table, Th } from "@/components/ui";
import { useState, Fragment } from "react";
import { Search } from "lucide-react";
import AddCustomerForm from "./AddCustomerForm";
import BulkUploadCustomers from "./BulkUploadCustomers";

export default function CustomersClient({ token }: { token: string }) {
  const { data: customers = [] } = useERP<Customer[]>("/customers", token);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Customers & CRM"
        subtitle={`${customers.length} customer${customers.length === 1 ? "" : "s"} tracked`}
      />
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
                <Th>Phone</Th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-muted-foreground">
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
                        {customer.phone || "—"}
                      </td>
                    </tr>
                    {expandedId === customer.id && (
                      <tr className="bg-muted/10">
                        <td colSpan={2} className="p-4 border-b border-border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wider">Customer Info</p>
                                <p><strong>Email:</strong> {customer.email || "No email provided"}</p>
                                <p><strong>Added On:</strong> {new Date(customer.created_at || "").toLocaleDateString()}</p>
                                <p><strong>Total Orders:</strong> 0 (WIP)</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-muted-foreground mb-1 text-xs font-semibold uppercase tracking-wider">Address Details</p>
                                <p className="whitespace-pre-wrap leading-relaxed">{customer.address || "No address on file"}</p>
                              </div>
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
