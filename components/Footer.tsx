import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import Logo from "@/components/Logo";
import { config } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[#f0decc] bg-[#261f32] text-[#efe7dc]">
      <div className="section-shell py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-3 mb-5">
              <Logo className="h-11 w-auto" />
              <span className="text-xl font-semibold text-white">
                Maher <span className="text-primary">Marriage Bureau</span>
              </span>
            </Link>
            <p className="max-w-md leading-relaxed text-[#c8bed2]">
              Find your perfect life partner with Maher Marriage Bureau. We
              bring together compatible souls with trust, transparency, and
              technology.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-[#f8f1e8]">Quick Links</h3>
            <ul className="space-y-2.5 text-[#d7cfde]">
              <li>
                <Link
                  href="/profiles"
                  className="transition-colors hover:text-primary-light"
                >
                  Browse Profiles
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="transition-colors hover:text-primary-light"
                >
                  Register Now
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="transition-colors hover:text-primary-light"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-primary-light"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold mb-4 text-[#f8f1e8]">Contact</h3>
            <ul className="space-y-3 text-[#d7cfde]">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-light" />
                <span>{config.contact.supportEmail}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary-light" />
                <span>{config.contact.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-light" />
                <span>{config.contact.addressShort}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-[#3b324c] pt-8 text-center text-sm text-[#a89fba]">
          <p>
            &copy; {new Date().getFullYear()} Maher Marriage Bureau. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
