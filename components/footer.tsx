import { ThemeSwitcher } from "@/components/theme-switcher";

export function Footer() {
    return (
            <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>
            Need help? Contact us
            <a
              href="mailto:the.gnk.admin@gmail.com"
              className="font-bold hover:underline"
              rel="noreferrer"
            >
              : here
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
    );
}