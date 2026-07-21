import { WHATSAPP_URL } from "@/lib/contact";

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/40 animate-whatsapp-glow motion-reduce:animate-none transition-transform duration-300 hover:scale-110"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full bg-[#25D366] opacity-60 animate-ping motion-reduce:animate-none"
      />
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="relative h-6 w-6 sm:h-7 sm:w-7 fill-white"
      >
        <path d="M16.004 3C9.377 3 4 8.373 4 15c0 2.386.7 4.61 1.912 6.48L4 29l7.72-1.876A11.93 11.93 0 0 0 16.004 27C22.63 27 28 21.627 28 15S22.63 3 16.004 3Zm0 21.818a9.77 9.77 0 0 1-4.98-1.365l-.357-.212-4.583 1.113 1.14-4.47-.233-.366A9.78 9.78 0 0 1 6.18 15c0-5.421 4.403-9.818 9.824-9.818 5.42 0 9.822 4.397 9.822 9.818 0 5.421-4.402 9.818-9.822 9.818Zm5.4-7.354c-.296-.148-1.75-.864-2.022-.963-.271-.099-.469-.148-.667.148-.198.296-.766.963-.94 1.161-.173.198-.346.222-.642.074-.296-.148-1.249-.46-2.38-1.468-.879-.784-1.473-1.752-1.646-2.048-.173-.296-.019-.456.13-.603.133-.132.296-.346.444-.519.148-.173.198-.296.296-.494.099-.198.05-.371-.025-.519-.074-.148-.667-1.608-.914-2.202-.241-.579-.486-.5-.667-.51l-.568-.01c-.198 0-.519.074-.79.371-.271.296-1.037 1.013-1.037 2.472s1.062 2.867 1.21 3.065c.148.198 2.09 3.19 5.062 4.474.707.305 1.258.487 1.688.623.709.226 1.354.194 1.864.118.569-.085 1.75-.715 1.997-1.406.247-.692.247-1.284.173-1.407-.074-.123-.271-.198-.568-.346Z" />
      </svg>
    </a>
  );
}
