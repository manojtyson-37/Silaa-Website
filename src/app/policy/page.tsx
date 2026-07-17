import Reveal from "@/components/Reveal";

export const metadata = { title: "Policies — SILA Collective" };

const sections = [
  {
    title: "Shipping",
    body: "Orders are dispatched within 2–4 business days. Prepaid orders ship free across India; COD orders may carry a small collection fee. Tracking details are shared once your order is on its way.",
  },
  {
    title: "Exchanges",
    body: "Wrong size? We offer easy size exchanges within 7 days of delivery, provided the item is unworn, unwashed and has its tags intact. DM us on Instagram or email with your order details to start an exchange.",
  },
  {
    title: "Returns & Refunds",
    body: "Items with a genuine manufacturing defect are eligible for a refund or replacement — share an unboxing video or photos within 48 hours of delivery. Refunds for prepaid orders are processed back to the original payment method within 5–7 business days.",
  },
  {
    title: "Cash on Delivery",
    body: "COD is available on most pincodes. We may call to confirm your order before dispatch. Repeated refusal of COD parcels may limit COD availability on future orders.",
  },
  {
    title: "Privacy",
    body: "Your details are used only to process and deliver your order. We never sell or share your personal information with third parties beyond our delivery and payment partners.",
  },
];

export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-8 pt-12 pb-20">
      <Reveal>
        <h1 className="font-serif text-6xl sm:text-7xl">
          The fine <span className="italic text-gold">print</span>
        </h1>
      </Reveal>
      <div className="mt-12 divide-y divide-ink/10">
        {sections.map((s, i) => (
          <Reveal key={s.title} delay={i * 80}>
            <div className="py-8">
              <h2 className="font-serif text-2xl mb-3">{s.title}</h2>
              <p className="text-smoke leading-relaxed text-sm">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
